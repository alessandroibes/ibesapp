using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ibes.Api.Features.Dominio;
using Ibes.AgendaAtividades;
using Ibes.Frequencia;
using Ibes.Foundation.Organizacoes;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.IntegrationTests;

public sealed class OperacaoTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    private async Task<HttpResponseMessage> Enviar(string rota, object dados, HttpMethod? metodo = null, Guid? igreja = null)
    {
        var csrf = await api.Adulto.GetFromJsonAsync<JsonElement>("/bff/csrf");
        using var r = new HttpRequestMessage(metodo ?? HttpMethod.Post, rota) { Content = JsonContent.Create(dados) };
        r.Headers.Add("X-Igreja-Id", (igreja ?? api.IgrejaA).ToString()); r.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("token").GetString()); return await api.Adulto.SendAsync(r);
    }
    private static async Task<T> Ler<T>(HttpResponseMessage r) { Assert.True(r.IsSuccessStatusCode, $"{r.StatusCode}: {await r.Content.ReadAsStringAsync()}"); return (await r.Content.ReadFromJsonAsync<T>())!; }
    private async Task<T> Get<T>(string rota) => await Ler<T>(await api.GetTenant(rota, api.IgrejaA));
    private async Task<(IdResponse Id, AtividadeRequest Dados)> Atividade(DateOnly? data = null, int? periodicidade = null)
    {
        var tipo = await Ler<IdResponse>(await Enviar("/api/v1/agenda/tipos", new NomeAgendaRequest("Reunião de teste")));
        var promotora = await Ler<IdResponse>(await Enviar("/api/v1/agenda/promotoras", new NomeAgendaRequest("Promotora de teste")));
        var dia = data ?? new DateOnly(2024, 1, 6);
        var dados = new AtividadeRequest("Reunião fictícia", tipo.Id, promotora.Id, dia, dia, null, null, true, 1, periodicidade, 1, [(int)dia.DayOfWeek], null, "Local", null, false, false, null, null, null, null, null, "America/Sao_Paulo");
        return (await Ler<IdResponse>(await Enviar("/api/v1/agenda/atividades", dados)), dados);
    }
    private async Task<IdResponse> Preparar(IdResponse a, DateOnly data, Guid? modelo = null) => await Ler<IdResponse>(await Enviar($"/api/v1/agenda/atividades/{a.Id}/ocorrencias/{data:yyyy-MM-dd}/reuniao", new PrepararReuniaoRequest(a.Versao, modelo)));
    [Fact]
    public async Task VisitanteSemCandidaturaEPrimeiraReuniaoIncluiCancelada()
    {
        var (a, dados) = await Atividade(); var r = await Preparar(a, dados.DataInicio);
        var pessoa = await Ler<IdResponse>(await Enviar($"/api/v1/reunioes/{r.Id}/visitantes", new VisitanteRequest("Visitante histórico")));
        var rota = $"/api/v1/reunioes/{r.Id}/frequencia/{pessoa.Id}";
        var f = await Ler<IdResponse>(await Enviar(rota, new FrequenciaRequest(null, 3, null), HttpMethod.Put));
        Assert.Null((await Get<PessoaResponse>($"/api/v1/pessoas/{pessoa.Id}")).PrimeiraReuniao);
        var atraso = await Ler<IdResponse>(await Enviar(rota, new FrequenciaRequest(f.Versao, 2, "Correção"), HttpMethod.Put));
        Assert.Equal(dados.DataInicio, (await Get<PessoaResponse>($"/api/v1/pessoas/{pessoa.Id}")).PrimeiraReuniao);
        var atual = await Get<AtividadeDetalheResponse>($"/api/v1/agenda/atividades/{a.Id}");
        await Ler<IdResponse>(await Enviar($"/api/v1/agenda/atividades/{a.Id}/ocorrencias/{dados.DataInicio:yyyy-MM-dd}", new ExcecaoRequest(atual.Versao, dados.DataInicio, dados.DataFim, null, null, 4, "Cancelamento registrado"), HttpMethod.Put));
        Assert.Equal(dados.DataInicio, (await Get<PessoaResponse>($"/api/v1/pessoas/{pessoa.Id}")).PrimeiraReuniao);
        Assert.Equal(HttpStatusCode.NotFound, (await api.GetTenant($"/api/v1/pessoas/{pessoa.Id}/jornada", api.IgrejaA)).StatusCode);
        var historico = await Get<List<AlteracaoFrequenciaResponse>>(rota + "/historico"); Assert.Equal(2, historico.Count); Assert.Equal(3, historico[1].SituacaoAnterior); Assert.Equal(2, historico[1].Situacao);
        Assert.Equal(HttpStatusCode.Conflict, (await Enviar(rota, new FrequenciaRequest(f.Versao, 1, null), HttpMethod.Put)).StatusCode);
        var falta = await Ler<IdResponse>(await Enviar(rota, new FrequenciaRequest(atraso.Versao, 4, "Justificada"), HttpMethod.Put));
        Assert.Null((await Get<PessoaResponse>($"/api/v1/pessoas/{pessoa.Id}")).PrimeiraReuniao);
        await Ler<IdResponse>(await Enviar(rota, new FrequenciaRequest(falta.Versao, 1, null), HttpMethod.Put));
        Assert.Equal(dados.DataInicio, (await Get<PessoaResponse>($"/api/v1/pessoas/{pessoa.Id}")).PrimeiraReuniao);
    }
    [Fact]
    public async Task ModeloCopiadoNaoMudaReuniaoHistorica()
    {
        var m = await Ler<IdResponse>(await Enviar("/api/v1/agenda/modelos", new ModeloRequest("Roteiro", [new("Oração", 5, null)], null)));
        var (a, d) = await Atividade(); var r = await Preparar(a, d.DataInicio, m.Id);
        await Ler<IdResponse>(await Enviar($"/api/v1/agenda/modelos/{m.Id}", new ModeloRequest("Roteiro atualizado", [new("Estudo", 20, "Outro")], m.Versao), HttpMethod.Put));
        var reuniao = await Get<ReuniaoResponse>($"/api/v1/reunioes/{r.Id}"); Assert.Equal("Oração", Assert.Single(reuniao.Roteiro).Titulo); Assert.Equal(m.Versao, reuniao.VersaoModelo);
    }
    [Fact]
    public async Task ExcecaoMovidaApareceNoNovoIntervaloSemDuplicarOuApagarSerie()
    {
        var (a, d) = await Atividade(new(2030, 1, 5), 2);
        var movida = new DateOnly(2029, 12, 20);
        await Ler<IdResponse>(await Enviar($"/api/v1/agenda/atividades/{a.Id}/ocorrencias/2030-01-05", new ExcecaoRequest(a.Versao, movida, movida, null, null, 5, "Remarcada"), HttpMethod.Put));
        var dezembro = await Get<List<OcorrenciaResponse>>("/api/v1/agenda?inicio=2029-12-01&fim=2029-12-31"); Assert.Single(dezembro, x => x.AtividadeId == a.Id);
        var janeiro = await Get<List<OcorrenciaResponse>>("/api/v1/agenda?inicio=2030-01-01&fim=2030-01-31"); Assert.DoesNotContain(janeiro, x => x.AtividadeId == a.Id && x.DataOriginal == d.DataInicio); Assert.Contains(janeiro, x => x.AtividadeId == a.Id);
    }
    [Fact]
    public async Task AlteracaoFuturaPreservaSerieAnterior()
    {
        var (a, d) = await Atividade(new(2030, 1, 1), 1);
        await Ler<IdResponse>(await Enviar($"/api/v1/agenda/atividades/{a.Id}/alteracoes-futuras", new AlteracaoSerieRequest(a.Versao, new(2030, 1, 10), d with { DataInicio = new(2030, 1, 10), DataFim = new(2030, 1, 10), Titulo = "Novo título" })));
        var lista = await Get<List<OcorrenciaResponse>>("/api/v1/agenda?inicio=2030-01-01&fim=2030-01-15");
        Assert.Equal(9, lista.Count(x => x.AtividadeId == a.Id)); Assert.Contains(lista, x => x.DataInicio == new DateOnly(2030, 1, 10) && x.Titulo == "Novo título");
    }
    [Fact]
    public async Task TenantProtegeAgendaChamadaVisitanteEVinculosMesmoComContaNasDuasIgrejas()
    {
        var (a, d) = await Atividade(); var r = await Preparar(a, d.DataInicio);
        await api.NaIgreja(api.IgrejaB, async db => { db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId, Permissoes = Permissoes.Todas }); await db.SaveChangesAsync(); });
        Assert.Equal(HttpStatusCode.NotFound, (await api.GetTenant($"/api/v1/reunioes/{r.Id}/chamada", api.IgrejaB)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Enviar($"/api/v1/reunioes/{r.Id}/visitantes", new VisitanteRequest("Invasão"), igreja: api.IgrejaB)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Enviar("/api/v1/agenda/atividades", d, igreja: api.IgrejaB)).StatusCode);
        await api.NaIgreja(api.IgrejaB, async db => { db.Add(new Reuniao { IgrejaId = api.IgrejaB, AtividadeAgendaId = a.Id, DataOriginal = d.DataInicio, Data = d.DataInicio }); await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync()); });
        await api.NaIgreja(null, async db => { Assert.Empty(await db.Set<AtividadeAgenda>().ToListAsync()); Assert.Empty(await db.Set<RegistroFrequencia>().ToListAsync()); });
    }
    [Fact]
    public async Task RecusaDadosInvalidosEFrequenciaFutura()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar("/api/v1/agenda/tipos", new NomeAgendaRequest(""))).StatusCode);
        var (a, d) = await Atividade(new(2035, 1, 1)); var r = await Preparar(a, d.DataInicio);
        var pessoa = await Ler<IdResponse>(await Enviar($"/api/v1/reunioes/{r.Id}/visitantes", new VisitanteRequest("Visitante")));
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/reunioes/{r.Id}/frequencia/{pessoa.Id}", new FrequenciaRequest(null, 1, null), HttpMethod.Put)).StatusCode);
        using var semCsrf = new HttpRequestMessage(HttpMethod.Post, "/api/v1/agenda/tipos") { Content = JsonContent.Create(new NomeAgendaRequest("Tipo")) }; semCsrf.Headers.Add("X-Igreja-Id", api.IgrejaA.ToString());
        Assert.Equal(HttpStatusCode.BadRequest, (await api.Adulto.SendAsync(semCsrf)).StatusCode);
    }
    [Fact]
    public async Task PermissoesIndependentesProtegemConsultaEEscrita()
    {
        await api.NaIgreja(api.IgrejaA, async db => { (await db.VinculosIgreja.SingleAsync()).Permissoes = [Permissoes.ConsultarFundacao]; await db.SaveChangesAsync(); });
        try
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await api.GetTenant("/api/v1/agenda?inicio=2024-01-01&fim=2024-01-31", api.IgrejaA)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await api.GetTenant("/api/v1/reunioes?inicio=2024-01-01&fim=2024-01-31", api.IgrejaA)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Enviar("/api/v1/agenda/tipos", new NomeAgendaRequest("Tipo"))).StatusCode);
        }
        finally { await api.NaIgreja(api.IgrejaA, async db => { (await db.VinculosIgreja.SingleAsync()).Permissoes = Permissoes.Todas; await db.SaveChangesAsync(); }); }
    }
}
