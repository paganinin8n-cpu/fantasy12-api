export class GetRoundMatchesService {
  static async execute(_roundId: string) {
    // Sistema atual usa apenas prediction vs result
    // portanto não há tabela de matches no Prisma

    return []
  }
}