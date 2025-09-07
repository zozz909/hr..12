import { executeQuery } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { createGzip, createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'

export interface BackupConfig {
  outputDir: string
  retentionDays: number
  compressionEnabled: boolean
  includeUploads: boolean
  excludeTables?: string[]
}

export interface BackupInfo {
  id: string
  filename: string
  size: number
  createdAt: string
  type: 'full' | 'incremental'
  status: 'completed' | 'failed' | 'in_progress'
  metadata?: Record<string, any>
}

export class BackupManager {
  private config: BackupConfig
  private backupDir: string

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      outputDir: config.outputDir || './backups',
      retentionDays: config.retentionDays || 30,
      compressionEnabled: config.compressionEnabled ?? true,
      includeUploads: config.includeUploads ?? true,
      excludeTables: config.excludeTables || [],
    }
    
    this.backupDir = path.resolve(this.config.outputDir)
  }

  // Initialize backup directory
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
      console.log(`Backup directory initialized: ${this.backupDir}`)
    } catch (error) {
      console.error('Failed to initialize backup directory:', error)
      throw error
    }
  }

  // Create full database backup
  async createFullBackup(): Promise<BackupInfo> {
    const backupId = `backup_${Date.now()}`
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${backupId}_${timestamp}.sql${this.config.compressionEnabled ? '.gz' : ''}`
    const filepath = path.join(this.backupDir, filename)

    console.log(`Starting full backup: ${filename}`)

    try {
      // Get database structure and data
      const tables = await this.getDatabaseTables()
      let sqlDump = this.generateSQLHeader()

      // Export each table
      for (const table of tables) {
        if (this.config.excludeTables?.includes(table)) {
          continue
        }

        console.log(`Backing up table: ${table}`)
        
        // Get table structure
        const createTableSQL = await this.getTableStructure(table)
        sqlDump += `\n-- Table structure for ${table}\n`
        sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`
        sqlDump += createTableSQL + '\n\n'

        // Get table data
        const tableData = await this.getTableData(table)
        if (tableData.length > 0) {
          sqlDump += `-- Data for table ${table}\n`
          sqlDump += `LOCK TABLES \`${table}\` WRITE;\n`
          sqlDump += this.generateInsertStatements(table, tableData)
          sqlDump += `UNLOCK TABLES;\n\n`
        }
      }

      // Write backup file
      if (this.config.compressionEnabled) {
        await this.writeCompressedFile(filepath, sqlDump)
      } else {
        await fs.writeFile(filepath, sqlDump, 'utf8')
      }

      // Get file size
      const stats = await fs.stat(filepath)
      
      // Create backup info
      const backupInfo: BackupInfo = {
        id: backupId,
        filename,
        size: stats.size,
        createdAt: new Date().toISOString(),
        type: 'full',
        status: 'completed',
        metadata: {
          tables: tables.length,
          compressed: this.config.compressionEnabled,
        },
      }

      // Save backup metadata
      await this.saveBackupMetadata(backupInfo)

      console.log(`Full backup completed: ${filename} (${this.formatFileSize(stats.size)})`)
      return backupInfo

    } catch (error) {
      console.error('Full backup failed:', error)
      
      // Clean up failed backup file
      try {
        await fs.unlink(filepath)
      } catch {}

      throw error
    }
  }

  // Restore database from backup
  async restoreFromBackup(backupFilename: string): Promise<void> {
    const filepath = path.join(this.backupDir, backupFilename)
    
    console.log(`Starting restore from: ${backupFilename}`)

    try {
      // Check if backup file exists
      await fs.access(filepath)

      // Read backup file
      let sqlContent: string
      if (backupFilename.endsWith('.gz')) {
        sqlContent = await this.readCompressedFile(filepath)
      } else {
        sqlContent = await fs.readFile(filepath, 'utf8')
      }

      // Execute SQL statements
      const statements = this.splitSQLStatements(sqlContent)
      
      console.log(`Executing ${statements.length} SQL statements...`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim()
        if (statement && !statement.startsWith('--')) {
          try {
            await executeQuery(statement)
          } catch (error) {
            console.error(`Error executing statement ${i + 1}:`, error)
            console.error('Statement:', statement.substring(0, 200) + '...')
            throw error
          }
        }
      }

      console.log('Database restore completed successfully')

    } catch (error) {
      console.error('Database restore failed:', error)
      throw error
    }
  }

  // List available backups
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupDir)
      const backups: BackupInfo[] = []

      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.sql.gz')) {
          const filepath = path.join(this.backupDir, file)
          const stats = await fs.stat(filepath)
          
          // Try to load metadata, fallback to file info
          let backupInfo: BackupInfo
          try {
            backupInfo = await this.loadBackupMetadata(file)
          } catch {
            backupInfo = {
              id: file.replace(/\.(sql|sql\.gz)$/, ''),
              filename: file,
              size: stats.size,
              createdAt: stats.birthtime.toISOString(),
              type: 'full',
              status: 'completed',
            }
          }
          
          backups.push(backupInfo)
        }
      }

      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  // Clean old backups based on retention policy
  async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

      const oldBackups = backups.filter(backup => 
        new Date(backup.createdAt) < cutoffDate
      )

      console.log(`Cleaning ${oldBackups.length} old backups...`)

      for (const backup of oldBackups) {
        const filepath = path.join(this.backupDir, backup.filename)
        const metadataPath = path.join(this.backupDir, `${backup.filename}.meta.json`)
        
        try {
          await fs.unlink(filepath)
          await fs.unlink(metadataPath).catch(() => {}) // Ignore if metadata doesn't exist
          console.log(`Deleted old backup: ${backup.filename}`)
        } catch (error) {
          console.error(`Failed to delete backup ${backup.filename}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error)
    }
  }

  // Private helper methods
  private async getDatabaseTables(): Promise<string[]> {
    const result = await executeQuery('SHOW TABLES')
    return result.map((row: any) => Object.values(row)[0] as string)
  }

  private async getTableStructure(tableName: string): Promise<string> {
    const result = await executeQuery(`SHOW CREATE TABLE \`${tableName}\``)
    return result[0]['Create Table']
  }

  private async getTableData(tableName: string): Promise<any[]> {
    return await executeQuery(`SELECT * FROM \`${tableName}\``)
  }

  private generateSQLHeader(): string {
    return `-- HR Management System Database Backup
-- Generated on: ${new Date().toISOString()}
-- MySQL dump compatible

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

`
  }

  private generateInsertStatements(tableName: string, data: any[]): string {
    if (data.length === 0) return ''

    const columns = Object.keys(data[0])
    const columnList = columns.map(col => `\`${col}\``).join(', ')
    
    let sql = `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`
    
    const values = data.map(row => {
      const rowValues = columns.map(col => {
        const value = row[col]
        if (value === null) return 'NULL'
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
        if (typeof value === 'boolean') return value ? '1' : '0'
        return value.toString()
      })
      return `(${rowValues.join(', ')})`
    })
    
    sql += values.join(',\n') + ';\n'
    return sql
  }

  private splitSQLStatements(sql: string): string[] {
    return sql.split(';').filter(stmt => stmt.trim().length > 0)
  }

  private async writeCompressedFile(filepath: string, content: string): Promise<void> {
    const gzip = createGzip()
    const writeStream = require('fs').createWriteStream(filepath)
    
    await pipeline(
      require('stream').Readable.from([content]),
      gzip,
      writeStream
    )
  }

  private async readCompressedFile(filepath: string): Promise<string> {
    const gunzip = createGunzip()
    const readStream = require('fs').createReadStream(filepath)
    
    const chunks: Buffer[] = []
    await pipeline(
      readStream,
      gunzip,
      require('stream').Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })
    )
    
    return Buffer.concat(chunks).toString('utf8')
  }

  private async saveBackupMetadata(backupInfo: BackupInfo): Promise<void> {
    const metadataPath = path.join(this.backupDir, `${backupInfo.filename}.meta.json`)
    await fs.writeFile(metadataPath, JSON.stringify(backupInfo, null, 2))
  }

  private async loadBackupMetadata(filename: string): Promise<BackupInfo> {
    const metadataPath = path.join(this.backupDir, `${filename}.meta.json`)
    const content = await fs.readFile(metadataPath, 'utf8')
    return JSON.parse(content)
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}

// Backup scheduler
export class BackupScheduler {
  private backupManager: BackupManager
  private intervalId: NodeJS.Timeout | null = null

  constructor(backupManager: BackupManager) {
    this.backupManager = backupManager
  }

  // Schedule automatic backups
  scheduleBackups(intervalHours = 24): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    const intervalMs = intervalHours * 60 * 60 * 1000

    this.intervalId = setInterval(async () => {
      try {
        console.log('Starting scheduled backup...')
        await this.backupManager.createFullBackup()
        await this.backupManager.cleanOldBackups()
        console.log('Scheduled backup completed')
      } catch (error) {
        console.error('Scheduled backup failed:', error)
      }
    }, intervalMs)

    console.log(`Backup scheduled every ${intervalHours} hours`)
  }

  // Stop scheduled backups
  stopScheduledBackups(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Scheduled backups stopped')
    }
  }
}

// Global backup manager instance
export const backupManager = new BackupManager()
export const backupScheduler = new BackupScheduler(backupManager)
