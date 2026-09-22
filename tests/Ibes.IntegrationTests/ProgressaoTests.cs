using Ibes.Foundation.Domain;
using Ibes.Progressao;

namespace Ibes.IntegrationTests;

public sealed class ProgressaoTests
{
    private static readonly DateOnly Hoje = new(2026, 9, 15);
    private static readonly Guid Autor = Guid.NewGuid();
    private static JornadaEmbaixador Candidato(DateOnly nascimento, DateOnly data)
    {
        var jornada = new JornadaEmbaixador { IgrejaId = Guid.NewGuid(), PessoaId = Guid.NewGuid() };
        foreach (var requisito in Enum.GetValues<RequisitoMinimo>().Reverse()) jornada.ConcluirRequisito(requisito, data, nascimento, Hoje, Autor);
        return jornada;
    }
    private static VersaoManual Manual(JornadaEmbaixador jornada) => new()
    {
        IgrejaId = jornada.IgrejaId,
        Identificacao = "Edição fictícia de teste",
        Tarefas = [new TarefaManual { Nome = "Tarefa fictícia A" }, new TarefaManual { Nome = "Tarefa fictícia B" }]
    };

    [Theory]
    [InlineData(14, 12)]
    [InlineData(15, 6)]
    [InlineData(16, 6)]
    public void FronteiraDeQuatorzeAnos(int diaAdmissao, int meses)
    {
        var nascimento = new DateOnly(2010, 9, 15); var data = new DateOnly(2024, 9, diaAdmissao);
        var jornada = Candidato(nascimento, data);
        jornada.Admitir(data, nascimento, Hoje, Guid.NewGuid(), Autor);
        Assert.Equal(meses, jornada.MesesPermanencia);
    }

    [Fact]
    public void CincoRequisitosNaoAdmitemAutomaticamente()
    {
        var jornada = Candidato(new DateOnly(2010, 1, 1), new DateOnly(2024, 1, 1));
        Assert.Empty(jornada.Postos); Assert.Null(jornada.MesesPermanencia);
        Assert.Equal("Candidato", jornada.Situacao(new DateOnly(2010, 1, 1), Hoje));
    }

    [Fact]
    public void AdmissaoNaoPodeAntecederRequisitos()
    {
        var nascimento = new DateOnly(2010, 1, 1); var data = new DateOnly(2024, 1, 2);
        var jornada = Candidato(nascimento, data);
        Assert.Throws<RegraNegocioException>(() => jornada.Admitir(data.AddDays(-1), nascimento, Hoje, Guid.NewGuid(), Autor));
    }

    [Fact]
    public void TarefasForaDeOrdemEPermanenciaImutavel()
    {
        var nascimento = new DateOnly(2010, 9, 15); var ingresso = new DateOnly(2024, 9, 14);
        var jornada = Candidato(nascimento, ingresso); var manual = Manual(jornada);
        jornada.Admitir(ingresso, nascimento, Hoje, manual.Id, Autor);
        jornada.ConcluirTarefa(manual.Tarefas[1].Id, manual, ingresso.AddDays(2), nascimento, Hoje, Autor);
        jornada.ConcluirTarefa(manual.Tarefas[0].Id, manual, ingresso.AddDays(1), nascimento, Hoje, Autor);
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirPosto(manual, ingresso.AddMonths(12).AddDays(-1), nascimento, Hoje, Guid.NewGuid(), Autor));
        Assert.Equal(12, jornada.MesesPermanencia);
        var conclusao = ingresso.AddMonths(12);
        jornada.ConcluirPosto(manual, conclusao, nascimento, Hoje, Guid.NewGuid(), Autor);
        Assert.Equal(conclusao, jornada.Postos[0].DataConclusao);
        Assert.Equal(conclusao, jornada.Postos[1].DataIngresso);
        Assert.Empty(jornada.Cerimonias);
    }

    [Fact]
    public void TarefaDeOutraEdicaoNaoValeParaJornada()
    {
        var nascimento = new DateOnly(2010, 1, 1); var data = new DateOnly(2024, 1, 1);
        var jornada = Candidato(nascimento, data); var manual = Manual(jornada); var outra = Manual(jornada);
        jornada.Admitir(data, nascimento, Hoje, manual.Id, Autor);
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirTarefa(outra.Tarefas[0].Id, outra, data, nascimento, Hoje, Autor));
        Assert.Equal(manual.Id, jornada.Atual().VersaoManualId);
    }

    [Fact]
    public void NaoConcluiPostoComTarefaPendenteOuPosterior()
    {
        var nascimento = new DateOnly(2010, 1, 1); var data = new DateOnly(2024, 1, 1);
        var jornada = Candidato(nascimento, data); var manual = Manual(jornada);
        jornada.Admitir(data, nascimento, Hoje, manual.Id, Autor);
        jornada.ConcluirTarefa(manual.Tarefas[0].Id, manual, data, nascimento, Hoje, Autor);
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirPosto(manual, data.AddMonths(6), nascimento, Hoje, Guid.NewGuid(), Autor));
        jornada.ConcluirTarefa(manual.Tarefas[1].Id, manual, data.AddMonths(7), nascimento, Hoje, Autor);
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirPosto(manual, data.AddMonths(6), nascimento, Hoje, Guid.NewGuid(), Autor));
    }

    [Fact]
    public void SeniorIngressaEmeritoSemManualENaoInventaTarefas()
    {
        var nascimento = new DateOnly(2010, 1, 1); var data = new DateOnly(2024, 1, 1);
        var jornada = Candidato(nascimento, data); var manual = Manual(jornada);
        jornada.Admitir(data, nascimento, Hoje, manual.Id, Autor);
        for (var i = 0; i < 3; i++)
        {
            foreach (var t in manual.Tarefas) jornada.ConcluirTarefa(t.Id, manual, data, nascimento, Hoje, Autor);
            var proximo = i == 2 ? null : Manual(jornada);
            data = data.AddMonths(6);
            jornada.ConcluirPosto(manual, data, nascimento, Hoje, proximo?.Id, Autor);
            if (proximo is not null) manual = proximo;
        }
        Assert.Equal(Posto.Emerito, jornada.Atual().Posto);
        Assert.Null(jornada.Atual().VersaoManualId); Assert.Empty(jornada.Atual().Tarefas);
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirPosto(manual, data, nascimento, Hoje, (Guid?)null, Autor));
    }

    [Fact]
    public void EmbaixadorAteVesperaDosDezoitoEPreservaHistorico()
    {
        var nascimento = new DateOnly(2008, 9, 15); var admissao = new DateOnly(2022, 9, 15);
        var jornada = Candidato(nascimento, admissao);
        jornada.Admitir(admissao, nascimento, Hoje, Guid.NewGuid(), Autor);
        Assert.Equal("Embaixador", jornada.Situacao(nascimento, new DateOnly(2026, 9, 14)));
        Assert.Equal("Trajetória histórica", jornada.Situacao(nascimento, new DateOnly(2026, 9, 15)));
        Assert.Single(jornada.Postos);
        var candidato = new JornadaEmbaixador();
        Assert.Throws<RegraNegocioException>(() => candidato.ConcluirRequisito(RequisitoMinimo.Tema, Hoje, nascimento, Hoje, Autor));
    }

    [Fact]
    public void AceitaRegistroRetrospectivoDePessoaAdulta()
    {
        var nascimento = new DateOnly(1990, 1, 1); var data = new DateOnly(2004, 1, 1);
        var jornada = Candidato(nascimento, data); jornada.Admitir(data, nascimento, Hoje, Guid.NewGuid(), Autor);
        Assert.Equal("Trajetória histórica", jornada.Situacao(nascimento, Hoje));
        Assert.Equal(data, jornada.Atual().DataIngresso);
    }

    [Theory]
    [InlineData(2014, 9, 16, "Junior")]
    [InlineData(2014, 9, 15, "Adolescente")]
    [InlineData(2011, 9, 16, "Adolescente")]
    [InlineData(2011, 9, 15, "Juvenil")]
    [InlineData(2008, 9, 16, "Juvenil")]
    [InlineData(2008, 9, 15, null)]
    public void FaixaEtariaCalculadaNaDataBase(int ano, int mes, int dia, string? faixa) => Assert.Equal(faixa, Datas.FaixaEtaria(new DateOnly(ano, mes, dia), Hoje));

    [Fact]
    public void DatasFuturasAntesDoIngressoEDuplicatasSaoRejeitadas()
    {
        var nascimento = new DateOnly(2010, 1, 1); var data = new DateOnly(2024, 1, 1);
        var jornada = Candidato(nascimento, data); var manual = Manual(jornada);
        jornada.Admitir(data, nascimento, Hoje, manual.Id, Autor);
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirTarefa(manual.Tarefas[0].Id, manual, Hoje.AddDays(1), nascimento, Hoje, Autor));
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirTarefa(manual.Tarefas[0].Id, manual, data.AddDays(-1), nascimento, Hoje, Autor));
        jornada.ConcluirTarefa(manual.Tarefas[0].Id, manual, data, nascimento, Hoje, Autor);
        Assert.Throws<RegraNegocioException>(() => jornada.ConcluirTarefa(manual.Tarefas[0].Id, manual, data, nascimento, Hoje, Autor));
    }

    [Fact]
    public void CorrigirDatasPreservaFatosERejeitaInconsistenciasCronologicas()
    {
        var nascimento = new DateOnly(2010, 1, 1);
        var requisito = new DateOnly(2024, 1, 1);
        var jornada = Candidato(nascimento, requisito);
        var manual = Manual(jornada);
        var admissao = requisito.AddDays(10);
        jornada.Admitir(admissao, nascimento, Hoje, manual.Id, Autor);
        jornada.ConcluirTarefa(manual.Tarefas[0].Id, manual, admissao.AddDays(1), nascimento, Hoje, Autor);

        jornada.CorrigirDataRequisito(RequisitoMinimo.Tema, requisito.AddDays(-1), nascimento, Hoje);
        jornada.CorrigirDataTarefa(manual.Tarefas[0].Id, admissao.AddDays(2), nascimento, Hoje);

        Assert.Equal(requisito.AddDays(-1), jornada.Requisitos.Single(r => r.Requisito == RequisitoMinimo.Tema).DataConclusao);
        Assert.Equal(admissao.AddDays(2), jornada.Atual().Tarefas.Single().DataConclusao);
        Assert.Throws<RegraNegocioException>(() => jornada.CorrigirDataRequisito(RequisitoMinimo.Tema, admissao.AddDays(1), nascimento, Hoje));
        Assert.Throws<RegraNegocioException>(() => jornada.CorrigirDataTarefa(manual.Tarefas[0].Id, admissao.AddDays(-1), nascimento, Hoje));
        Assert.Equal(admissao, jornada.Atual().DataIngresso);
    }
}
