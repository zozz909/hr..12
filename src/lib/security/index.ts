import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// import rateLimit from 'express-rate-limit' // Not compatible with Next.js edge runtime

// Security configuration
export const SECURITY_CONFIG = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
    SALT_ROUNDS: 12,
  },
  
  // JWT configuration
  JWT: {
    SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    EXPIRES_IN: '24h',
    REFRESH_EXPIRES_IN: '7d',
    ALGORITHM: 'HS256' as const,
  },
  
  // Session configuration
  SESSION: {
    TIMEOUT_MINUTES: 60,
    MAX_CONCURRENT_SESSIONS: 3,
    SECURE_COOKIES: process.env.NODE_ENV === 'production',
    SAME_SITE: 'strict' as const,
  },
  
  // Rate limiting
  RATE_LIMIT: {
    LOGIN_ATTEMPTS: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      skipSuccessfulRequests: true,
    },
    API_REQUESTS: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
    },
  },
  
  // File upload security
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ],
    SCAN_FOR_MALWARE: true,
  },
}

// Password utilities
export class PasswordSecurity {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SECURITY_CONFIG.PASSWORD.SALT_ROUNDS)
  }
  
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
  
  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const config = SECURITY_CONFIG.PASSWORD
    
    if (password.length < config.MIN_LENGTH) {
      errors.push(`كلمة المرور يجب أن تكون ${config.MIN_LENGTH} أحرف على الأقل`)
    }
    
    if (password.length > config.MAX_LENGTH) {
      errors.push(`كلمة المرور يجب أن تكون أقل من ${config.MAX_LENGTH} حرف`)
    }
    
    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    }
    
    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    }
    
    if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    }
    
    if (config.REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  }
  
  static generate(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    return password
  }
}

// JWT utilities
export class JWTSecurity {
  static sign(payload: object, expiresIn?: string): string {
    return jwt.sign(
      payload,
      SECURITY_CONFIG.JWT.SECRET,
      {
        expiresIn: expiresIn || SECURITY_CONFIG.JWT.EXPIRES_IN,
        algorithm: SECURITY_CONFIG.JWT.ALGORITHM,
      }
    )
  }
  
  static verify(token: string): any {
    try {
      return jwt.verify(token, SECURITY_CONFIG.JWT.SECRET)
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }
  
  static decode(token: string): any {
    return jwt.decode(token)
  }
}

// Input sanitization
export class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
  }
  
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }
  
  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+\-\s()]/g, '')
  }
  
  static validateSQLInput(input: string): boolean {
    const sqlInjectionPattern = /('|\\')|(;)|(\\)|(--)|(\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+)/gi
    return !sqlInjectionPattern.test(input)
  }
}

// File security
export class FileSecurity {
  static validateFileType(filename: string, mimeType: string): boolean {
    const allowedTypes = SECURITY_CONFIG.UPLOAD.ALLOWED_MIME_TYPES
    return allowedTypes.includes(mimeType)
  }
  
  static validateFileSize(size: number): boolean {
    return size <= SECURITY_CONFIG.UPLOAD.MAX_FILE_SIZE
  }
  
  static generateSecureFilename(originalName: string): string {
    const ext = originalName.split('.').pop()
    const timestamp = Date.now()
    const random = crypto.randomBytes(8).toString('hex')
    return `${timestamp}-${random}.${ext}`
  }
  
  static scanForMalware(filePath: string): Promise<boolean> {
    // In production, integrate with antivirus API
    // For now, return true (safe)
    return Promise.resolve(true)
  }
}

// Rate limiting middleware (simplified for Next.js)
export const createRateLimit = (options: any) => {
  // Simple in-memory rate limiting for Next.js
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: any) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const now = Date.now()
    const windowMs = options.windowMs || 15 * 60 * 1000
    const max = options.max || 100

    const key = `${ip}`
    const current = requests.get(key)

    if (!current || now > current.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true }
    }

    if (current.count >= max) {
      return {
        allowed: false,
        error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً'
      }
    }

    current.count++
    return { allowed: true }
  }
}

// Security headers middleware
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
}

// Audit logging
export class AuditLogger {
  static async log(action: string, userId: string, details: any, ipAddress?: string) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
      ipAddress,
      userAgent: details.userAgent || 'Unknown',
    }
    
    // In production, send to logging service
    console.log('AUDIT LOG:', JSON.stringify(logEntry))
    
    // Store in database if needed
    // await executeQuery('INSERT INTO audit_logs ...', [logEntry])
  }
}

// IP whitelist/blacklist
export class IPSecurity {
  private static blacklist = new Set<string>()
  private static whitelist = new Set<string>()
  
  static addToBlacklist(ip: string) {
    this.blacklist.add(ip)
  }
  
  static addToWhitelist(ip: string) {
    this.whitelist.add(ip)
  }
  
  static isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip)
  }
  
  static isWhitelisted(ip: string): boolean {
    return this.whitelist.size === 0 || this.whitelist.has(ip)
  }
  
  static isAllowed(ip: string): boolean {
    return !this.isBlacklisted(ip) && this.isWhitelisted(ip)
  }
}
