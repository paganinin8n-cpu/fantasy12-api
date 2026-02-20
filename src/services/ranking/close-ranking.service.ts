import { prisma } from '../../lib/prisma';

export class CloseRankingService {
  async execute(rankingId: string) {
    await prisma.$transaction(async (tx) => {
      /**
       * 1️⃣ Buscar ranking
       */
      const ranking = await tx.ranking.findUnique({
        where: { id: rankingId },
        include: {
          participants: true,
          rounds: {
            include: {
              round: true,
            },
          },
        },
      });

      if (!ranking) {
        throw new Error('Ranking não encontrado');
      }

      if (ranking.status !== 'ACTIVE') {
        throw new Error('Ranking já está encerrado');
      }

      if (!ranking.endDate || ranking.endDate > new Date()) {
        throw new Error('Ranking ainda não expirou');
      }

      /**
       * 2️⃣ Encontrar última rodada SCORED vinculada ao ranking
       */
      const scoredRounds = ranking.rounds
        .filter(r => r.round.status === 'SCORED')
        .map(r => r.round);

      if (scoredRounds.length === 0) {
        throw new Error('Nenhuma rodada pontuada encontrada para este ranking');
      }

      const lastRound = scoredRounds.sort(
        (a, b) => b.number - a.number
      )[0];

      /**
       * 3️⃣ Buscar snapshot GLOBAL da última rodada
       */
      const snapshots = await tx.rankingSnapshot.findMany({
        where: {
          roundId: lastRound.id,
          snapshotType: 'GLOBAL', // Snapshot soberano único
        },
      });

      if (snapshots.length === 0) {
        throw new Error('Snapshot GLOBAL não encontrado para a rodada final');
      }

      /**
       * 4️⃣ Atualizar rankingParticipant com base no snapshot
       */
      for (const participant of ranking.participants) {
        const snapshot = snapshots.find(s => s.userId === participant.userId);

        if (!snapshot) continue;

        await tx.rankingParticipant.update({
          where: { id: participant.id },
          data: {
            score: snapshot.scoreTotal - participant.scoreInitial,
            position: snapshot.position,
          },
        });
      }

      /**
       * 5️⃣ Fechar ranking
       */
      await tx.ranking.update({
        where: { id: rankingId },
        data: {
          status: 'CLOSED',
        },
      });
    });
  }
}
