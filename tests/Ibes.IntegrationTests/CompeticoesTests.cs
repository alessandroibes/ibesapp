using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ibes.Api.Features.Dominio;
using Ibes.Competicoes;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Progressao;
using Microsoft.EntityFrameworkCore;

namespace Ibes.IntegrationTests;

public sealed class CompeticoesTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    private async Task<HttpResponseMessage> Enviar(string rota, object dados, HttpMethod? metodo = null, Guid? igreja = null)
    {
        var csrf = await api.Adulto.GetFromJsonAsync<JsonElement>("/bff/csrf");
        using var request = new HttpRequestMessage(metodo ?? HttpMethod.Post, rota) { Content = JsonContent.Create(dados) };
        request.Headers.Add("X-Igreja-Id", (igreja ?? api.IgrejaA).ToString()); request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("token").GetString());
        return await api.Adulto.SendAsync(request);
    }
    private static async Task<T> Ler<T>(HttpResponseMessage response)
    {
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
    private async Task<Guid> Menino(int ano, string? nome = null)
    {
        var id = Guid.NewGuid();
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            db.Add(new Pessoa { Id = id, IgrejaId = api.IgrejaA, Nome = nome ?? $"Participante {id:N}", DataNascimento = new DateOnly(ano, 1, 1) });
            db.Add(new JornadaEmbaixador { IgrejaId = api.IgrejaA, PessoaId = id }); await db.SaveChangesAsync();
        });
        return id;
    }
    private async Task<(Guid Modalidade, Guid Prova)> Catalogo(string nome, TipoReferenciaProva referencia = TipoReferenciaProva.Nenhuma)
    {
        var m = await Ler<IdResponse>(await Enviar("/api/v1/competicoes/catalogo/modalidades", new ModalidadeRequest($"Modalidade {nome}")));
        var p = await Ler<IdResponse>(await Enviar("/api/v1/competicoes/catalogo/provas", new ProvaRequest(m.Id, nome, NaturezaProva.Coletiva, referencia)));
        return (m.Id, p.Id);
    }
    private async Task<(Guid Competicao, Guid Configuracao, Guid Escalacao)> Configurar(Guid prova, List<CategoriaCompeticao> categorias, int minimo, int maximo, int reservas, int? exato = null, string? referencia = null, TimeOnly? inicio = null)
    {
        var c = await Ler<IdResponse>(await Enviar("/api/v1/competicoes", new CompeticaoRequest($"Competição {Guid.NewGuid():N}", new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 2), new DateOnly(2026, 1, 1), "Local", null)));
        var pc = await Ler<IdResponse>(await Enviar($"/api/v1/competicoes/{c.Id}/provas", new ProvaCompeticaoRequest(prova, categorias, minimo, maximo, reservas, exato, referencia, inicio is null ? null : new DateOnly(2026, 7, 1), inicio, inicio?.AddHours(1))));
        var detalhe = await Ler<CompeticaoDetalheResponse>(await api.GetTenant($"/api/v1/competicoes/{c.Id}", api.IgrejaA));
        return (c.Id, pc.Id, detalhe.Provas.Single().Escalacao.Id);
    }
    private async Task<IdResponse> Aptidao(Guid pessoa, Guid prova) => await Ler<IdResponse>(await Enviar("/api/v1/competicoes/aptidoes", new AptidaoRequest(pessoa, prova, new DateOnly(2025, 1, 1))));

    [Fact]
    public async Task CandidatosMostraSomenteAptosEElegiveisNaDataBase()
    {
        var catalogo = await Catalogo($"Biografia Missionária {Guid.NewGuid():N}", TipoReferenciaProva.Missionario);
        var juniorApto = await Menino(2015); var juvenilApto = await Menino(2010); _ = await Menino(2015);
        await Aptidao(juniorApto, catalogo.Prova); await Aptidao(juvenilApto, catalogo.Prova);
        var competicao = await Ler<IdResponse>(await Enviar("/api/v1/competicoes", new CompeticaoRequest($"Competição {Guid.NewGuid():N}", new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 1), new DateOnly(2026, 1, 1), null, null)));
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/competicoes/{competicao.Id}/provas", new ProvaCompeticaoRequest(catalogo.Prova, [CategoriaCompeticao.Junior], 1, 1, 0, 1, null, null, null, null))).StatusCode);
        var configuracao = await Ler<IdResponse>(await Enviar($"/api/v1/competicoes/{competicao.Id}/provas", new ProvaCompeticaoRequest(catalogo.Prova, [CategoriaCompeticao.Junior], 1, 1, 0, 1, "Missionário definido pelo regulamento", null, null, null)));
        var candidatos = await Ler<List<CandidatoEscalacaoResponse>>(await api.GetTenant($"/api/v1/competicoes/{competicao.Id}/provas/{configuracao.Id}/candidatos", api.IgrejaA));
        Assert.Single(candidatos); Assert.Equal(juniorApto, candidatos[0].PessoaId); Assert.Equal("Junior", candidatos[0].FaixaEtaria);
    }

    [Fact]
    public async Task PessoaInativaNaoEAceitaParaAptidaoNemIndicadaParaEscalacao()
    {
        var catalogo = await Catalogo($"Prova de inativação {Guid.NewGuid():N}");
        var pessoa = await Menino(2015);
        await Aptidao(pessoa, catalogo.Prova);
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            (await db.Set<Pessoa>().SingleAsync(x => x.Id == pessoa)).Ativa = false;
            await db.SaveChangesAsync();
        });
        var dados = await Configurar(catalogo.Prova, [CategoriaCompeticao.Junior], 1, 1, 0, 1);
        var candidatos = await Ler<List<CandidatoEscalacaoResponse>>(await api.GetTenant(
            $"/api/v1/competicoes/{dados.Competicao}/provas/{dados.Configuracao}/candidatos", api.IgrejaA));
        Assert.Empty(candidatos);
        var outra = await Catalogo($"Outra prova {Guid.NewGuid():N}");
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar("/api/v1/competicoes/aptidoes",
            new AptidaoRequest(pessoa, outra.Prova, new DateOnly(2025, 1, 1)))).StatusCode);
    }

    [Fact]
    public async Task LimitesFinalizacaoBloqueioEReaberturaSaoAplicados()
    {
        var catalogo = await Catalogo($"Revezamento {Guid.NewGuid():N}");
        var pessoas = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Menino(2010)));
        foreach (var pessoa in pessoas) await Aptidao(pessoa, catalogo.Prova);
        var dados = await Configurar(catalogo.Prova, [CategoriaCompeticao.Livre], 2, 3, 1, 2);
        var escala = (await Ler<CompeticaoDetalheResponse>(await api.GetTenant($"/api/v1/competicoes/{dados.Competicao}", api.IgrejaA))).Provas.Single().Escalacao;
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}", new EscalacaoRequest(escala.Versao, pessoas.Select((p, i) => new ParticipanteEscalacaoRequest(p, i < 2 ? FuncaoEscalacao.Titular : FuncaoEscalacao.Reserva)).ToList()), HttpMethod.Put)).StatusCode);
        var incompleta = await Ler<EscalacaoResponse>(await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}", new EscalacaoRequest(escala.Versao, [new(pessoas[0], FuncaoEscalacao.Titular)]), HttpMethod.Put));
        Assert.Equal(HttpStatusCode.Conflict, (await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}", new EscalacaoRequest(escala.Versao, [new(pessoas[0], FuncaoEscalacao.Titular), new(pessoas[1], FuncaoEscalacao.Titular)]), HttpMethod.Put)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}/finalizacao", new VersaoRequest(incompleta.Versao))).StatusCode);
        var completa = await Ler<EscalacaoResponse>(await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}", new EscalacaoRequest(incompleta.Versao, [new(pessoas[0], FuncaoEscalacao.Titular), new(pessoas[1], FuncaoEscalacao.Titular), new(pessoas[2], FuncaoEscalacao.Reserva)]), HttpMethod.Put));
        var finalizada = await Ler<EscalacaoResponse>(await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}/finalizacao", new VersaoRequest(completa.Versao)));
        Assert.Equal(SituacaoEscalacao.Finalizada, finalizada.Situacao);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}", new EscalacaoRequest(finalizada.Versao, []), HttpMethod.Put)).StatusCode);
        var reaberta = await Ler<EscalacaoResponse>(await Enviar($"/api/v1/competicoes/escalacoes/{dados.Escalacao}/reabertura", new ReabrirEscalacaoRequest(finalizada.Versao, "Substituição necessária")));
        Assert.Equal(SituacaoEscalacao.Rascunho, reaberta.Situacao); Assert.Equal(2, reaberta.Alteracoes.Count);
        await api.NaIgreja(api.IgrejaA, async db => Assert.Equal(2, await db.Set<AlteracaoEscalacao>().CountAsync(x => x.EscalacaoProvaId == dados.Escalacao)));
    }

    [Fact]
    public async Task HorariosSobrepostosGeramAvisoSemBloquearEscalacao()
    {
        var pessoa = await Menino(2010); var provaA = await Catalogo($"Prova A {Guid.NewGuid():N}"); var provaB = await Catalogo($"Prova B {Guid.NewGuid():N}");
        await Aptidao(pessoa, provaA.Prova); await Aptidao(pessoa, provaB.Prova);
        var a = await Configurar(provaA.Prova, [CategoriaCompeticao.Livre], 1, 1, 0, 1, inicio: new TimeOnly(9, 0));
        var ea = (await Ler<CompeticaoDetalheResponse>(await api.GetTenant($"/api/v1/competicoes/{a.Competicao}", api.IgrejaA))).Provas.Single().Escalacao;
        await Ler<EscalacaoResponse>(await Enviar($"/api/v1/competicoes/escalacoes/{a.Escalacao}", new EscalacaoRequest(ea.Versao, [new(pessoa, FuncaoEscalacao.Titular)]), HttpMethod.Put));
        var b = await Configurar(provaB.Prova, [CategoriaCompeticao.Livre], 1, 1, 0, 1, inicio: new TimeOnly(9, 30));
        var candidatos = await Ler<List<CandidatoEscalacaoResponse>>(await api.GetTenant($"/api/v1/competicoes/{b.Competicao}/provas/{b.Configuracao}/candidatos", api.IgrejaA));
        Assert.Single(candidatos); Assert.Contains(candidatos[0].Conflitos, x => x.Contains("Conflito de horário"));
    }

    [Fact]
    public async Task DadosEChavesEstrangeirasFicamIsoladosPorIgreja()
    {
        var catalogo = await Catalogo($"Isolamento {Guid.NewGuid():N}");
        var modalidadeOutraIgreja = Guid.NewGuid();
        await api.NaIgreja(api.IgrejaB, async db =>
        {
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId, Permissoes = [Permissoes.ConsultarCompeticoes] }); await db.SaveChangesAsync();
            db.Add(new Modalidade { Id = modalidadeOutraIgreja, IgrejaId = api.IgrejaB, Nome = "Modalidade da Igreja B" }); await db.SaveChangesAsync();
        });
        try
        {
            var catalogoB = await Ler<List<ModalidadeResponse>>(await api.GetTenant("/api/v1/competicoes/catalogo", api.IgrejaB));
            Assert.Single(catalogoB); Assert.Equal(modalidadeOutraIgreja, catalogoB[0].Id); Assert.DoesNotContain(catalogoB, x => x.Id == catalogo.Modalidade);
            await api.NaIgreja(api.IgrejaA, async db =>
            {
                db.Add(new Prova { IgrejaId = api.IgrejaA, ModalidadeId = modalidadeOutraIgreja, Nome = "Referência cruzada", Natureza = NaturezaProva.Individual, TipoReferencia = TipoReferenciaProva.Nenhuma });
                await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            });
            await api.NaIgreja(null, async db => { Assert.Empty(await db.Set<Modalidade>().ToListAsync()); Assert.Empty(await db.Set<Competicao>().ToListAsync()); });
        }
        finally { await api.NaIgreja(api.IgrejaB, async db => { db.VinculosIgreja.Remove(await db.VinculosIgreja.SingleAsync()); await db.SaveChangesAsync(); }); }
    }
}
