import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

/**
 * Prisma seed script for development and testing
 *
 * Usage:
 * - Development: pnpm prisma db seed
 * - Test: NODE_ENV=test pnpm prisma db seed
 *
 * This script creates:
 * - Test users with various states (verified, unverified, locked)
 * - Sample tokens for testing flows
 * - Security events for monitoring dashboard
 */
async function main() {
	const isTest = process.env.NODE_ENV === 'test'
	const prefix = isTest ? 'test_' : 'seed_'

	console.log(`🌱 Seeding ${isTest ? 'test' : 'development'} database...`)

	// Clean up existing seed data (except main test user)
	await prisma.securityEvent.deleteMany({
		where: {
			user: {
				email: {
					startsWith: prefix,
				},
			},
		},
	})
	await prisma.emailVerificationToken.deleteMany({
		where: {
			user: {
				email: {
					startsWith: prefix,
				},
			},
		},
	})
	await prisma.passwordResetToken.deleteMany({
		where: {
			user: {
				email: {
					startsWith: prefix,
				},
			},
		},
	})
	await prisma.emailChangeRequest.deleteMany({
		where: {
			user: {
				email: {
					startsWith: prefix,
				},
			},
		},
	})
	await prisma.refreshToken.deleteMany({
		where: {
			user: {
				email: {
					startsWith: prefix,
				},
			},
		},
	})
	await prisma.user.deleteMany({
		where: {
			email: {
				startsWith: prefix,
			},
		},
	})

	console.log('✓ Cleaned up existing seed data')

	// Create test users
	const passwordHash = await bcrypt.hash('TestPass123!', 12)

	// 1. Verified user with active session
	const verifiedUser = await prisma.user.create({
		data: {
			email: `${prefix}verified@example.com`,
			emailNormalized: `${prefix}verified@example.com`,
			username: `${prefix}verified`,
			usernameNormalized: `${prefix}verified`,
			firstName: 'Verified',
			lastName: 'User',
			passwordHash,
			emailVerified: true,
		},
	})

	await prisma.refreshToken.create({
		data: {
			jti: crypto.randomUUID(),
			userId: verifiedUser.id,
			tokenHash: crypto.randomBytes(32).toString('hex'),
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		},
	})

	console.log(`✓ Created verified user: ${verifiedUser.email}`)

	// 2. Unverified user with pending email verification
	const unverifiedUser = await prisma.user.create({
		data: {
			email: `${prefix}unverified@example.com`,
			emailNormalized: `${prefix}unverified@example.com`,
			username: `${prefix}unverified`,
			usernameNormalized: `${prefix}unverified`,
			firstName: 'Unverified',
			lastName: 'User',
			passwordHash,
			emailVerified: false,
		},
	})

	const verificationToken = crypto.randomBytes(32).toString('hex')
	const verificationTokenHash = crypto
		.createHash('sha256')
		.update(verificationToken)
		.digest('hex')

	await prisma.emailVerificationToken.create({
		data: {
			userId: unverifiedUser.id,
			token: verificationTokenHash,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		},
	})

	console.log(`✓ Created unverified user: ${unverifiedUser.email}`)
	console.log(`  Verification token: ${verificationToken}`)

	// 3. Locked user (failed login attempts)
	const lockedUser = await prisma.user.create({
		data: {
			email: `${prefix}locked@example.com`,
			emailNormalized: `${prefix}locked@example.com`,
			username: `${prefix}locked`,
			usernameNormalized: `${prefix}locked`,
			firstName: 'Locked',
			lastName: 'User',
			passwordHash,
			emailVerified: true,
			failedLoginAttempts: 5,
			lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
		},
	})

	console.log(`✓ Created locked user: ${lockedUser.email}`)

	// 4. User with pending password reset
	const passwordResetUser = await prisma.user.create({
		data: {
			email: `${prefix}reset@example.com`,
			emailNormalized: `${prefix}reset@example.com`,
			username: `${prefix}reset`,
			usernameNormalized: `${prefix}reset`,
			firstName: 'Reset',
			lastName: 'User',
			passwordHash,
			emailVerified: true,
		},
	})

	const resetToken = crypto.randomBytes(32).toString('hex')
	const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

	await prisma.passwordResetToken.create({
		data: {
			userId: passwordResetUser.id,
			token: resetTokenHash,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		},
	})

	console.log(`✓ Created user with password reset: ${passwordResetUser.email}`)
	console.log(`  Reset token: ${resetToken}`)

	// 5. User with pending email change
	const emailChangeUser = await prisma.user.create({
		data: {
			email: `${prefix}emailchange@example.com`,
			emailNormalized: `${prefix}emailchange@example.com`,
			username: `${prefix}emailchange`,
			usernameNormalized: `${prefix}emailchange`,
			firstName: 'EmailChange',
			lastName: 'User',
			passwordHash,
			emailVerified: true,
		},
	})

	const emailChangeToken = crypto.randomBytes(32).toString('hex')
	const emailChangeTokenHash = crypto
		.createHash('sha256')
		.update(emailChangeToken)
		.digest('hex')

	await prisma.emailChangeRequest.create({
		data: {
			userId: emailChangeUser.id,
			newEmail: `${prefix}newemail@example.com`,
			newEmailNormalized: `${prefix}newemail@example.com`,
			token: emailChangeTokenHash,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		},
	})

	console.log(`✓ Created user with email change: ${emailChangeUser.email}`)
	console.log(`  Email change token: ${emailChangeToken}`)

	// Create security events
	const events = [
		{
			userId: verifiedUser.id,
			eventType: 'LOGIN_SUCCESS',
			ipAddress: '127.0.0.1',
			userAgent: 'Mozilla/5.0 (Seed)',
			metadata: { rememberMe: true },
		},
		{
			userId: lockedUser.id,
			eventType: 'LOGIN_FAILED',
			ipAddress: '127.0.0.1',
			userAgent: 'Mozilla/5.0 (Seed)',
			metadata: { reason: 'invalid_password', attempts: 5 },
		},
		{
			userId: lockedUser.id,
			eventType: 'ACCOUNT_LOCKED',
			ipAddress: '127.0.0.1',
			userAgent: 'Mozilla/5.0 (Seed)',
			metadata: { lockDuration: '15 minutes' },
		},
		{
			userId: passwordResetUser.id,
			eventType: 'PASSWORD_RESET_REQUESTED',
			ipAddress: '127.0.0.1',
			userAgent: 'Mozilla/5.0 (Seed)',
			metadata: {},
		},
	]

	for (const event of events) {
		await prisma.securityEvent.create({ data: event })
	}

	console.log(`✓ Created ${events.length} security events`)

	// Create expired tokens for cleanup testing
	await prisma.emailVerificationToken.create({
		data: {
			userId: unverifiedUser.id,
			token: crypto.randomBytes(32).toString('hex'),
			expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
		},
	})

	await prisma.revokedToken.create({
		data: {
			jti: crypto.randomUUID(),
			tokenType: 'access',
			expiresAt: new Date(Date.now() - 60 * 60 * 1000),
			reason: 'Test expired token',
		},
	})

	console.log('✓ Created expired tokens for cleanup testing')

	// Ensure main test user exists
	const testPasswordHash = await bcrypt.hash('Test1234!', 12)
	await prisma.user.upsert({
		where: { email: 'test@example.com' },
		update: {},
		create: {
			username: 'testuser',
			usernameNormalized: 'testuser',
			email: 'test@example.com',
			emailNormalized: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
			emailVerified: true,
			passwordHash: testPasswordHash,
		},
	})

	console.log('\n✅ Seed completed successfully!')
	console.log('\n📋 Available test accounts:')
	console.log('  Main: test@example.com / Test1234!')
	console.log(`  Verified: ${verifiedUser.email} / TestPass123!`)
	console.log(`  Unverified: ${unverifiedUser.email} / TestPass123!`)
	console.log(`  Locked: ${lockedUser.email} / TestPass123!`)
	console.log(`  Reset: ${passwordResetUser.email} / TestPass123!`)
	console.log(`  Email Change: ${emailChangeUser.email} / TestPass123!`)
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		console.error('❌ Seed failed:', e)
		await prisma.$disconnect()
		process.exit(1)
	})
