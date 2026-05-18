import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';
import { hasAnnualProSubscription } from '../../domain/subscription';
import { AppError } from '../../errors/AppError';

type CreateBolaoInput = {
  name: string;
  description?: string;
  maxParticipants?: number; // default 50
  durationDays: number;     // ex: 30, 60, 90
  createdByUserId: string;
};

export class CreateBolaoService {
  static async execute(input: CreateBolaoInput) {
    const {
      name,
      description,
      maxParticipants = 50,
      durationDays,
      createdByUserId,
    } = input;

    /**
     * 1️⃣ Validar usuário PRO anual
     */
    const user = await prisma.user.findUnique({
      where: { id: createdByUserId },
      select: {
        id: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            endAt: true,
          },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('Usuário', 'user_not_found');
    }

    if (!hasAnnualProSubscription(user.subscription)) {
      throw AppError.forbidden(
        'A criação de bolão é exclusiva para usuários com assinatura PRO anual ativa.',
        'annual_pro_subscription_required'
      );
    }

    /**
     * 2️⃣ Validar parâmetros
     */
    if (!name || name.trim().length < 3) {
      throw new Error('Bolão name must have at least 3 characters');
    }

    if (durationDays <= 0) {
      throw new Error('durationDays must be greater than zero');
    }

    if (maxParticipants !== 50) {
      // regra congelada neste bloco
      throw new Error('maxParticipants must be 50');
    }

    /**
     * 3️⃣ Transação atômica
     */
    const result = await prisma.$transaction(async tx => {
      /**
       * 3.1 Criar Ranking (Bolão) em DRAFT
       */
      const bolao = await tx.ranking.create({
        data: {
          id: randomUUID(), // ✅ INCREMENTO MÍNIMO
          name,
          description,
          type: 'BOLAO',
          status: 'DRAFT',
          maxParticipants,
          currentParticipants: 0,
          durationDays,
          createdByUserId,
        },
      });

      /**
       * 3.2 Criador entra automaticamente como participante
       */
      await tx.rankingParticipant.create({
        data: {
          rankingId: bolao.id,
          userId: createdByUserId,
          score: 0,
          scoreInitial: 0,
        },
      });

      /**
       * 3.3 Atualizar contador de participantes
       */
      const updatedBolao = await tx.ranking.update({
        where: { id: bolao.id },
        data: {
          currentParticipants: 1,
        },
      });

      return updatedBolao;
    });

    /**
     * 4️⃣ Retorno controlado
     */
    return {
      id: result.id,
      name: result.name,
      status: result.status,
      maxParticipants: result.maxParticipants,
      currentParticipants: result.currentParticipants,
      durationDays: result.durationDays,
    };
  }
}
