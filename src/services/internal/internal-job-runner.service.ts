import { prisma } from '../../lib/prisma'

type InternalJobRunResult<T> = {
  executionId: string
  status: 'SUCCESS' | 'IDEMPOTENT'
  result: T | null
}

type ExecuteInput<T> = {
  jobName: string
  referenceId?: string | null
  allowRepeat?: boolean
  run: () => Promise<T>
}

export class InternalJobRunnerService {
  static async execute<T>({
    jobName,
    referenceId = null,
    allowRepeat = false,
    run,
  }: ExecuteInput<T>): Promise<InternalJobRunResult<T>> {
    if (referenceId) {
      const existing = await prisma.internalJobExecution.findFirst({
        where: {
          jobName,
          referenceId,
          status: { in: allowRepeat ? ['RUNNING'] : ['RUNNING', 'SUCCESS'] },
        },
        orderBy: { startedAt: 'desc' },
      })

      if (existing?.status === 'RUNNING') {
        throw new Error(`${jobName} already running for ${referenceId}`)
      }

      if (existing?.status === 'SUCCESS') {
        await prisma.auditLog.create({
          data: {
            action: 'INTERNAL_JOB_IDEMPOTENT_HIT',
            entity: 'InternalJobExecution',
            entityId: existing.id,
            metadata: { jobName, referenceId },
          },
        })

        return {
          executionId: existing.id,
          status: 'IDEMPOTENT',
          result: null,
        }
      }
    }

    const execution = await prisma.internalJobExecution.create({
      data: {
        jobName,
        referenceId,
        status: 'RUNNING',
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'INTERNAL_JOB_STARTED',
        entity: 'InternalJobExecution',
        entityId: execution.id,
        metadata: { jobName, referenceId },
      },
    })

    try {
      const result = await run()

      await prisma.internalJobExecution.update({
        where: { id: execution.id },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
        },
      })

      await prisma.auditLog.create({
        data: {
          action: 'INTERNAL_JOB_FINISHED',
          entity: 'InternalJobExecution',
          entityId: execution.id,
          metadata: { jobName, referenceId },
        },
      })

      return {
        executionId: execution.id,
        status: 'SUCCESS',
        result,
      }
    } catch (error: any) {
      await prisma.internalJobExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: error?.message ?? 'Internal job error',
          finishedAt: new Date(),
        },
      })

      await prisma.auditLog.create({
        data: {
          action: 'INTERNAL_JOB_FAILED',
          entity: 'InternalJobExecution',
          entityId: execution.id,
          metadata: {
            jobName,
            referenceId,
            error: error?.message ?? 'Internal job error',
          },
        },
      })

      throw error
    }
  }
}
