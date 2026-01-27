import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export class MonthlyRankingController {
  static async handle(req: Request, res: Response, next: NextFunction) {
    try {
      /**
       * 🔹 1. Usuário autenticado
       * Middleware de auth já garantiu req.user
       */
      const userId = (req as any).user?.id;

      /**
       * 🔹 2. Buscar ranking mensal ativo (GLOBAL)
       */
      const ranking = await prisma.ranking.findFirst({
        where: {
          type: 'GLOBAL',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      });

      /**
       * 🔹 3. Se não existir ranking ativo
       */
      if (!ranking) {
        return res.json({
          ranking: null,
          participants: [],
          me: null,
        });
      }

      /**
       * 🔹 4. Determinar periodRef (YYYY-MM)
       * Usa startDate do ranking como referência
       */
      const refDate = ranking.startDate ?? new Date();
      const year = refDate.getUTCFullYear();
      const month = String(refDate.getUTCMonth() + 1).padStart(2, '0');
      const periodRef = `${year}-${month}`;

      /**
       * 🔹 5. Buscar snapshot do usuário autenticado
       * Leitura pura, sem ordenação, sem cálculo
       */
      let me = null;

      if (userId) {
        const snapshot = await prisma.rankingSnapshot.findFirst({
          where: {
            userId,
            snapshotType: 'GLOBAL',
            periodRef,
          },
          select: {
            position: true,
            scoreTotal: true,
          },
        });

        if (snapshot) {
          me = {
            isParticipant: true,
            position: snapshot.position,
            score: snapshot.scoreTotal,
          };
        } else {
          me = {
            isParticipant: false,
            position: null,
            score: null,
          };
        }
      }

      /**
       * 🔹 6. Payload final (incremental e compatível)
       */
      return res.json({
        ranking,
        participants: [],
        me,
      });
    } catch (err) {
      next(err);
    }
  }
}
