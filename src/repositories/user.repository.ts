import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { canonicalizeEmail, normalizeDigits } from '../security/identity'

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: canonicalizeEmail(email) }
    });
  }

  async findByCpf(cpf: string) {
    return prisma.user.findUnique({
      where: { cpf: normalizeDigits(cpf) }
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        UserAdminRole: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data
    });
  }
}
