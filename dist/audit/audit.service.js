"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const audit_repository_1 = require("./audit.repository");
class AuditService {
    constructor() {
        this.repo = new audit_repository_1.AuditRepository();
    }
    async logAccess(userId, action, metadata) {
        return this.repo.log({ userId, action, metadata });
    }
}
exports.AuditService = AuditService;
