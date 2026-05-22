import { UserRepository } from "../repositories/user.repository";
import { hasActiveProSubscription, hasAnnualProSubscription } from "../domain/subscription";

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
      bio: user.bio,
      profileImage: user.profileImage,
      role: user.role,
      isPro: hasActiveProSubscription(user.subscription),
      isAnnualPro: hasAnnualProSubscription(user.subscription),
      adminRoles: user.UserAdminRole?.map(item => item.role.name) ?? [],
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            plan: user.subscription.plan,
            endAt: user.subscription.endAt?.toISOString() ?? null,
          }
        : null,
      createdAt: user.createdAt
    };
  }
}
