import { MesaCategory } from '@prisma/client'

export type MesaCategoryTerms = {
  category?: MesaCategory | null
  accessCost?: number | null
  entryFee?: number | null
  sponsorPrizePool?: number | null
  maxParticipants?: number | null
}

export class MesaCategoryRules {
  static category(value: MesaCategoryTerms) {
    return value.category ?? MesaCategory.PAID
  }

  static isPaid(value: MesaCategoryTerms) {
    return this.category(value) === MesaCategory.PAID
  }

  static isSponsored(value: MesaCategoryTerms) {
    return !this.isPaid(value)
  }

  static hasCapacity(value: MesaCategoryTerms) {
    return value.maxParticipants != null
  }

  static validate(value: MesaCategoryTerms) {
    const category = this.category(value)
    if (!Object.values(MesaCategory).includes(category)) {
      throw new Error('Categoria de Mesa inválida')
    }
    const accessCost = value.accessCost ?? value.entryFee ?? 0
    const sponsorPrizePool = value.sponsorPrizePool ?? 0
    const maxParticipants = value.maxParticipants

    if (!Number.isInteger(maxParticipants) || maxParticipants! <= 0) {
      throw new Error('Informe um limite de usuários maior que zero')
    }

    if (category === MesaCategory.PAID) {
      if (!Number.isInteger(accessCost) || accessCost <= 0) {
        throw new Error('O acesso em tampinhas deve ser maior que zero')
      }
      if (sponsorPrizePool !== 0) {
        throw new Error('Mesa com Tampinhas não utiliza premiação patrocinada')
      }
    } else {
      if (accessCost !== 0) {
        throw new Error('Mesa FREE não pode cobrar Tampinhas')
      }
      if (!Number.isInteger(sponsorPrizePool) || sponsorPrizePool <= 0) {
        throw new Error('Informe a premiação patrocinada em Tampinhas')
      }
    }

    return { category, accessCost, sponsorPrizePool, maxParticipants }
  }

  static assertCapacity(value: MesaCategoryTerms & { currentParticipants: number }) {
    if (
      value.maxParticipants != null
      && value.currentParticipants >= value.maxParticipants
    ) {
      throw new Error('Esta Mesa atingiu o limite de participantes')
    }
  }
}
