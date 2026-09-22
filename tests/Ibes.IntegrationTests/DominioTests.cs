using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ibes.Api.Features.Dominio;
using Ibes.Foundation.Persistence;
using Ibes.Foundation.Organizacoes;
using Ibes.Pessoas;
using Ibes.Progressao;
using Ibes.Embaixadas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;

namespace Ibes.IntegrationTests;

public sealed class DominioTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    private static DadosPessoa Dados(string nome = "Pessoa de teste", DateOnly? nascimento = null) => new(nome, nascimento ?? new DateOnly(2010, 1, 1), null, null, null, null, null, null, null, null, null);
    private async Task<HttpResponseMessage> Enviar(string rota, object dados, HttpMethod? metodo = null, Guid? igreja = null)
    {
        var csrf = await api.Adulto.GetFromJsonAsync<JsonElement>("/bff/csrf");
        using var request = new HttpRequestMessage(metodo ?? HttpMethod.Post, rota) { Content = JsonContent.Create(dados) };
        request.Headers.Add("X-Igreja-Id", (igreja ?? api.IgrejaA).ToString());
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("token").GetString());
        return await api.Adulto.SendAsync(request);
    }
    private static async Task<T> Ler<T>(HttpResponseMessage response)
    {
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
    private async Task<IdResponse> CriarPessoa() => await Ler<IdResponse>(await Enviar("/api/v1/pessoas", Dados()));
    private async Task<JornadaResponse> Jornada(Guid pessoa) => await Ler<JornadaResponse>(await api.GetTenant($"/api/v1/pessoas/{pessoa}/jornada", api.IgrejaA));
    private async Task<PessoaResponse> Pessoa(Guid pessoa) => await Ler<PessoaResponse>(await api.GetTenant($"/api/v1/pessoas/{pessoa}", api.IgrejaA));
    private async Task<ManualResponse> Manual(int posto)
    {
        var id = await Ler<IdResponse>(await Enviar("/api/v1/manuais/versoes", new ManualRequest(posto, "Edição fictícia " + Guid.NewGuid(), ["Tarefa fictícia A", "Tarefa fictícia B"])));
        return (await Ler<List<ManualResponse>>(await api.GetTenant("/api/v1/manuais", api.IgrejaA))).Single(v => v.Id == id.Id);
    }
    private async Task<Guid> Candidato()
    {
        var pessoa = await CriarPessoa();
        await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa.Id}/candidatura", new VersaoRequest(pessoa.Versao)));
        return pessoa.Id;
    }
    private async Task ConcluirRequisitos(Guid pessoa)
    {
        foreach (var r in new[] { 5, 3, 1, 4, 2 })
        {
            var jornada = await Jornada(pessoa);
            await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos", new ConcluirRequisitoRequest(jornada.Versao, r, new DateOnly(2024, 1, 1))));
        }
    }

    [Fact]
    public async Task JornadaCompletaComDatasHistoricasSemCerimonia()
    {
        var pessoa = await Candidato(); await ConcluirRequisitos(pessoa);
        var jornada = await Jornada(pessoa); Assert.True(jornada.ElegivelAdmissao); Assert.Empty(jornada.Postos);
        var manuais = new[] { await Manual(1), await Manual(2), await Manual(3) };
        await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/admissao", new AdmissaoRequest(jornada.Versao, manuais[0].Id, new DateOnly(2024, 1, 1))));
        var data = new DateOnly(2024, 1, 1);
        for (var i = 0; i < 3; i++)
        {
            foreach (var tarefa in manuais[i].Tarefas.AsEnumerable().Reverse())
            {
                jornada = await Jornada(pessoa);
                await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/tarefas", new ConcluirTarefaRequest(jornada.Versao, tarefa.Id, data.AddDays(1))));
            }
            data = data.AddMonths(6); jornada = await Jornada(pessoa);
            await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/conclusao-posto", new ConcluirPostoRequest(jornada.Versao, i == 2 ? null : manuais[i + 1].Id, data)));
        }
        jornada = await Jornada(pessoa); Assert.Equal(4, jornada.Postos.Count); Assert.Equal(6, jornada.MesesPermanencia);
        Assert.Null(jornada.Postos[3].VersaoManualId); Assert.Empty(jornada.Cerimonias);
        for (var i = 0; i < 3; i++) Assert.Equal(jornada.Postos[i].DataConclusao, jornada.Postos[i + 1].DataIngresso);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/pessoas/{pessoa}/jornada/conclusao-posto", new ConcluirPostoRequest(jornada.Versao, null, data))).StatusCode);
        await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/cerimonias", new CerimoniaRequest(jornada.Versao, jornada.Postos[3].Id, data.AddDays(5), "Entrega de certificado")));
        Assert.Single((await Jornada(pessoa)).Cerimonias);
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            var registros = await db.Auditoria.Where(a => a.Entidade == nameof(ConclusaoTarefa)).ToListAsync();
            Assert.NotEmpty(registros); Assert.All(registros, a => { Assert.Equal(api.UsuarioId, a.UsuarioId); Assert.NotNull(a.Chave); });
        });
    }

    [Fact]
    public async Task ConcorrenciaEReenvioNaoDuplicamConclusoes()
    {
        var pessoa = await Candidato(); var jornada = await Jornada(pessoa);
        var request = new ConcluirRequisitoRequest(jornada.Versao, 1, new DateOnly(2024, 1, 1));
        await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos", request));
        Assert.Equal(HttpStatusCode.Conflict, (await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos", request)).StatusCode);
        Assert.Single((await Jornada(pessoa)).Requisitos, r => r.DataConclusao != null);
        await api.NaIgreja(api.IgrejaA, async db1 =>
        {
            var p1 = await db1.Set<Pessoa>().SingleAsync(p => p.Id == pessoa);
            await api.NaIgreja(api.IgrejaA, async db2 =>
            {
                var p2 = await db2.Set<Pessoa>().SingleAsync(p => p.Id == pessoa);
                p2.WhatsApp = "Contato alterado"; await db2.SaveChangesAsync();
            });
            p1.Nome = "Edição obsoleta";
            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => db1.SaveChangesAsync());
        });
    }

    [Fact]
    public async Task CorrecaoDeDataDaJornadaExigeConselheiroVersaoETenantEAtualizaSomenteOFato()
    {
        var pessoa = await Candidato();
        var jornada = await Jornada(pessoa);
        var concluido = await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos",
            new ConcluirRequisitoRequest(jornada.Versao, (int)RequisitoMinimo.Tema, new DateOnly(2024, 1, 1))));

        var corrigido = await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos/{(int)RequisitoMinimo.Tema}",
            new CorrigirDataConclusaoRequest(concluido.Versao, new DateOnly(2023, 12, 31)), HttpMethod.Put));
        var atual = await Jornada(pessoa);
        Assert.Equal(new DateOnly(2023, 12, 31), atual.Requisitos.Single(r => r.Requisito == (int)RequisitoMinimo.Tema).DataConclusao);
        Assert.Equal(HttpStatusCode.Conflict, (await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos/{(int)RequisitoMinimo.Tema}",
            new CorrigirDataConclusaoRequest(concluido.Versao, new DateOnly(2023, 12, 30)), HttpMethod.Put)).StatusCode);

        await api.NaIgreja(api.IgrejaB, async db =>
        {
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId, Permissoes = Permissoes.Todas });
            await db.SaveChangesAsync();
        });
        try
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos/{(int)RequisitoMinimo.Tema}",
                new CorrigirDataConclusaoRequest(corrigido.Versao, new DateOnly(2023, 12, 30)), HttpMethod.Put, api.IgrejaB)).StatusCode);
        }
        finally
        {
            await api.NaIgreja(api.IgrejaB, async db =>
            {
                db.VinculosIgreja.Remove(await db.VinculosIgreja.SingleAsync());
                await db.SaveChangesAsync();
            });
        }
    }

    [Fact]
    public async Task IsolamentoEntrePessoasDasDuasIgrejas()
    {
        var pessoa = await CriarPessoa(); var outra = Guid.NewGuid();
        await api.NaIgreja(api.IgrejaB, async db =>
        {
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId, Permissoes = Permissoes.Todas });
            db.Add(new Pessoa { Id = outra, IgrejaId = api.IgrejaB, Nome = "Pessoa de outra Igreja" }); await db.SaveChangesAsync();
        });
        try
        {
            Assert.Equal(HttpStatusCode.NotFound, (await api.GetTenant($"/api/v1/pessoas/{pessoa.Id}", api.IgrejaB)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await api.GetTenant($"/api/v1/pessoas/{outra}", api.IgrejaA)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await Enviar($"/api/v1/pessoas/{outra}/responsaveis", new ResponsavelRequest(pessoa.Versao, "Mãe", "Responsável", null, null))).StatusCode);
            await api.NaIgreja(null, async db => { Assert.Empty(await db.Set<Pessoa>().ToListAsync()); Assert.Empty(await db.Set<VersaoManual>().ToListAsync()); });
        }
        finally { await api.NaIgreja(api.IgrejaB, async db => { db.VinculosIgreja.Remove(await db.VinculosIgreja.SingleAsync()); await db.SaveChangesAsync(); }); }
    }

    [Fact]
    public async Task ResponsaveisLivresPodemSerIncluidosEditadosERemovidos()
    {
        var pessoa = await CriarPessoa();
        var id = await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa.Id}/responsaveis", new ResponsavelRequest(pessoa.Versao, "Mãe", "Maria", "11999999999", true)));
        var ficha = await Pessoa(pessoa.Id);
        var cadastrado = Assert.Single(ficha.Responsaveis);
        Assert.Equal("Maria", cadastrado.Nome); Assert.True(cadastrado.MoraComOEmbaixador);
        var atualizado = await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa.Id}/responsaveis/{id.Id}", new AlterarResponsavelRequest(id.Versao, "Avó", "Maria Silva", null, false), HttpMethod.Put));
        cadastrado = Assert.Single((await Pessoa(pessoa.Id)).Responsaveis);
        Assert.Equal("Avó", cadastrado.Relacao); Assert.False(cadastrado.MoraComOEmbaixador);
        Assert.Equal(HttpStatusCode.NoContent, (await Enviar($"/api/v1/pessoas/{pessoa.Id}/responsaveis/{id.Id}?versao={atualizado.Versao}", new { }, HttpMethod.Delete)).StatusCode);
        Assert.Empty((await Pessoa(pessoa.Id)).Responsaveis);
    }

    [Fact]
    public async Task VinculosEclesiasticosPreservamHistorico()
    {
        var pessoa = await CriarPessoa(); var ficha = await Pessoa(pessoa.Id);
        var vinculo = await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa.Id}/vinculos-eclesiasticos", new VinculoRequest(ficha.Versao, "Igreja informada", "Membro", new DateOnly(2024, 1, 1))));
        Assert.Equal(HttpStatusCode.NoContent, (await Enviar($"/api/v1/pessoas/{pessoa.Id}/vinculos-eclesiasticos/{vinculo.Id}/encerramento", new EncerrarVinculoRequest(vinculo.Versao, new DateOnly(2025, 1, 1)))).StatusCode);
        Assert.Single((await Pessoa(pessoa.Id)).Vinculos);
    }

    [Fact]
    public async Task InativacaoOcultaPessoaDasListasOperacionaisEPreservaHistorico()
    {
        var pessoa = await CriarPessoa();
        var inativada = await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa.Id}/inativacao",
            new AlterarSituacaoPessoaRequest(pessoa.Versao, new DateOnly(2026, 1, 1), "Mudança de cidade")));
        var ativos = await Ler<PessoasResponse>(await api.GetTenant("/api/v1/pessoas", api.IgrejaA));
        Assert.DoesNotContain(ativos.Pessoas, x => x.Id == pessoa.Id);
        var todos = await Ler<PessoasResponse>(await api.GetTenant("/api/v1/pessoas?incluirInativos=true", api.IgrejaA));
        Assert.False(todos.Pessoas.Single(x => x.Id == pessoa.Id).Ativa);
        var ficha = await Pessoa(pessoa.Id);
        Assert.False(ficha.Ativa); Assert.Single(ficha.AlteracoesSituacao);
        await api.NaIgreja(api.IgrejaB, async db =>
        {
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId, Permissoes = Permissoes.Todas });
            await db.SaveChangesAsync();
        });
        try
        {
            Assert.Equal(HttpStatusCode.NotFound, (await Enviar($"/api/v1/pessoas/{pessoa.Id}/reativacao",
                new AlterarSituacaoPessoaRequest(inativada.Versao, new DateOnly(2026, 2, 1), "Retorno"), igreja: api.IgrejaB)).StatusCode);
        }
        finally
        {
            await api.NaIgreja(api.IgrejaB, async db =>
            {
                db.VinculosIgreja.Remove(await db.VinculosIgreja.SingleAsync());
                await db.SaveChangesAsync();
            });
        }
        await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa.Id}/reativacao",
            new AlterarSituacaoPessoaRequest(inativada.Versao, new DateOnly(2026, 2, 1), "Retorno")));
        ficha = await Pessoa(pessoa.Id);
        Assert.True(ficha.Ativa); Assert.Equal(2, ficha.AlteracoesSituacao.Count);
    }

    [Fact]
    public async Task ValidacaoCsrfEPermissoesSaoObrigatorios()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar("/api/v1/pessoas", Dados(""))).StatusCode);
        var pessoa = await CriarPessoa();
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/pessoas/{pessoa.Id}", new AlterarPessoaRequest(pessoa.Versao, Dados("")), HttpMethod.Put)).StatusCode);
        using var semCsrf = new HttpRequestMessage(HttpMethod.Post, "/api/v1/pessoas") { Content = JsonContent.Create(Dados()) };
        semCsrf.Headers.Add("X-Igreja-Id", api.IgrejaA.ToString());
        Assert.Equal(HttpStatusCode.BadRequest, (await api.Adulto.SendAsync(semCsrf)).StatusCode);
        await api.NaIgreja(api.IgrejaA, async db => { (await db.VinculosIgreja.SingleAsync()).Permissoes = [Permissoes.ConsultarFundacao]; await db.SaveChangesAsync(); });
        try
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Enviar("/api/v1/pessoas", Dados())).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await api.GetTenant("/api/v1/embaixada/conselheiros", api.IgrejaA)).StatusCode);
        }
        finally { await api.NaIgreja(api.IgrejaA, async db => { (await db.VinculosIgreja.SingleAsync()).Permissoes = Permissoes.Todas; await db.SaveChangesAsync(); }); }
    }

    [Fact]
    public async Task CadastroInstitucionalEFluxoProprioDeConselheiro()
    {
        var antes = await Ler<EmbaixadaResponse>(await api.GetTenant("/api/v1/embaixada", api.IgrejaA));
        var alterar = new EmbaixadaRequest(antes.NomeIgreja, "Endereço de teste", "Pastor de teste", antes.VersaoIgreja,
            antes.NomeOficial, "Nome usual", new DateOnly(1990, 1, 1), "Endereço", "História registrada", antes.VersaoEmbaixada);
        Assert.Equal(HttpStatusCode.NoContent, (await Enviar("/api/v1/embaixada", alterar, HttpMethod.Put)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Enviar("/api/v1/embaixada", alterar, HttpMethod.Put)).StatusCode);
        Assert.Equal("História registrada", (await Ler<EmbaixadaResponse>(await api.GetTenant("/api/v1/embaixada", api.IgrejaA))).Historia);
        var menor = await CriarPessoa();
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar("/api/v1/embaixada/conselheiros", new ConselheiroRequest(menor.Id, menor.Versao, null, new DateOnly(2024, 1, 1)))).StatusCode);
        var adulto = await Ler<IdResponse>(await Enviar("/api/v1/pessoas", Dados("Adulto Conselheiro", new DateOnly(1980, 1, 1))));
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            db.Add(new JornadaEmbaixador { IgrejaId = api.IgrejaA, PessoaId = adulto.Id });
            await db.SaveChangesAsync();
        });
        var c = await Ler<IdResponse>(await Enviar("/api/v1/embaixada/conselheiros", new ConselheiroRequest(adulto.Id, adulto.Versao, null, new DateOnly(2023, 1, 1))));
        var atualizado = (await Ler<List<ConselheiroResponse>>(await api.GetTenant("/api/v1/embaixada/conselheiros", api.IgrejaA))).Single(x => x.Id == c.Id);
        Assert.True(atualizado.PossuiJornada);
        var fichaConselheiro = await Pessoa(adulto.Id);
        Assert.True(fichaConselheiro.PossuiJornada); Assert.True(fichaConselheiro.ConselheiroVigente);
        var pessoas = await Ler<PessoasResponse>(await api.GetTenant("/api/v1/pessoas?condicao=visitantes", api.IgrejaA));
        Assert.DoesNotContain(pessoas.Pessoas, p => p.Id == adulto.Id);
        Assert.Equal(c.Id, (await Ler<ConselheiroResponse>(await api.GetTenant($"/api/v1/embaixada/conselheiros/{c.Id}", api.IgrejaA))).Id);
        Assert.Equal(HttpStatusCode.NotFound, (await api.GetTenant("/api/v1/embaixada/liderancas", api.IgrejaA)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Enviar($"/api/v1/embaixada/conselheiros/{c.Id}/encerramento", new EncerrarVinculoRequest(atualizado.Versao, new DateOnly(2025, 1, 1)))).StatusCode);
        Assert.NotNull((await Ler<List<ConselheiroResponse>>(await api.GetTenant("/api/v1/embaixada/conselheiros", api.IgrejaA))).Single(x => x.Id == c.Id).DataFim);
    }

    [Fact]
    public async Task FotoPrivadaExigeSessaoIgrejaECsrf()
    {
        var pessoa = await CriarPessoa();
        var csrf = await api.Adulto.GetFromJsonAsync<JsonElement>("/bff/csrf");
        using var conteudo = new MultipartFormDataContent();
        var imagem = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5qkAAAAASUVORK5CYII=");
        var arquivo = new ByteArrayContent(imagem); arquivo.Headers.ContentType = new("image/png");
        conteudo.Add(arquivo, "foto", "foto.png"); conteudo.Add(new StringContent(pessoa.Versao.ToString()), "versao");
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/pessoas/{pessoa.Id}/foto") { Content = conteudo };
        request.Headers.Add("X-Igreja-Id", api.IgrejaA.ToString()); request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("token").GetString());
        Assert.Equal(HttpStatusCode.NoContent, (await api.Adulto.SendAsync(request)).StatusCode);
        var foto = await api.GetTenant($"/api/v1/pessoas/{pessoa.Id}/foto", api.IgrejaA);
        Assert.Equal(imagem, await foto.Content.ReadAsByteArrayAsync()); Assert.True(foto.Headers.CacheControl?.NoStore);
        Assert.True((await Pessoa(pessoa.Id)).PossuiFoto);
        Assert.Equal(HttpStatusCode.Unauthorized, (await api.Anonimo.GetAsync($"/api/v1/pessoas/{pessoa.Id}/foto")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await api.GetTenant($"/api/v1/pessoas/{pessoa.Id}/foto", api.IgrejaB)).StatusCode);
    }

    [Fact]
    public async Task CargoNaoConcedePermissaoENaoConselheiroNaoAdmite()
    {
        var pessoa = await Candidato(); var jornada = await Jornada(pessoa);
        Guid conselheiroId = default;
        await api.NaIgreja(api.IgrejaA, async db => { var c = await db.Set<Conselheiro>().SingleAsync(c => c.UsuarioId == api.UsuarioId); conselheiroId = c.Id; c.UsuarioId = null; await db.SaveChangesAsync(); });
        try { Assert.Equal(HttpStatusCode.Forbidden, (await Enviar($"/api/v1/pessoas/{pessoa}/jornada/requisitos", new ConcluirRequisitoRequest(jornada.Versao, 1, new DateOnly(2024, 1, 1)))).StatusCode); }
        finally { await api.NaIgreja(api.IgrejaA, async db => { (await db.Set<Conselheiro>().SingleAsync(c => c.Id == conselheiroId)).UsuarioId = api.UsuarioId; await db.SaveChangesAsync(); }); }
    }

    [Fact]
    public async Task VersaoDeManualPodeSerCorrigidaSemMigrarJornadaEAjustaPostoEmAndamento()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar("/api/v1/manuais/versoes", new ManualRequest(1, "", ["Tarefa"]))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar("/api/v1/manuais/versoes", new ManualRequest(4, "Não definido", ["Tarefa"]))).StatusCode);
        var manual = await Manual(1);
        var pessoa = await Candidato(); await ConcluirRequisitos(pessoa);
        var jornada = await Jornada(pessoa);
        await Ler<IdResponse>(await Enviar($"/api/v1/pessoas/{pessoa}/jornada/admissao", new AdmissaoRequest(jornada.Versao, manual.Id, new DateOnly(2024, 1, 1))));
        var alterado = await Ler<IdResponse>(await Enviar($"/api/v1/manuais/versoes/{manual.Id}", new EditarVersaoManualRequest(manual.Versao, "Edição corrigida", [new TarefaEdicaoRequest(manual.Tarefas[1].Id, "Texto corrigido"), new TarefaEdicaoRequest(null, "Nova tarefa")]), HttpMethod.Put));
        var atualizado = (await Ler<List<ManualResponse>>(await api.GetTenant("/api/v1/manuais", api.IgrejaA))).Single(v => v.Id == manual.Id);
        Assert.Equal("Edição corrigida", atualizado.Identificacao); Assert.True(atualizado.EmUso); Assert.Equal(1, atualizado.PostosEmAndamento);
        Assert.Equal(["Texto corrigido", "Nova tarefa"], atualizado.Tarefas.Select(t => t.Nome));
        var jornadaCorrigida = await Jornada(pessoa);
        Assert.Equal(manual.Id, jornadaCorrigida.Postos.Single().VersaoManualId);
        Assert.Equal(["Texto corrigido", "Nova tarefa"], jornadaCorrigida.Postos.Single().Tarefas.Select(t => t.Nome));
        Assert.Equal(HttpStatusCode.Conflict, (await Enviar($"/api/v1/manuais/versoes/{manual.Id}", new EditarVersaoManualRequest(manual.Versao, "Conflito", atualizado.Tarefas.Select(t => new TarefaEdicaoRequest(t.Id, t.Nome)).ToList()), HttpMethod.Put)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/manuais/versoes/{manual.Id}", new EditarVersaoManualRequest(alterado.Versao, "Duplicada", [new TarefaEdicaoRequest(null, "Igual"), new TarefaEdicaoRequest(null, " igual ")]), HttpMethod.Put)).StatusCode);
        var dados = await Ler<Dictionary<string, string[]>>(await api.GetTenant("/api/v1/manuais/tarefas-conhecidas", api.IgrejaA));
        Assert.Equal(3, dados.Count); Assert.All(dados.Values, tarefas => Assert.Equal(10, tarefas.Length));
    }
}
