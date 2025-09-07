import { SecuritySettingsModel } from '@/lib/models/SecuritySettings'

// Mock the database
jest.mock('@/lib/db', () => ({
  executeQuery: jest.fn(),
}))

const { executeQuery } = require('@/lib/db')

describe('SecuritySettingsModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrent', () => {
    it('returns current security settings', async () => {
      const mockSettings = {
        id: 'security-1',
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: false,
        password_expiry_days: 90,
        max_login_attempts: 5,
        lockout_duration_minutes: 15,
        session_timeout_minutes: 60,
        two_factor_required: false,
        allow_password_reuse: false,
        password_history_count: 5,
        ip_whitelist_enabled: false,
        allowed_ip_addresses: '[]',
        audit_log_retention_days: 365,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      executeQuery.mockResolvedValue([mockSettings])

      const result = await SecuritySettingsModel.getCurrent()

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM security_settings'),
        undefined
      )
      expect(result).toEqual({
        id: 'security-1',
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        passwordExpiryDays: 90,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        sessionTimeoutMinutes: 60,
        twoFactorRequired: false,
        allowPasswordReuse: false,
        passwordHistoryCount: 5,
        ipWhitelistEnabled: false,
        allowedIpAddresses: [],
        auditLogRetentionDays: 365,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })
    })

    it('returns default settings when no settings exist', async () => {
      executeQuery.mockResolvedValue([])

      const result = await SecuritySettingsModel.getCurrent()

      expect(result).toEqual(SecuritySettingsModel.getDefaultSettings())
    })

    it('returns default settings on database error', async () => {
      executeQuery.mockRejectedValue(new Error('Database error'))

      const result = await SecuritySettingsModel.getCurrent()

      expect(result).toEqual(SecuritySettingsModel.getDefaultSettings())
    })
  })

  describe('getDefaultSettings', () => {
    it('returns correct default settings', () => {
      const defaults = SecuritySettingsModel.getDefaultSettings()

      expect(defaults).toEqual({
        id: 'default',
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        passwordExpiryDays: 90,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        sessionTimeoutMinutes: 60,
        twoFactorRequired: false,
        allowPasswordReuse: false,
        passwordHistoryCount: 5,
        ipWhitelistEnabled: false,
        allowedIpAddresses: [],
        auditLogRetentionDays: 365,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })
  })

  describe('validatePassword', () => {
    const settings = SecuritySettingsModel.getDefaultSettings()

    it('validates password length', () => {
      const result = SecuritySettingsModel.validatePassword('short', settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    })

    it('validates uppercase requirement', () => {
      const result = SecuritySettingsModel.validatePassword('lowercase123', settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    })

    it('validates lowercase requirement', () => {
      const result = SecuritySettingsModel.validatePassword('UPPERCASE123', settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    })

    it('validates number requirement', () => {
      const result = SecuritySettingsModel.validatePassword('Password', settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    })

    it('validates symbol requirement when enabled', () => {
      const symbolSettings = { ...settings, passwordRequireSymbols: true }
      const result = SecuritySettingsModel.validatePassword('Password123', symbolSettings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')
    })

    it('validates strong password successfully', () => {
      const result = SecuritySettingsModel.validatePassword('StrongPass123', settings)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validates strong password with symbols', () => {
      const symbolSettings = { ...settings, passwordRequireSymbols: true }
      const result = SecuritySettingsModel.validatePassword('StrongPass123!', symbolSettings)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('update', () => {
    it('creates new security settings', async () => {
      const mockResult = SecuritySettingsModel.getDefaultSettings()
      executeQuery.mockResolvedValue(undefined)
      SecuritySettingsModel.getCurrent = jest.fn().mockResolvedValue(mockResult)

      const updateData = {
        passwordMinLength: 10,
        passwordRequireSymbols: true,
      }

      const result = await SecuritySettingsModel.update(updateData)

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO security_settings'),
        expect.arrayContaining([
          expect.any(String), // id
          10, // passwordMinLength
          false, // passwordRequireUppercase
          false, // passwordRequireLowercase
          false, // passwordRequireNumbers
          true, // passwordRequireSymbols
          90, // passwordExpiryDays
          5, // maxLoginAttempts
          15, // lockoutDurationMinutes
          60, // sessionTimeoutMinutes
          false, // twoFactorRequired
          false, // allowPasswordReuse
          5, // passwordHistoryCount
          false, // ipWhitelistEnabled
          '[]', // allowedIpAddresses
          365, // auditLogRetentionDays
        ])
      )
      expect(result).toEqual(mockResult)
    })

    it('handles update error', async () => {
      executeQuery.mockRejectedValue(new Error('Database error'))

      await expect(SecuritySettingsModel.update({})).rejects.toThrow('فشل في تحديث إعدادات الأمان')
    })
  })
})
