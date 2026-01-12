// src/services/ticket/create-ticket.service.ts
import { TicketRepository } from '../../repositories/ticket.repository';
import { TicketStatus } from '@prisma/client';

interface CreateTicketInput {
  userId: string;
  roundId: string;
  prediction: string;
}

export class CreateTicketService {
  private ticketRepository = new TicketRepository();

  async execute({ userId, roundId, prediction }: CreateTicketInput) {
    // 1️⃣ Validação básica
    if (!userId || !roundId || !prediction) {
      throw new Error('Dados obrigatórios não informados');
    }

    // 2️⃣ Verifica se já existe ticket para o usuário nesta rodada
    const existingTicket = await this.ticketRepository.findByUserAndRound(
      userId,
      roundId
    );

    // 3️⃣ Se já existir, atualiza a previsão
    if (existingTicket) {
      // Só permite edição se ainda estiver pendente
      if (existingTicket.status !== TicketStatus.PENDING) {
        throw new Error('Bilhete não pode mais ser alterado');
      }

      return this.ticketRepository.updatePrediction(
        existingTicket.id,
        prediction
      );
    }

    // 4️⃣ Caso não exista, cria novo ticket
    return this.ticketRepository.create({
      userId,
      roundId,
      prediction
    });
  }
}
