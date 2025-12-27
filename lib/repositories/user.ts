/**
 * User repository
 * Handles all database operations for User entity
 */

import { prisma } from '@/lib/db/prisma'
import type { User } from '@prisma/client'

/**
 * Create a new user
 */
export async function create(data: {
  email: string
  firstName: string
  lastName: string
  passwordHash: string
}): Promise<User> {
  // Generate username from first/last name (temporary, until we implement proper username system)
  const username = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`.replace(
    /[^a-z0-9.-]/g,
    ''
  )

  return prisma.user.create({
    data: {
      username,
      usernameNormalized: username.toLowerCase(),
      email: data.email,
      emailNormalized: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash: data.passwordHash,
    },
  })
}

/**
 * Find user by email (case-insensitive)
 */
export async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { emailNormalized: email.toLowerCase() },
  })
}

/**
 * Find user by ID
 */
export async function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * Mark user's email as verified
 */
export async function verifyEmail(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  })
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
}

/**
 * Update user's password
 */
export async function updatePassword(userId: string, passwordHash: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })
}

/**
 * Update user's email and reset verification status
 */
export async function updateEmail(userId: string, email: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      email,
      emailNormalized: email.toLowerCase(),
      emailVerified: false,
    },
  })
}
