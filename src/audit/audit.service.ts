import { AuditRepository } from './audit.repository';

export class AuditService {
  private repo = new AuditRepository();

  async logAccess(userId: string, action: string, metadata?: any) {
    return this.repo.log({ userId, action, metadata });
  }
}
