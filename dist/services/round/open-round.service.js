"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRoundService = void 0;
const round_repository_1 = require("../../repositories/round.repository");
const client_1 = require("@prisma/client");
class OpenRoundService {
    constructor() {
        this.repository = new round_repository_1.RoundRepository();
    }
    async execute(roundId) {
        const openRound = await this.repository.findOpenRound();
        if (openRound) {
            throw new Error('Já existe uma rodada aberta');
        }
        const round = await this.repository.findById(roundId);
        if (!round) {
            throw new Error('Rodada não encontrada');
        }
        if (round.status !== client_1.RoundStatus.CLOSED) {
            throw new Error('Somente rodadas CLOSED podem ser reabertas');
        }
        return this.repository.updateStatus(roundId, client_1.RoundStatus.OPEN);
    }
}
exports.OpenRoundService = OpenRoundService;
