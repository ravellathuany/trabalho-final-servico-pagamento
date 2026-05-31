export default class ServicoDePagamento {
    #pagamentos

    constructor() {
        this.#pagamentos = [];
    }

    pagar(codigoBarras, empresa, valor) {
        let categoria = 'padrão';
        if (valor > 100.00) {
            categoria = 'cara'
        }
        
        const pagamento = {
            codigoBarras,
            empresa,
            valor,
            categoria
        };

        this.#pagamentos.push(pagamento);
        return pagamento;
    }

    consultarUltimoPagamento() {
        if (this.#pagamentos.length === 0) {
            return null;
        }
        return this.#pagamentos[this.#pagamentos.length - 1];
    }
}
