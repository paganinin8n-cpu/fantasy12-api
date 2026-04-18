import { Request, Response } from 'express'
import { RoundRepository } from '../../repositories/round.repository'

export class ListRoundsController {
  static async handle(_req: Request, res: Response): Promise<Response> {
    try {
      const repository = new RoundRepository()
      const rounds = await repository.listAdmin()

      return res.status(200).json(rounds)
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Error listing rounds'
      })
    }
  }
}
