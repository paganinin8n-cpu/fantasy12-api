"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseRoundService = void 0;
const round_repository_1 = require("../../repositories/round.repository");
const client_1 = require("@prisma/client");
class CloseRoundService {
    constructor() {
        this.repository = new round_repository_1.RoundRepository();
    }
    async execute(roundId) {
        const round = await this.repository.findById(roundId);
        if (!round) {
            throw new Error('Rodada não encontrada');
        }
        if (round.status !== client_1.RoundStatus.OPEN) {
            throw new Error('Somente rodadas OPEN podem ser fechadas');
        }
        return this.repository.updateStatus(roundId, client_1.RoundStatus.CLOSED);
    }
}
exports.CloseRoundService = CloseRoundService;
//# sourceMappingURL=close-round.service.js.map