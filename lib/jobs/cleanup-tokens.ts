import { PrismaClient } from '@prisma/client'
import cron from 'node-cron'

const prisma = new PrismaClient()

/**
 * Token Cleanup Job
 *
 * This job runs periodically to clean up expired tokens from the database.
 * It removes:
 * - Expired email verification tokens
 * - Expired password reset tokens
 * - Expired revoked tokens (already expired, safe to remove)
 * - Expired email change requests
 * - Old refresh tokens (expired)
 *
 * Schedule: Runs daily at 2:00 AM
 */

/**
 * Clean up expired email verification tokens
 */
async function cleanupEmailVerificationTokens(): Promise<number> {
  const result = await prisma.emailVerificationToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}

/**
 * Clean up expired password reset tokens
 */
async function cleanupPasswordResetTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
    },
  })
  return result.count
}

/**
 * Clean up expired revoked tokens
 * Keep them for 7 days after expiration for audit purposes
 */
async function cleanupRevokedTokens(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const result = await prisma.revokedToken.deleteMany({
    where: {
      expiresAt: {
        lt: sevenDaysAgo,
      },
    },
  })
  return result.count
}

/**
 * Clean up expired email change requests
 */
async function cleanupEmailChangeRequests(): Promise<number> {
  const result = await prisma.emailChangeRequest.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { verifiedAt: { not: null } }],
    },
  })
  return result.count
}

/**
 * Clean up expired refresh tokens
 */
async function cleanupRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
    },
  })
  return result.count
}

/**
 * Clean up old security events (keep for 90 days)
 */
async function cleanupSecurityEvents(): Promise<number> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const result = await prisma.securityEvent.deleteMany({
    where: {
      createdAt: {
        lt: ninetyDaysAgo,
      },
    },
  })
  return result.count
}

/**
 * Run all cleanup tasks
 */
export async function runTokenCleanup(): Promise<void> {
  console.log('[Token Cleanup] Starting cleanup job...')

  try {
    const [
      emailVerificationCount,
      passwordResetCount,
      revokedTokenCount,
      emailChangeCount,
      refreshTokenCount,
      securityEventCount,
    ] = await Promise.all([
      cleanupEmailVerificationTokens(),
      cleanupPasswordResetTokens(),
      cleanupRevokedTokens(),
      cleanupEmailChangeRequests(),
      cleanupRefreshTokens(),
      cleanupSecurityEvents(),
    ])

    console.log('[Token Cleanup] Cleanup completed:')
    console.log(`  - Email verification tokens: ${emailVerificationCount}`)
    console.log(`  - Password reset tokens: ${passwordResetCount}`)
    console.log(`  - Revoked tokens: ${revokedTokenCount}`)
    console.log(`  - Email change requests: ${emailChangeCount}`)
    console.log(`  - Refresh tokens: ${refreshTokenCount}`)
    console.log(`  - Security events: ${securityEventCount}`)

    const total =
      emailVerificationCount +
      passwordResetCount +
      revokedTokenCount +
      emailChangeCount +
      refreshTokenCount +
      securityEventCount

    console.log(`[Token Cleanup] Total records removed: ${total}`)
  } catch (error) {
    console.error('[Token Cleanup] Error during cleanup:', error)
    throw error
  }
}

/**
 * Schedule the cleanup job
 * Runs daily at 2:00 AM in the server's timezone
 */
export function scheduleTokenCleanup(): void {
  // Run at 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    await runTokenCleanup()
  })

  console.log('[Token Cleanup] Job scheduled: Daily at 2:00 AM')
}

/**
 * Run cleanup immediately (for manual execution)
 */
if (require.main === module) {
  runTokenCleanup()
    .then(() => {
      console.log('[Token Cleanup] Manual cleanup completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('[Token Cleanup] Manual cleanup failed:', error)
      process.exit(1)
    })
}
