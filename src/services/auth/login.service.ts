import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateToken } from '../../utils/jwt'

const prisma = new PrismaClient()

interface LoginInput {
  email?: string
  password?: string
}

export class LoginService {
  static async execute({ email, password }: LoginInput) {
    if (!email || !password) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
        
      }
    }
  }
}
