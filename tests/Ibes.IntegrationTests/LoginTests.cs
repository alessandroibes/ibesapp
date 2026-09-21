using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Ibes.IntegrationTests;

public sealed class LoginTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    private const string MensagemNeutra = "Não foi possível entrar. Confira os dados ou tente novamente mais tarde.";

    [Fact]
    public async Task PaginaRenderizaComTokensAntiforgeryHeadersECamposAcessiveis()
    {
        using var cliente = NovoCliente();
        var response = await cliente.GetAsync("/conta/entrar");
        var html = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
        var csp = response.Headers.GetValues("Content-Security-Policy").Single();
        Assert.DoesNotContain("unsafe-inline", csp, StringComparison.Ordinal);
        Assert.Contains("style-src 'self'", csp, StringComparison.Ordinal);
        Assert.Contains("name=\"__RequestVerificationToken\"", html, StringComparison.Ordinal);
        Assert.Contains("href=\"/design-tokens.css\"", html, StringComparison.Ordinal);
        Assert.Contains("autocomplete=\"username\"", html, StringComparison.Ordinal);
        Assert.Contains("autocomplete=\"current-password\"", html, StringComparison.Ordinal);
        Assert.Contains("Pular para o conteúdo", html, StringComparison.Ordinal);
        Assert.DoesNotContain("<script", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("style=", html, StringComparison.OrdinalIgnoreCase);

        var tokens = await cliente.GetStringAsync("/design-tokens.css");
        Assert.Contains("--primary: #3448e5", tokens, StringComparison.Ordinal);
    }

    [Fact]
    public async Task LoginExigeAntiforgeryERetornaMensagemNeutra()
    {
        using var semToken = NovoCliente();
        var rejeitado = await semToken.PostAsync("/conta/entrar", Formulario("desconhecido@example.test", "Senha-Incorreta-123!"));
        Assert.Equal(HttpStatusCode.BadRequest, rejeitado.StatusCode);

        using var contaDesconhecida = NovoCliente();
        var desconhecida = await Entrar(contaDesconhecida, "desconhecido@example.test", "Senha-Incorreta-123!");
        using var senhaIncorreta = NovoCliente();
        var incorreta = await Entrar(senhaIncorreta, "adulto@example.test", "Senha-Incorreta-123!");

        Assert.Equal(HttpStatusCode.OK, desconhecida.StatusCode);
        Assert.Equal(HttpStatusCode.OK, incorreta.StatusCode);
        Assert.Contains(MensagemNeutra, Texto(await desconhecida.Content.ReadAsStringAsync()), StringComparison.Ordinal);
        Assert.Contains(MensagemNeutra, Texto(await incorreta.Content.ReadAsStringAsync()), StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("/agenda", "/agenda")]
    [InlineData("https://exemplo.test/fora", "/")]
    [InlineData("//exemplo.test/fora", "/")]
    public async Task LoginAceitaSomenteRetornoLocal(string returnUrl, string destinoEsperado)
    {
        using var cliente = NovoCliente();
        var response = await Entrar(cliente, "adulto@example.test", "Teste-Seguro-123!", returnUrl);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal(destinoEsperado, response.Headers.Location?.OriginalString);
    }

    [Fact]
    public void PaginaDeLoginMantemRateLimitDeAutenticacao()
    {
        var endpoint = api.Services.GetServices<EndpointDataSource>()
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .Single(endpoint => string.Equals(
                endpoint.RoutePattern.RawText?.TrimStart('/'),
                "conta/entrar",
                StringComparison.OrdinalIgnoreCase));

        Assert.Equal("autenticacao", endpoint.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName);
    }

    private HttpClient NovoCliente() => api.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        AllowAutoRedirect = false
    });

    private static FormUrlEncodedContent Formulario(string email, string senha, string? token = null, string? returnUrl = null)
    {
        var campos = new Dictionary<string, string>
        {
            ["Email"] = email,
            ["Senha"] = senha
        };
        if (token is not null) campos["__RequestVerificationToken"] = token;
        if (returnUrl is not null) campos["ReturnUrl"] = returnUrl;
        return new FormUrlEncodedContent(campos);
    }

    private static async Task<HttpResponseMessage> Entrar(HttpClient cliente, string email, string senha, string? returnUrl = null)
    {
        var pagina = await cliente.GetStringAsync(returnUrl is null
            ? "/conta/entrar"
            : $"/conta/entrar?ReturnUrl={Uri.EscapeDataString(returnUrl)}");
        var token = WebUtility.HtmlDecode(Regex.Match(
            pagina,
            "name=\"__RequestVerificationToken\"[^>]*value=\"([^\"]+)\"").Groups[1].Value);
        Assert.NotEmpty(token);
        return await cliente.PostAsync("/conta/entrar", Formulario(email, senha, token, returnUrl));
    }

    private static string Texto(string html)
    {
        var semTags = Regex.Replace(html, "<[^>]+>", " ");
        return Regex.Replace(WebUtility.HtmlDecode(semTags), "\\s+", " ").Trim();
    }
}
