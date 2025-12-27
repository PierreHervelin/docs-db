import EmailChangeEmail from '@/emails/email-change'
import PasswordResetEmail from '@/emails/password-reset'
import SecurityAlertEmail from '@/emails/security-alert'
import VerificationEmail from '@/emails/verification'
import { render } from '@react-email/render'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { config, hasResend } from '../config/env'

let transporter: Transporter | null = null

/**
 * Gets or creates the email transporter
 * Development: MailHog (SMTP localhost:1025)
 * Production: Resend or configured SMTP
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  if (hasResend) {
    // Production: Resend
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: config.RESEND_API_KEY,
      },
    })
  } else {
    // Development: MailHog or custom SMTP
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: Number(config.SMTP_PORT),
      secure: config.SMTP_SECURE === 'true',
      auth: config.SMTP_USER
        ? {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          }
        : undefined,
    })
  }

  return transporter
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Sends an email using the configured transporter
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transport = getTransporter()

  await transport.sendMail({
    from: config.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}

/**
 * Sends email verification email
 */
export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string
): Promise<void> {
  const verifyUrl = `${config.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  const html = await render(
    VerificationEmail({
      username,
      verificationUrl: verifyUrl,
    })
  )

  await sendEmail({
    to,
    subject: 'Vérifiez votre adresse email',
    html,
    text: `Bonjour ${username}! Vérifiez votre email en cliquant sur ce lien: ${verifyUrl}`,
  })
}

/**
 * Sends password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  username: string,
  token: string
): Promise<void> {
  const resetUrl = `${config.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  const html = await render(
    PasswordResetEmail({
      username,
      resetUrl,
    })
  )

  await sendEmail({
    to,
    subject: 'Réinitialisez votre mot de passe',
    html,
    text: `Réinitialisez votre mot de passe: ${resetUrl}`,
  })
}

/**
 * Sends account locked notification
 */
export async function sendAccountLockedEmail(
  to: string,
  username: string,
  lockedUntil: Date
): Promise<void> {
  const lockDuration = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)

  const html = await render(
    SecurityAlertEmail({
      username,
      eventType: 'Compte verrouillé',
      eventDetails: 'Tentatives de connexion échouées multiples',
      timestamp: new Date().toLocaleString('fr-FR'),
    })
  )

  await sendEmail({
    to,
    subject: 'Compte temporairement verrouillé',
    html,
    text: `Votre compte a été verrouillé pour ${lockDuration} minutes suite à des tentatives de connexion échouées.`,
  })
}

/**
 * Sends password changed notification
 */
export async function sendPasswordChangedEmail(to: string, username: string): Promise<void> {
  const html = await render(
    SecurityAlertEmail({
      username,
      eventType: 'Mot de passe modifié',
      eventDetails:
        'Votre mot de passe a été changé avec succès. Toutes vos sessions sur les autres appareils ont été terminées pour des raisons de sécurité.',
      timestamp: new Date().toLocaleString('fr-FR'),
    })
  )

  await sendEmail({
    to,
    subject: 'Mot de passe modifié avec succès',
    html,
    text: 'Votre mot de passe a été changé avec succès.',
  })
}

/**
 * Sends email change verification
 */
export async function sendEmailChangeVerification(
  to: string,
  username: string,
  token: string
): Promise<void> {
  const verifyUrl = `${config.NEXT_PUBLIC_APP_URL}/verify-email-change?token=${token}`

  const html = await render(
    EmailChangeEmail({
      username,
      newEmail: to,
      verificationUrl: verifyUrl,
    })
  )

  await sendEmail({
    to,
    subject: 'Vérifiez votre nouvelle adresse email',
    html,
    text: `Vérifiez votre nouvelle adresse email: ${verifyUrl}`,
  })
}
