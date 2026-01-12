import { prisma } from '../lib/prisma';
import { TicketStatus, Ticket } from '@prisma/client';

export class TicketRepository {
  async findByUserAndRound(userId: string, roundId: string) {
    return prisma.ticket.findUnique({
      where: {
        userId_roundId: {
          userId,
          roundId
        }
      }
    });
  }

  async findByRound(roundId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: { roundId }
    });
  }

  async create(data: {
    userId: string;
    roundId: string;
    prediction: string;
  }) {
    return prisma.ticket.create({
      data: {
        userId: data.userId,
        roundId: data.roundId,
        prediction: data.prediction,
        status: TicketStatus.PENDING
      }
    });
  }

  async updatePrediction(ticketId: string, prediction: string) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        prediction,
        updatedAt: new Date()
      }
    });
  }

  async updateStatus(ticketId: string, status: TicketStatus) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    });
  }

  async updateScore(ticketId: string, scoreRound: number): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        scoreRound,
        updatedAt: new Date()
      }
    });
  }
}