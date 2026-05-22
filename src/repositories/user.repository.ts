import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findByCpf(cpf: string) {
    return prisma.user.findUnique({
      where: { cpf }
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
