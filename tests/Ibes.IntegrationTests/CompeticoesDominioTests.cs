using Ibes.Competicoes;
using Ibes.Foundation.Domain;

namespace Ibes.IntegrationTests;

public sealed class CompeticoesDominioTests
{
    private static ProvaCompeticao Configuracao(int minimo = 2, int maximo = 3, int reservas = 1, int? exato = null) => new()
    {
        IgrejaId = Guid.NewGuid(),
        CompeticaoId = Guid.NewGuid(),
        ProvaId = Guid.NewGuid(),
        MinimoTitulares = minimo,
        MaximoParticipantes = maximo,
        MaximoReservas = reservas,
        QuantidadeExataTitulares = exato,
        Categorias = [new CategoriaProvaCompeticao { Categoria = CategoriaCompeticao.Livre }]
    };

    [Fact]
    public void MaximoConsideraTitularesEReservas()
    {
        var e = new EscalacaoProva { IgrejaId = Guid.NewGuid() }; var c = Configuracao();
        e.SubstituirParticipantes([(Guid.NewGuid(), FuncaoEscalacao.Titular), (Guid.NewGuid(), FuncaoEscalacao.Titular), (Guid.NewGuid(), FuncaoEscalacao.Reserva)], c);
        Assert.Equal(3, e.Participantes.Count);
        Assert.Throws<RegraNegocioException>(() => e.SubstituirParticipantes([(Guid.NewGuid(), FuncaoEscalacao.Titular), (Guid.NewGuid(), FuncaoEscalacao.Titular), (Guid.NewGuid(), FuncaoEscalacao.Reserva), (Guid.NewGuid(), FuncaoEscalacao.Reserva)], c));
        var limiteReservas = Configuracao(maximo: 4, reservas: 1);
        Assert.Throws<RegraNegocioException>(() => e.SubstituirParticipantes([(Guid.NewGuid(), FuncaoEscalacao.Titular), (Guid.NewGuid(), FuncaoEscalacao.Titular), (Guid.NewGuid(), FuncaoEscalacao.Reserva), (Guid.NewGuid(), FuncaoEscalacao.Reserva)], limiteReservas));
    }

    [Fact]
    public void FinalizacaoValidaMinimoExatoEReaberturaHistorica()
    {
        var e = new EscalacaoProva { IgrejaId = Guid.NewGuid() }; var c = Configuracao(exato: 2); var autor = Guid.NewGuid();
        e.SubstituirParticipantes([(Guid.NewGuid(), FuncaoEscalacao.Titular)], c);
        Assert.Throws<RegraNegocioException>(() => e.Finalizar(c, autor));
        e.SubstituirParticipantes([(Guid.NewGuid(), FuncaoEscalacao.Titular), (Guid.NewGuid(), FuncaoEscalacao.Titular)], c);
        e.Finalizar(c, autor);
        Assert.Throws<RegraNegocioException>(() => e.SubstituirParticipantes([], c));
        e.Reabrir(autor, "Correção da equipe");
        Assert.Equal(SituacaoEscalacao.Rascunho, e.Situacao);
        Assert.Equal([TipoAlteracaoEscalacao.Finalizacao, TipoAlteracaoEscalacao.Reabertura], e.Alteracoes.Select(x => x.Tipo));
    }

    [Theory]
    [InlineData(2015, CategoriaCompeticao.Junior, true)]
    [InlineData(2012, CategoriaCompeticao.Adolescente, true)]
    [InlineData(2010, CategoriaCompeticao.Juvenil, true)]
    [InlineData(2008, CategoriaCompeticao.Livre, false)]
    public void ElegibilidadeUsaDataBase(int ano, CategoriaCompeticao categoria, bool elegivel)
    {
        var c = Configuracao(); c.Categorias = [new CategoriaProvaCompeticao { Categoria = categoria }];
        Assert.Equal(elegivel, c.Elegivel(new DateOnly(ano, 1, 1), new DateOnly(2026, 1, 1)));
    }

    [Theory]
    [InlineData(2014, 1, 2, CategoriaCompeticao.Junior, true)]
    [InlineData(2014, 1, 1, CategoriaCompeticao.Junior, false)]
    [InlineData(2014, 1, 1, CategoriaCompeticao.Adolescente, true)]
    [InlineData(2011, 1, 1, CategoriaCompeticao.Adolescente, false)]
    [InlineData(2011, 1, 1, CategoriaCompeticao.Juvenil, true)]
    [InlineData(2008, 1, 1, CategoriaCompeticao.Livre, false)]
    public void LimitesDasCategoriasSaoCalculadosNoAniversario(int ano, int mes, int dia, CategoriaCompeticao categoria, bool elegivel)
    {
        var c = Configuracao(); c.Categorias = [new CategoriaProvaCompeticao { Categoria = categoria }];
        Assert.Equal(elegivel, c.Elegivel(new DateOnly(ano, mes, dia), new DateOnly(2026, 1, 1)));
    }
}
