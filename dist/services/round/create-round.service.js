"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoundService = void 0;
const round_repository_1 = require("../../repositories/round.repository");
class CreateRoundService {
    constructor() {
        this.repository = new round_repository_1.RoundRepository();
    }
    async execute(params) {
        const { openAt, closeAt } = params;
        if (openAt >= closeAt) {
            throw new Error('openAt deve ser anterior a closeAt');
        }
        const lastNumber = await this.repository.getLastRoundNumber();
        const nextNumber = lastNumber + 1;
        // Nome derivado (não persistido)
        const displayName = `Rodada ${String(nextNumber).padStart(3, '0')}`;
        const round = await this.repository.create({
            number: nextNumber,
            openAt,
            closeAt
        });
        return {
            ...round,
            displayName
        };
    }
}
exports.CreateRoundService = CreateRoundService;
