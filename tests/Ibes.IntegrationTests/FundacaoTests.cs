using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ibes.Foundation.Organizacoes;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace Ibes.IntegrationTests;

public sealed class FundacaoTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task AnonimoNaoAcessaDados() => Assert.Equal(HttpStatusCode.Unauthorized, (await api.Anonimo.GetAsync("/api/v1/contexto")).StatusCode);

    [Fact]
    public async Task IgrejaObrigatoria() => Assert.Equal(HttpStatusCode.BadRequest, (await api.Adulto.GetAsync("/api/v1/contexto")).StatusCode);

    [Fact]
    public async Task CabecalhoNaoConcedeVinculo()
    {
        Assert.Equal(HttpStatusCode.Forbidden, (await api.GetTenant("/api/v1/contexto", api.IgrejaB)).StatusCode);
        var response = await api.GetTenant("/api/v1/contexto", api.IgrejaA);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("Embaixada A", await response.Content.ReadAsStringAsync());
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task SessaoListaSomenteVinculosDoUsuario()
    {
        var data = await api.Adulto.GetFromJsonAsync<JsonElement>("/bff/sessao");
        Assert.Single(data.GetProperty("igrejas").EnumerateArray());
        Assert.Equal(api.IgrejaA.ToString(), data.GetProperty("igrejas")[0].GetProperty("igrejaId").GetString());
    }

    [Fact]
    public async Task PersistenciaFiltraLeiturasEBloqueiaEscritaCruzada()
    {
        await api.NaIgreja(null, async db => Assert.Empty(await db.Embaixadas.ToListAsync()));
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            Assert.Equal("Embaixada A", (await db.Embaixadas.SingleAsync()).Nome);
            db.Embaixadas.Add(new Embaixada { IgrejaId = api.IgrejaB, Nome = "Não autorizado" });
            await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
        });
    }

    [Fact]
    public async Task AuditoriaIsoladaImutavelESemValoresPessoais()
    {
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            var registros = await db.Auditoria.ToListAsync();
            Assert.NotEmpty(registros);
            Assert.All(registros, a => Assert.Equal(api.IgrejaA, a.IgrejaId));
            db.Auditoria.Remove(registros[0]);
            await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
        });
        Assert.Equal(HttpStatusCode.Forbidden, (await api.GetTenant("/api/v1/auditoria", api.IgrejaB)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await api.GetTenant("/api/v1/auditoria?pagina=0", api.IgrejaA)).StatusCode);
    }

    [Fact]
    public async Task SemPermissaoNaoConsultaMesmoComVinculo()
    {
        await api.NaIgreja(api.IgrejaB, async db =>
        {
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId });
            await db.SaveChangesAsync();
        });
        try { Assert.Equal(HttpStatusCode.Forbidden, (await api.GetTenant("/api/v1/contexto", api.IgrejaB)).StatusCode); }
        finally { await api.NaIgreja(api.IgrejaB, async db => { db.VinculosIgreja.Remove(await db.VinculosIgreja.SingleAsync()); await db.SaveChangesAsync(); }); }
    }

    [Fact]
    public async Task LogoutExigeCsrf() => Assert.Equal(HttpStatusCode.BadRequest, (await api.Adulto.PostAsync("/bff/sair", null)).StatusCode);

    [Fact]
    public async Task SaudeContratoEMigracaoValidos()
    {
        Assert.Equal(HttpStatusCode.OK, (await api.Anonimo.GetAsync("/health/ready")).StatusCode);
        var schema = await api.Anonimo.GetFromJsonAsync<JsonElement>("/openapi/v1.json");
        Assert.True(schema.GetProperty("paths").TryGetProperty("/api/v1/contexto", out _));
        await api.NaIgreja(null, async db =>
        {
            Assert.Empty(await db.Database.GetPendingMigrationsAsync());
            Assert.False(db.Database.HasPendingModelChanges());
        });
    }

    [Fact]
    public async Task MobileTrocaCodigoComPkceERejeitaReutilizacao()
    {
        var verifier = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var challenge = WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)));
        var uri = QueryHelpers.AddQueryString("/connect/authorize", new Dictionary<string, string?>
        {
            ["client_id"] = "ibes-mobile",
            ["response_type"] = "code",
            ["redirect_uri"] = "ibes://oauth/callback",
            ["scope"] = "openid fundacao",
            ["code_challenge"] = challenge,
            ["code_challenge_method"] = "S256",
            ["state"] = "test-state"
        });
        var authorize = await api.Adulto.GetAsync(uri);
        Assert.Equal(HttpStatusCode.Redirect, authorize.StatusCode);
        var query = QueryHelpers.ParseQuery(authorize.Headers.Location!.Query);
        Assert.Equal("test-state", query["state"].ToString());
        Assert.True(query.ContainsKey("code"));
        var fields = new Dictionary<string, string>
        {
            ["client_id"] = "ibes-mobile",
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = "ibes://oauth/callback",
            ["code"] = query["code"].ToString(),
            ["code_verifier"] = verifier
        };
        var response = await api.Anonimo.PostAsync("/connect/token", new FormUrlEncodedContent(fields));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("access_token").GetString();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/contexto");
        request.Headers.Authorization = new("Bearer", token);
        request.Headers.Add("X-Igreja-Id", api.IgrejaA.ToString());
        Assert.Equal(HttpStatusCode.OK, (await api.Anonimo.SendAsync(request)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await api.Anonimo.PostAsync("/connect/token", new FormUrlEncodedContent(fields))).StatusCode);
    }

    [Fact]
    public async Task MobileExigePkce()
    {
        var response = await api.Adulto.GetAsync("/connect/authorize?client_id=ibes-mobile&response_type=code&redirect_uri=ibes%3A%2F%2Foauth%2Fcallback&scope=openid");
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain("code=", response.Headers.Location?.ToString() ?? "");
    }
}
