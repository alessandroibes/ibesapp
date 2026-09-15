using Ibes.AgendaAtividades;
using Ibes.Foundation.Domain;

namespace Ibes.IntegrationTests;

public sealed class AgendaTests
{
    private static AtividadeAgenda Atividade(DateOnly inicio, Periodicidade periodicidade) => new() { Titulo = "Atividade", DataInicio = inicio, DataFim = inicio, DiaInteiro = true, Periodicidade = periodicidade, Intervalo = 1 };
    [Fact]
    public void SemanalRespeitaDiasIntervaloETermino()
    {
        var a = Atividade(new(2026, 9, 16), Periodicidade.Semanal); a.DiasSemana = [3, 6]; a.Intervalo = 2; a.RecorrenciaAte = new(2026, 10, 3); a.Validar();
        Assert.Equal([new DateOnly(2026, 9, 16), new(2026, 9, 19), new(2026, 9, 30), new(2026, 10, 3)], a.DatasEntre(new(2026, 9, 1), new(2026, 10, 10)));
    }
    [Fact]
    public void MensalNaoDeslocaDia31ParaOutroDia()
    {
        var a = Atividade(new(2026, 1, 31), Periodicidade.Mensal); a.Validar();
        Assert.Equal([new DateOnly(2026, 1, 31), new(2026, 3, 31)], a.DatasEntre(new(2026, 1, 1), new(2026, 3, 31)));
    }
    [Fact]
    public void AnualRespeitaAnoBissextoSemCriarDataInexistente()
    {
        var a = Atividade(new(2024, 2, 29), Periodicidade.Anual); a.Validar();
        Assert.Empty(a.DatasEntre(new(2025, 1, 1), new(2025, 12, 31)));
        Assert.True(a.OcorreEm(new(2028, 2, 29)));
    }
    [Fact]
    public void EventosDeVariosDiasSobrepostosAoInicioDaConsultaAparecem()
    {
        var a = Atividade(new(2026, 7, 2), Periodicidade.Diaria); a.Periodicidade = null; a.DataFim = new(2026, 7, 5); a.Validar();
        Assert.Single(a.DatasEntre(new(2026, 7, 4), new(2026, 7, 8)));
    }
    [Fact]
    public void EncerramentoPreservaPassadoELimitaFuturo()
    {
        var a = Atividade(new(2026, 9, 1), Periodicidade.Diaria); a.Intervalo = 3; a.SerieEncerradaEm = new(2026, 9, 5);
        Assert.True(a.OcorreEm(new(2026, 9, 4))); Assert.False(a.OcorreEm(new(2026, 9, 7)));
    }
    [Fact]
    public void RecusaIntervaloInvalidoEConsultaSemLimite()
    {
        var a = Atividade(new(2026, 9, 1), Periodicidade.Diaria); a.Intervalo = 0;
        Assert.Throws<RegraNegocioException>(a.Validar);
        Assert.Throws<RegraNegocioException>(() => a.DatasEntre(new(2020, 1, 1), new(2030, 1, 1)).ToList());
    }
}
