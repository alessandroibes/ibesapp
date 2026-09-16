using Ibes.AcervoHistorico;
using Ibes.Financeiro;
using Ibes.Foundation.Domain;

namespace Ibes.IntegrationTests;

public sealed class FinanceiroAcervoDominioTests
{
    [Fact]
    public void LancamentoExigeEntradaOuSaidaValorPositivoEMotivo()
    {
        var valido = new LancamentoFinanceiro { Tipo = TipoLancamentoFinanceiro.Entrada, Data = new DateOnly(2026, 9, 1), Valor = 25.50m, Motivo = "Inscrição" };
        valido.Validar();
        Assert.Throws<RegraNegocioException>(() => new LancamentoFinanceiro { Tipo = TipoLancamentoFinanceiro.Saida, Data = valido.Data, Valor = 0, Motivo = "Pagamento" }.Validar());
        Assert.Throws<RegraNegocioException>(() => new LancamentoFinanceiro { Tipo = TipoLancamentoFinanceiro.Entrada, Data = valido.Data, Valor = 1.001m, Motivo = "Oferta" }.Validar());
    }

    [Fact]
    public void MarcoAceitaDataOuPeriodoValido()
    {
        new MarcoHistorico { DataInicio = new DateOnly(1990, 1, 1), Titulo = "Fundação", Descricao = "Início da Embaixada.", Categoria = "Fundação" }.Validar();
        Assert.Throws<RegraNegocioException>(() => new MarcoHistorico { DataInicio = new DateOnly(2026, 2, 1), DataFim = new DateOnly(2026, 1, 1), Titulo = "Período", Descricao = "Inválido", Categoria = "Outro" }.Validar());
    }

    [Fact]
    public void AnexoAceitaSomenteFotoOuPdfAteDezMegabytes()
    {
        new AnexoMarcoHistorico { NomeArquivo = "memoria.pdf", TipoConteudo = "application/pdf", Conteudo = [1], Tamanho = 1 }.Validar();
        Assert.Throws<RegraNegocioException>(() => new AnexoMarcoHistorico { NomeArquivo = "arquivo.exe", TipoConteudo = "application/octet-stream", Conteudo = [1], Tamanho = 1 }.Validar());
    }
}
