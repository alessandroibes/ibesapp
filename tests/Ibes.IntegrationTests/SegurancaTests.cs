using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Ibes.IntegrationTests;

public sealed class SegurancaTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task RespostasAplicamHeadersDeDefesaEApiNaoPermiteCache()
    {
        var response = await api.GetTenant("/api/v1/contexto", api.IgrejaA);

        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("no-referrer", response.Headers.GetValues("Referrer-Policy").Single());
        Assert.Equal("camera=(), geolocation=(), microphone=()", response.Headers.GetValues("Permissions-Policy").Single());
        Assert.Equal("same-origin", response.Headers.GetValues("Cross-Origin-Opener-Policy").Single());
        Assert.Equal("same-origin", response.Headers.GetValues("Cross-Origin-Resource-Policy").Single());
        Assert.Contains("frame-ancestors 'none'", response.Headers.GetValues("Content-Security-Policy").Single());
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task MutacaoWebExigeTokenCsrf()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/pessoas")
        {
            Content = JsonContent.Create(new { nome = "Tentativa sem CSRF" })
        };
        request.Headers.Add("X-Igreja-Id", api.IgrejaA.ToString());

        var response = await api.Adulto.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Requisição inválida. Atualize a página e tente novamente.", problem.GetProperty("title").GetString());
    }

    [Fact]
    public void EndpointsDeNegocioTemAutorizacaoEUploadsTemLimitesAdicionais()
    {
        var endpoints = api.Services.GetServices<EndpointDataSource>().SelectMany(x => x.Endpoints)
            .OfType<RouteEndpoint>().ToList();
        var apiEndpoints = endpoints.Where(x => x.RoutePattern.RawText?.StartsWith("/api/v1", StringComparison.Ordinal) == true).ToList();

        Assert.NotEmpty(apiEndpoints);
        Assert.All(apiEndpoints, endpoint =>
            Assert.Contains(endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>(), authorization => !string.IsNullOrWhiteSpace(authorization.Policy)));

        var uploads = apiEndpoints.Where(x => x.RoutePattern.RawText is "/api/v1/pessoas/{id:guid}/foto"
            or "/api/v1/acervo-historico/marcos/{marcoId:guid}/anexos"
            or "/api/v1/acervo-historico/marcos/{marcoId:guid}/anexos/{id:guid}")
            .Where(x => x.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods.Any(m => m is "POST" or "PUT") == true).ToList();

        Assert.Equal(3, uploads.Count);
        Assert.All(uploads, endpoint =>
        {
            Assert.Equal("upload", endpoint.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName);
            Assert.True(endpoint.Metadata.GetMetadata<IRequestSizeLimitMetadata>()?.MaxRequestBodySize is > 0);
        });
    }
}
