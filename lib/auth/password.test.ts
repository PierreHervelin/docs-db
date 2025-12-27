import { comparePassword, hashPassword } from './password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)

      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(20)
    })

    it('should create different hashes for same password', async () => {
      const password = 'SecurePass123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // bcrypt uses random salt
    })

    it('should start with bcrypt prefix', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)

      expect(hash.startsWith('$2')).toBe(true) // bcrypt hashes start with $2a$ or $2b$
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'SecurePass123!'
      const wrongPassword = 'WrongPass123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should return false for empty password', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword('', hash)

      expect(isValid).toBe(false)
    })

    it('should be case sensitive', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword('securepass123!', hash)

      expect(isValid).toBe(false)
    })

    it('should return false for invalid hash', async () => {
      const password = 'SecurePass123!'
      const isValid = await comparePassword(password, 'invalid-hash')

      expect(isValid).toBe(false)
    })
  })

  describe('Timing attack resistance', () => {
    it('should take similar time for valid and invalid passwords', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)

      const start1 = Date.now()
      await comparePassword(password, hash)
      const duration1 = Date.now() - start1

      const start2 = Date.now()
      await comparePassword('WrongPassword123!', hash)
      const duration2 = Date.now() - start2

      // Times should be within 50ms of each other (bcrypt is constant-time)
      const diff = Math.abs(duration1 - duration2)
      expect(diff).toBeLessThan(50)
    })
  })

  describe('Hash strength', () => {
    it('should use sufficient rounds (12)', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)

      // bcrypt hash format: $2a$rounds$salthash
      const rounds = hash.split('$')[2]
      expect(rounds).toBe('12')
    })

    it('should handle special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should handle unicode characters', async () => {
      const password = 'Pässwörd123!éà'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(password, hash)

      expect(isValid).toBe(true)
    })
  })
})
