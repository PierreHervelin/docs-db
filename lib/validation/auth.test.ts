import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
  signupSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateUsernameSchema,
  usernameSchema,
  verifyEmailSchema,
} from './auth'

describe('Auth Validation Schemas', () => {
  describe('usernameSchema', () => {
    it('should accept valid usernames', () => {
      const validUsernames = ['user123', 'john_doe', 'test-user', 'abc']

      validUsernames.forEach((username) => {
        const result = usernameSchema.safeParse(username)
        expect(result.success).toBe(true)
      })
    })

    it('should reject usernames that are too short', () => {
      const result = usernameSchema.safeParse('ab')
      expect(result.success).toBe(false)
    })

    it('should reject usernames that are too long', () => {
      const result = usernameSchema.safeParse('a'.repeat(31))
      expect(result.success).toBe(false)
    })

    it('should reject usernames with invalid characters', () => {
      const invalidUsernames = ['user@123', 'user 123', 'user!', 'user.name', 'user#123']

      invalidUsernames.forEach((username) => {
        const result = usernameSchema.safeParse(username)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_123@test-domain.org',
      ]

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse({ email })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ]

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse({ email })
        expect(result.success).toBe(false)
      })
    })

    it('should reject empty email', () => {
      const result = emailSchema.safeParse({ email: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      const validPasswords = ['SecurePass123!', 'Abcdef1@', 'MyP@ssw0rd', 'Test1234!@#$']

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(true)
      })
    })

    it('should reject passwords without uppercase', () => {
      const result = passwordSchema.safeParse('securepass123!')
      expect(result.success).toBe(false)
    })

    it('should reject passwords without lowercase', () => {
      const result = passwordSchema.safeParse('SECUREPASS123!')
      expect(result.success).toBe(false)
    })

    it('should reject passwords without digit', () => {
      const result = passwordSchema.safeParse('SecurePass!')
      expect(result.success).toBe(false)
    })

    it('should reject passwords without special character', () => {
      const result = passwordSchema.safeParse('SecurePass123')
      expect(result.success).toBe(false)
    })

    it('should reject passwords that are too short', () => {
      const result = passwordSchema.safeParse('Abc123!')
      expect(result.success).toBe(false)
    })
  })

  describe('signupSchema', () => {
    it('should accept valid signup data', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      })

      expect(result.success).toBe(true)
    })

    it('should reject missing fields', () => {
      const result = signupSchema.safeParse({
        username: 'testuser',
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
    })

    it('should reject invalid username in signup', () => {
      const result = signupSchema.safeParse({
        username: 'ab',
        email: 'test@example.com',
        password: 'SecurePass123!',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        login: 'testuser',
        password: 'SecurePass123!',
      })

      expect(result.success).toBe(true)
    })

    it('should accept email as login', () => {
      const result = loginSchema.safeParse({
        login: 'test@example.com',
        password: 'SecurePass123!',
      })

      expect(result.success).toBe(true)
    })

    it('should default rememberMe to false', () => {
      const result = loginSchema.safeParse({
        login: 'testuser',
        password: 'SecurePass123!',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rememberMe).toBe(false)
      }
    })

    it('should accept rememberMe option', () => {
      const result = loginSchema.safeParse({
        login: 'testuser',
        password: 'SecurePass123!',
        rememberMe: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rememberMe).toBe(true)
      }
    })
  })

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'invalid-email',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('should accept valid reset data', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'valid-token-string',
        password: 'NewPass123!',
      })

      expect(result.success).toBe(true)
    })

    it('should reject missing token', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPass123!',
      })

      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'valid-token',
        password: 'weak',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('verifyEmailSchema', () => {
    it('should accept valid token', () => {
      const result = verifyEmailSchema.safeParse({
        token: 'valid-token-string',
      })

      expect(result.success).toBe(true)
    })

    it('should reject empty token', () => {
      const result = verifyEmailSchema.safeParse({
        token: '',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('updateUsernameSchema', () => {
    it('should accept valid username', () => {
      const result = updateUsernameSchema.safeParse({
        username: 'newusername',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid username', () => {
      const result = updateUsernameSchema.safeParse({
        username: 'ab',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('updateEmailSchema', () => {
    it('should accept valid email', () => {
      const result = updateEmailSchema.safeParse({
        email: 'newemail@example.com',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = updateEmailSchema.safeParse({
        email: 'invalid',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('updatePasswordSchema', () => {
    it('should accept valid password update', () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      })

      expect(result.success).toBe(true)
    })

    it('should reject missing current password', () => {
      const result = updatePasswordSchema.safeParse({
        newPassword: 'NewPass123!',
      })

      expect(result.success).toBe(false)
    })

    it('should reject weak new password', () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: 'OldPass123!',
        newPassword: 'weak',
      })

      expect(result.success).toBe(false)
    })
  })
})
