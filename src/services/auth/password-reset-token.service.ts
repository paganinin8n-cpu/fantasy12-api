import jwt from 'jsonwebtoken'

const PASSWORD_RESET_SECRET = process.env.JWT_SECRET

if (!PASSWORD_RESET_SECRET) {
  throw new Error('JWT_SECRET não configurado no ambiente')
}

const PASSWORD_RESET_SECRET_VALUE: string = PASSWORD_RESET_SECRET

const PASSWORD_RESET_EXPIRES_IN = '30m'

interface PasswordResetTokenPayload {
  purpose: 'password-reset'
  userId: string
  email: string
}

export class PasswordResetTokenService {
  static sign(input: { userId: string; email: string }) {
    const payload: PasswordResetTokenPayload = {
      purpose: 'password-reset',
      userId: input.userId,
      email: input.email.toLowerCase(),
    }

    return jwt.sign(payload, PASSWORD_RESET_SECRET_VALUE, {
      expiresIn: PASSWORD_RESET_EXPIRES_IN,
    })
  }

  static verify(token: string) {
    const decoded = jwt.verify(
      token,
      PASSWORD_RESET_SECRET_VALUE
    ) as unknown as PasswordResetTokenPayload

    if (decoded.purpose !== 'password-reset' || !decoded.userId) {
      throw new Error('invalid_password_reset_token')
    }

    return decoded
  }
}
