import nodemailer from 'nodemailer'
import logger from './logger.js'

let transporter

// Initialize email service
export const initializeEmailService = () => {
  // Using Gmail or your email provider
  // For Gmail: Enable "Less secure app access" or use App Password
  // For other providers: Update credentials accordingly

  const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com'
  const emailPassword = process.env.EMAIL_PASSWORD || 'your-app-password'
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com'
  const emailPort = process.env.EMAIL_PORT || 587

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  })

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email service initialization failed', { error: error.message })
    } else {
      logger.info('Email service initialized successfully')
    }
  })
}

/**
 * Generate random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP email to user
 */
export const sendOTPEmail = async (email, otp, fullName = 'User') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Kanz ul Huda - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Hello ${fullName},
            </p>

            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
              Your One-Time Password (OTP) for registration is:
            </p>

            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
              <h1 style="color: #333; letter-spacing: 5px; margin: 0; font-size: 36px;">
                ${otp}
              </h1>
            </div>

            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              <strong>⏰ This OTP expires in 10 minutes</strong>
            </p>

            <p style="color: #999; font-size: 14px; margin-bottom: 25px;">
              If you didn't request this verification, please ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 Kanz ul Huda. All rights reserved.
            </p>
          </div>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    logger.info('OTP email sent successfully', { email })
    return result
  } catch (error) {
    logger.error('Failed to send OTP email', { email, error: error.message })
    throw error
  }
}

/**
 * Send welcome email after successful registration
 */
export const sendWelcomeEmail = async (email, fullName, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Kanz ul Huda - Durood Collection System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333; margin-bottom: 20px;">🎉 Welcome to Kanz ul Huda!</h2>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Hello ${fullName},
            </p>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Your account has been successfully created. You can now log in to the Durood Collection System.
            </p>

            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
              <p style="color: #666; margin: 5px 0;"><strong>Username:</strong> ${username}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            </div>

            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
              You're now part of our Durood tracking community. Start submitting and tracking your progress!
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 Kanz ul Huda. All rights reserved.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    logger.info('Welcome email sent successfully', { email })
  } catch (error) {
    logger.error('Failed to send welcome email', { email, error: error.message })
    // Don't throw - welcome email failure shouldn't block account creation
  }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetLink, fullName = 'User') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Kanz ul Huda - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333; margin-bottom: 20px;">🔐 Password Reset Request</h2>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Hello ${fullName},
            </p>

            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>

            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
              Or copy and paste this link in your browser:
            </p>

            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; word-break: break-all;">
              <p style="color: #333; margin: 0; font-size: 12px;">
                ${resetLink}
              </p>
            </div>

            <p style="color: #d97706; font-size: 14px; margin-bottom: 15px;">
              <strong>⏰ This link expires in 30 minutes</strong>
            </p>

            <p style="color: #666; font-size: 14px; margin-bottom: 25px;">
              If you didn't request a password reset, you can ignore this email. Your password will remain unchanged.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 Kanz ul Huda. All rights reserved.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    logger.info('Password reset email sent successfully', { email })
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error: error.message })
    throw error
  }
}

/**
 * Send registration request confirmation email to user
 */
export const sendRegistrationRequestConfirmationEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Kanz ul Huda - Registration Request Received',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #333; margin-bottom: 20px;">📋 Registration Request Received</h2>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Assalamu Alaikum ${name},
            </p>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Thank you for submitting your registration request to Kanz ul Huda. Your request has been received and is now under review by our administrators.
            </p>

            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
              <p style="color: #666; margin: 5px 0;"><strong>Name:</strong> ${name}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending</span></p>
            </div>

            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
              You will receive an email notification once your request has been reviewed. Please be patient while our team verifies your information.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 Kanz ul Huda. All rights reserved.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    logger.info('Registration request confirmation email sent', { email })
  } catch (error) {
    logger.error('Failed to send registration request confirmation email', {
      email,
      error: error.message,
    })
    throw error
  }
}

/**
 * Send registration approval email to user
 */
export const sendRegistrationApprovedEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Kanz ul Huda - Registration Approved! ✅',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #10b981; margin-bottom: 20px;">✅ Registration Approved!</h2>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Assalamu Alaikum ${name},
            </p>

            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
              Great news! Your registration request has been approved by our administrators. You can now proceed with creating your account.
            </p>

            <div style="background-color: #ecfdf5; padding: 20px; border-left: 4px solid #10b981; margin-bottom: 25px;">
              <p style="color: #047857; font-size: 16px; margin: 0;">
                <strong>Next Step:</strong> Visit our website and complete your registration using the registration code provided by the administrator.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; margin-bottom: 25px;">
              If you have any questions, please contact our support team.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 Kanz ul Huda. All rights reserved.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    logger.info('Registration approval email sent', { email })
  } catch (error) {
    logger.error('Failed to send registration approval email', { email, error: error.message })
    throw error
  }
}

/**
 * Send registration rejection email to user
 */
export const sendRegistrationRejectedEmail = async (email, name, reason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Kanz ul Huda - Registration Request Update',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #ef4444; margin-bottom: 20px;">Registration Request Update</h2>

            <p style="color: #666; font-size: 16px; margin-bottom: 15px;">
              Assalamu Alaikum ${name},
            </p>

            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
              Thank you for your registration request. Unfortunately, your request could not be approved at this time.
            </p>

            <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin-bottom: 25px;">
              <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
                <strong>Reason:</strong> ${reason}
              </p>
            </div>

            <p style="color: #666; font-size: 14px; margin-bottom: 25px;">
              If you believe this is a mistake or would like to resubmit your application, please contact our support team.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 Kanz ul Huda. All rights reserved.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    logger.info('Registration rejection email sent', { email })
  } catch (error) {
    logger.error('Failed to send registration rejection email', { email, error: error.message })
    throw error
  }
}

/**
 * Send email verification link for admin-created users
 */
export const sendAdminCreatedUserVerificationEmail = async (
  email,
  fullName = 'User',
  verificationToken,
) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">Welcome to Kanz-Ul-Huda</h1>
      </div>

      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hello <strong>${fullName}</strong>,</p>

        <p>An administrator has created an account for you on Kanz-Ul-Huda. To activate your account and get started, please verify your email address by clicking the link below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
        <p style="background-color: white; padding: 10px; border-left: 3px solid #667eea; word-break: break-all; color: #333;">
          ${verificationUrl}
        </p>

        <div style="background-color: #fff3cd; border-left: 3px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404;">
            <strong>Important:</strong> This verification link will expire in 7 days. After that, please contact your administrator to request a new verification email.
          </p>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you did not expect to receive this email or have any questions, please contact your administrator.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email. Please do not reply directly.
        </p>
      </div>
    </div>
  `

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${fullName}, please verify your email for Kanz-Ul-Huda`,
    html: htmlContent,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    logger.info('Admin-created user verification email sent', { email, messageId: info.messageId })
    return info
  } catch (error) {
    logger.error('Failed to send admin-created user verification email', {
      email,
      error: error.message,
    })
    throw error
  }
}

export default {
  initializeEmailService,
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendRegistrationRequestConfirmationEmail,
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
  sendAdminCreatedUserVerificationEmail,
}
