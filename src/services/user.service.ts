import { UserRepository } from "../repositories/user.repository";
import { CreateUserSchema } from "../validators/createUser.validator";
import { hashPassword } from '../security/password'
import { ZodError } from 'zod'

export class UserService {
  private repository = new UserRepository();

  async createUser(payload: unknown) {
    let data
    try {
      data = CreateUserSchema.parse(payload);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(error.issues[0]?.message ?? 'Dados inválidos')
      }
      throw error
    }

    const emailExists = await this.repository.findByEmail(data.email);
    if (emailExists) {
      throw new Error("Email já cadastrado");
    }

    const cpfExists = await this.repository.findByCpf(data.cpf);
    if (cpfExists) {
      throw new Error("CPF já cadastrado");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this.repository.create({
      ...data,
      password: hashedPassword,
      role: "NORMAL"
    });

    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}
