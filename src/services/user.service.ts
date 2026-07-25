import { UserRepository } from "../repositories/user.repository";
import { CreateUserSchema } from "../validators/createUser.validator";
import { hashPassword } from '../security/password'

export class UserService {
  private repository = new UserRepository();

  async createUser(payload: unknown) {
    const data = CreateUserSchema.parse(payload);

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
