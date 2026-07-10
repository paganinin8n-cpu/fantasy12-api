import { prisma } from '../../lib/prisma'
import { ScoreRoundService } from '../score/score-round.service'

export class ProcessRoundService {

  static async execute(roundId: string) {

    /**
     * 🔒 LOCK DE EXECUÇÃO (anti concorrência)
     */
    const existingJob = await prisma.internalJobExecution.findFirst({
      where: {
        jobName: 'PROCESS_ROUND',
        referenceId: roundId,
        status: 'RUNNING'
      }
    })

    if (existingJob) {
      throw new Error('Round already being processed')
    }

    const job = await prisma.internalJobExecution.create({
      data: {
        jobName: 'PROCESS_ROUND',
        referenceId: roundId,
        status: 'RUNNING'
      }
    })

    try {

      /**
       * 1️⃣ SCORE
       */
      const scoreService = new ScoreRoundService()
      await scoreService.execute(roundId)

      /**
       * 2️⃣ FINALIZAR JOB
       */
      await prisma.internalJobExecution.update({
        where: { id: job.id },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date()
        }
      })

    } catch (error: any) {

      await prisma.internalJobExecution.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: error.message,
          finishedAt: new Date()
        }
      })

      throw error
    }

  }

}
