import assert from 'node:assert';
import ServicoDePagamento from '../src/ServicoDePagamento.js';

describe('Servico de Pagamento', () => {
    let servicoDePagamento;

    beforeEach(() => {
        servicoDePagamento = new ServicoDePagamento();
    });

    describe('Pagar', () => {
        it('deve registrar um pagamento com categoria "padrão" para valores até 100.00', () => {
            const pagamento = servicoDePagamento.pagar('1234-5678-9012', 'Riachuelo', 50.00);
            
            assert.equal(pagamento.codigoBarras, '1234-5678-9012');
            assert.equal(pagamento.empresa, 'Riachuelo');
            assert.equal(pagamento.valor, 50.00);
            assert.equal(pagamento.categoria, 'padrão');
        });

        it('deve registrar um pagamento com categoria "cara" para valores maiores que 100.00', () => {
            const pagamento = servicoDePagamento.pagar('0987-7656-3475', 'Renner', 156.87);
            
            assert.equal(pagamento.codigoBarras, '0987-7656-3475');
            assert.equal(pagamento.empresa, 'Renner');
            assert.equal(pagamento.valor, 156.87);
            assert.equal(pagamento.categoria, 'cara');
        });

        it('deve registrar um pagamento com categoria "padrão" para valor exatamente 100.00', () => {
            const pagamento = servicoDePagamento.pagar('1111-2222-3333', 'Marisa', 100.00);
            
            assert.equal(pagamento.categoria, 'padrão');
        });

        it('deve armazenar múltiplos pagamentos na lista', () => {
            const pag1 = servicoDePagamento.pagar('1234-5678-9012', 'CEA', 50.00);
            const pag2 = servicoDePagamento.pagar('0987-7656-3475', 'Montreal', 156.87);
            const pag3 = servicoDePagamento.pagar('5555-6666-7777', 'Cacau Show', 75.00);
            
            const ultimo = servicoDePagamento.consultarUltimoPagamento();
            assert.equal(ultimo.codigoBarras, pag3.codigoBarras);
            assert.equal(ultimo.empresa, pag3.empresa);
            assert.equal(ultimo.valor, pag3.valor);
        });
    });

    describe('Consultar último pagamento', () => {
        it('deve retornar null quando não há pagamentos', () => {
            const ultimoPagamento = servicoDePagamento.consultarUltimoPagamento();
        
            assert.equal(ultimoPagamento, null);
        });

        it('deve retornar o último pagamento registrado', () => {
            servicoDePagamento.pagar('1234-5678-9012', 'Adidas', 50.00);
            servicoDePagamento.pagar('0987-7656-3475', 'Nike', 156.87);
            
            const ultimoPagamento = servicoDePagamento.consultarUltimoPagamento();
            
            assert.equal(ultimoPagamento.codigoBarras, '0987-7656-3475');
            assert.equal(ultimoPagamento.empresa, 'Nike');
            assert.equal(ultimoPagamento.valor, 156.87);
            assert.equal(ultimoPagamento.categoria, 'cara');
        });

    });
});
