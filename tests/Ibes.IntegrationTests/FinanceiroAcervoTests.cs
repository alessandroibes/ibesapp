using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Ibes.AcervoHistorico;
using Ibes.Api.Features.Dominio;
using Ibes.Financeiro;
using Ibes.Foundation.Auditoria;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.IntegrationTests;

public sealed class FinanceiroAcervoTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    private async Task<HttpResponseMessage> Enviar(string rota, object? dados = null, HttpMethod? metodo = null, Guid? igreja = null, HttpContent? conteudo = null)
    {
        var csrf = await api.Adulto.GetFromJsonAsync<JsonElement>("/bff/csrf");
        using var request = new HttpRequestMessage(metodo ?? HttpMethod.Post, rota) { Content = conteudo ?? (dados is null ? null : JsonContent.Create(dados)) };
        request.Headers.Add("X-Igreja-Id", (igreja ?? api.IgrejaA).ToString()); request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("token").GetString());
        return await api.Adulto.SendAsync(request);
    }
    private static async Task<T> Ler<T>(HttpResponseMessage response)
    {
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    [Fact]
    public async Task EntradasESaidasPodemSerAgrupadasPorIniciativaEditadasEExcluidas()
    {
        var iniciativa = await Ler<IdResponse>(await Enviar("/api/v1/financeiro/iniciativas", new IniciativaFinanceiraRequest($"Camisas {Guid.NewGuid():N}", "Confecção anual")));
        var entrada = await Ler<IdResponse>(await Enviar("/api/v1/financeiro/lancamentos", new LancamentoFinanceiroRequest(TipoLancamentoFinanceiro.Entrada,
            new DateOnly(2026, 9, 1), 100, "Pagamento de camisa", null, null, null, iniciativa.Id)));
        _ = await Ler<IdResponse>(await Enviar("/api/v1/financeiro/lancamentos", new LancamentoFinanceiroRequest(TipoLancamentoFinanceiro.Saida,
            new DateOnly(2026, 9, 2), 60, "Pagamento da confecção", "Primeira parcela", null, null, iniciativa.Id)));

        var resumo = await Ler<ResumoFinanceiroResponse>(await api.GetTenant($"/api/v1/financeiro/resumo?iniciativaId={iniciativa.Id}", api.IgrejaA));
        Assert.Equal(100, resumo.Entradas); Assert.Equal(60, resumo.Saidas); Assert.Equal(40, resumo.Saldo);
        var alterado = await Ler<IdResponse>(await Enviar($"/api/v1/financeiro/lancamentos/{entrada.Id}", new AlterarLancamentoFinanceiroRequest(entrada.Versao,
            TipoLancamentoFinanceiro.Entrada, new DateOnly(2026, 9, 1), 110, "Pagamento integral", null, null, null, iniciativa.Id), HttpMethod.Put));
        Assert.Equal(HttpStatusCode.NoContent, (await Enviar($"/api/v1/financeiro/lancamentos/{entrada.Id}?versao={alterado.Versao}", metodo: HttpMethod.Delete)).StatusCode);
        Assert.Single(await Ler<List<LancamentoFinanceiroResponse>>(await api.GetTenant($"/api/v1/financeiro/lancamentos?iniciativaId={iniciativa.Id}", api.IgrejaA)));
    }

    [Fact]
    public async Task MarcoApareceEmLinhaDoTempoEAnexoPrivadoPodeSerRemovido()
    {
        var pessoaId = Guid.NewGuid();
        await api.NaIgreja(api.IgrejaA, async db => { db.Add(new Pessoa { Id = pessoaId, IgrejaId = api.IgrejaA, Nome = "Pessoa da memória" }); await db.SaveChangesAsync(); });
        var marco = await Ler<IdResponse>(await Enviar("/api/v1/acervo-historico/marcos", new MarcoHistoricoRequest(new DateOnly(1998, 5, 1),
            new DateOnly(1998, 5, 3), "Primeiro acampamento", "Registro preservado para futuras gerações.", "Acampamento", null, [pessoaId])));
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(marco.Versao.ToString()), "versao"); form.Add(new StringContent("Documento do evento"), "descricao");
        form.Add(new ByteArrayContent(Encoding.ASCII.GetBytes("%PDF-1.7\nconteudo")) { Headers = { ContentType = new("application/pdf") } }, "arquivo", "acampamento.pdf");
        var anexo = await Ler<IdResponse>(await Enviar($"/api/v1/acervo-historico/marcos/{marco.Id}/anexos", conteudo: form));

        var linha = await Ler<List<MarcoHistoricoResponse>>(await api.GetTenant("/api/v1/acervo-historico/marcos?ano=1998&ordemCrescente=true", api.IgrejaA));
        var item = Assert.Single(linha, x => x.Id == marco.Id); Assert.Equal("Pessoa da memória", Assert.Single(item.Pessoas).Nome); Assert.Single(item.Anexos);
        var download = await api.GetTenant($"/api/v1/acervo-historico/marcos/{marco.Id}/anexos/{anexo.Id}", api.IgrejaA);
        Assert.Equal("application/pdf", download.Content.Headers.ContentType?.MediaType); Assert.Contains("no-store", download.Headers.CacheControl?.ToString());
        Assert.Equal(HttpStatusCode.NoContent, (await Enviar($"/api/v1/acervo-historico/marcos/{marco.Id}/anexos/{anexo.Id}?versao={anexo.Versao}", metodo: HttpMethod.Delete)).StatusCode);
    }

    [Fact]
    public async Task UploadRejeitaTipoDeclaradoQuandoConteudoNaoEPermitido()
    {
        var marco = await Ler<IdResponse>(await Enviar("/api/v1/acervo-historico/marcos", new MarcoHistoricoRequest(new DateOnly(2026, 9, 6), null,
            "Documento inválido", "Validação do conteúdo real do arquivo.", "Outro", null, [])));
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(marco.Versao.ToString()), "versao");
        form.Add(new ByteArrayContent(Encoding.UTF8.GetBytes("<script>alert('arquivo falso')</script>"))
        { Headers = { ContentType = new("application/pdf") } }, "arquivo", "registro.pdf");

        var response = await Enviar($"/api/v1/acervo-historico/marcos/{marco.Id}/anexos", conteudo: form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var detalhe = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Envie uma foto PNG/JPEG ou um documento PDF.", detalhe.GetProperty("title").GetString());
    }

    [Fact]
    public async Task FinanceiroEAcervoNaoGeramAuditoriaFuncional()
    {
        int antes = 0;
        await api.NaIgreja(api.IgrejaA, async db => antes = await db.Set<RegistroAuditoria>().CountAsync());
        _ = await Ler<IdResponse>(await Enviar("/api/v1/financeiro/lancamentos", new LancamentoFinanceiroRequest(TipoLancamentoFinanceiro.Entrada,
            new DateOnly(2026, 9, 5), 15, "Oferta", null, null, null, null)));
        _ = await Ler<IdResponse>(await Enviar("/api/v1/acervo-historico/marcos", new MarcoHistoricoRequest(new DateOnly(2026, 9, 5), null,
            "Encontro especial", "Memória do encontro.", "Outro", null, [])));
        await api.NaIgreja(api.IgrejaA, async db => Assert.Equal(antes, await db.Set<RegistroAuditoria>().CountAsync()));
    }

    [Fact]
    public async Task ConsultasEChavesEstrangeirasFicamIsoladasPorIgreja()
    {
        var iniciativaB = Guid.NewGuid();
        await api.NaIgreja(api.IgrejaB, async db =>
        {
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId, Permissoes = [Permissoes.ConsultarFinanceiro, Permissoes.ConsultarAcervo] });
            db.Add(new IniciativaFinanceira { Id = iniciativaB, IgrejaId = api.IgrejaB, Nome = "Somente Igreja B" }); await db.SaveChangesAsync();
        });
        try
        {
            var listaB = await Ler<List<IniciativaFinanceiraResponse>>(await api.GetTenant("/api/v1/financeiro/iniciativas", api.IgrejaB));
            Assert.Single(listaB); Assert.Equal(iniciativaB, listaB[0].Id);
            await api.NaIgreja(api.IgrejaA, async db =>
            {
                db.Add(new LancamentoFinanceiro { IgrejaId = api.IgrejaA, Tipo = TipoLancamentoFinanceiro.Entrada, Data = new DateOnly(2026, 9, 1), Valor = 1, Motivo = "Referência cruzada", IniciativaFinanceiraId = iniciativaB });
                await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            });
            await api.NaIgreja(null, async db => { Assert.Empty(await db.Set<LancamentoFinanceiro>().ToListAsync()); Assert.Empty(await db.Set<MarcoHistorico>().ToListAsync()); });
        }
        finally { await api.NaIgreja(api.IgrejaB, async db => { db.VinculosIgreja.Remove(await db.VinculosIgreja.SingleAsync()); await db.SaveChangesAsync(); }); }
    }

    [Fact]
    public async Task EscritasExigemPermissoesDeGerenciamentoIndependentes()
    {
        await api.NaIgreja(api.IgrejaA, async db => { (await db.VinculosIgreja.SingleAsync()).Permissoes = [Permissoes.ConsultarFinanceiro, Permissoes.ConsultarAcervo]; await db.SaveChangesAsync(); });
        try
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await Enviar("/api/v1/financeiro/lancamentos", new LancamentoFinanceiroRequest(TipoLancamentoFinanceiro.Entrada,
                new DateOnly(2026, 9, 5), 10, "Oferta", null, null, null, null))).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await Enviar("/api/v1/acervo-historico/marcos", new MarcoHistoricoRequest(new DateOnly(2026, 9, 5), null,
                "Marco", "Descrição", "Outro", null, []))).StatusCode);
        }
        finally { await api.NaIgreja(api.IgrejaA, async db => { (await db.VinculosIgreja.SingleAsync()).Permissoes = Permissoes.Todas; await db.SaveChangesAsync(); }); }
    }
}
