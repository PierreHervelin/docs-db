import { prisma } from '@/lib/db/prisma'
import type { EmailChangeRequest } from '@prisma/client'

/**
 * Create an email change request for a user
 *
 * @param userId - User ID requesting email change
 * @param newEmail - New email address (original case)
 * @param newEmailNormalized - New email address (lowercase)
 * @param token - Cryptographically secure token (hashed)
 * @param expiresAt - Token expiration timestamp (typically now + 1 hour)
 * @returns Created EmailChangeRequest
 */
export async function createEmailChangeRequest(
  userId: string,
  newEmail: string,
  newEmailNormalized: string,
  token: string,
  expiresAt: Date
): Promise<EmailChangeRequest> {
  return prisma.emailChangeRequest.create({
    data: {
      userId,
      newEmail,
      newEmailNormalized,
      token,
      expiresAt,
    },
  })
}

/**
 * Find an email change request by its token value
 *
 * @param token - Token string to search for
 * @returns EmailChangeRequest or null if not found
 */
export async function findEmailChangeRequestByToken(
  token: string
): Promise<EmailChangeRequest | null> {
  return prisma.emailChangeRequest.findUnique({
    where: { token },
  })
}

/**
 * Mark an email change request as verified
 *
 * @param requestId - ID of the request to mark as verified
 * @returns Updated EmailChangeRequest
 */
export async function markEmailChangeRequestAsVerified(
  requestId: string
): Promise<EmailChangeRequest> {
  return prisma.emailChangeRequest.update({
    where: { id: requestId },
    data: { verifiedAt: new Date() },
  })
}

/**
 * Delete all email change requests for a user
 * Used when user successfully changes email or requests new change
 *
 * @param userId - User ID whose requests should be deleted
 * @returns Count of deleted requests
 */
export async function deleteAllEmailChangeRequestsForUser(userId: string): Promise<number> {
  const result = await prisma.emailChangeRequest.deleteMany({
    where: { userId },
  })
  return result.count
}

/**
 * Cleanup expired email change requests
 * Should be run periodically (e.g., daily via cron)
 *
 * @returns Count of deleted requests
 */
export async function cleanupExpiredEmailChangeRequests(): Promise<number> {
  const result = await prisma.emailChangeRequest.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}
