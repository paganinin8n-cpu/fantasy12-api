import { UserRepository } from "../repositories/user.repository";

export class UserProfileService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(userId: string) {
    if (!userId) {
      throw new Error("ID do usuário não informado");
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}
