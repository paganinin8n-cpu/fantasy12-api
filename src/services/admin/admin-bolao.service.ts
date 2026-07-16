type CreateBolaoInput = {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  createdByUserId: string;
};

export class AdminBolaoService {
  /**
   * 🔹 MÉTODO ANTIGO (PRESERVADO)
   * Usado por controllers antigos
   */
  static async create(adminId: string, input: CreateBolaoInput) {
    void adminId
    void input
    throw new Error('Fluxo administrativo legado de criação de Mesa está desativado; use o fluxo oficial')
  }

  /**
   * 🔹 MÉTODO ATUAL (LÓGICA REAL)
   */
  static async execute(input: CreateBolaoInput) {
    void input
    throw new Error('Fluxo administrativo legado de criação de Mesa está desativado; use o fluxo oficial')
  }
}
