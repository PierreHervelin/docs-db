import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

/**
 * Hashes a password using bcrypt with 12 rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compares a plain text password with a bcrypt hash
 * Uses constant-time comparison to prevent timing attacks
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}
