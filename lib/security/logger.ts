import type { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma'

export type SecurityEventType =
  | 'account_created'
  | 'login_success'
  | 'login_failed'
  | 'account_locked'
  | 'account_unlocked'
  | 'password_changed'
  | 'email_changed'
  | 'email_verified'
  | 'refresh_token_created'
  | 'refresh_token_revoked'
  | 'email_send_failed'

export interface SecurityEventData {
  userId?: string
  eventType: SecurityEventType
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

/**
 * Safely converts metadata to Prisma JSON format
 * Removes undefined values and ensures JSON compatibility
 */
function toJsonValue(data?: Record<string, unknown>): Prisma.InputJsonValue {
  if (!data || Object.keys(data).length === 0) {
    return {}
  }

  const cleaned: Record<string, Prisma.JsonValue> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue
    }
    cleaned[key] = value as Prisma.JsonValue
  }
  return cleaned as Prisma.InputJsonValue
}

/**
 * Logs a security event to the database
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: toJsonValue(data.metadata),
      },
    })
  } catch (error) {
    // Log to console if database logging fails
    console.error('Failed to log security event:', error)
  }
}

/**
 * Helper to extract IP and User-Agent from Next.js request
 */
export function getRequestMetadata(headers: Headers): {
  ipAddress?: string
  userAgent?: string
} {
  return {
    ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
    userAgent: headers.get('user-agent') || undefined,
  }
}
