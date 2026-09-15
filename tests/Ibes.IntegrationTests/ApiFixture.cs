using System.Net;
using System.Text.RegularExpressions;
using Ibes.Foundation.Identidade;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Embaixadas;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Ibes.IntegrationTests;

public sealed class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer postgres = new PostgreSqlBuilder("postgres:17-alpine").Build();
    public Guid IgrejaA { get; } = Guid.NewGuid();
    public Guid IgrejaB { get; } = Guid.NewGuid();
    public Guid UsuarioId { get; } = Guid.NewGuid();
    public HttpClient Adulto { get; private set; } = null!;
    public HttpClient Anonimo { get; private set; } = null!;
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, c) => c.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Postgres"] = postgres.GetConnectionString(),
            ["Auth:Issuer"] = "https://localhost/"
        }));
    }

    public async Task InitializeAsync()
    {
        await postgres.StartAsync();
        Anonimo = CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
        using (var scope = Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();
            var result = await users.CreateAsync(new Usuario { Id = UsuarioId, UserName = "adulto@example.test", Email = "adulto@example.test" }, "Teste-Seguro-123!");
            Assert.True(result.Succeeded);
            await Ibes.Api.Infrastructure.Bootstrap.RegistrarClienteAsync(scope.ServiceProvider, scope.ServiceProvider.GetRequiredService<IConfiguration>());
        }
        await NaIgreja(IgrejaA, async db =>
        {
            db.Igrejas.Add(new Igreja { IgrejaId = IgrejaA, Nome = "Igreja A" });
            db.Embaixadas.Add(new Embaixada { IgrejaId = IgrejaA, Nome = "Embaixada A" });
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = IgrejaA, UsuarioId = UsuarioId, Permissoes = Permissoes.Todas });
            var pessoa = new Pessoa { IgrejaId = IgrejaA, Nome = "Conselheiro de teste", DataNascimento = new DateOnly(1980, 1, 1) };
            db.Add(pessoa);
            db.Add(new Conselheiro { IgrejaId = IgrejaA, PessoaId = pessoa.Id, UsuarioId = UsuarioId, DataInicio = new DateOnly(2020, 1, 1), Funcao = "Conselheiro" });
            await db.SaveChangesAsync();
        });
        await NaIgreja(IgrejaB, async db =>
        {
            db.Igrejas.Add(new Igreja { IgrejaId = IgrejaB, Nome = "Igreja B" });
            db.Embaixadas.Add(new Embaixada { IgrejaId = IgrejaB, Nome = "Embaixada B" });
            await db.SaveChangesAsync();
        });
        Adulto = CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
        var page = await Adulto.GetStringAsync("/conta/entrar");
        var token = WebUtility.HtmlDecode(Regex.Match(page, "name=\"__RequestVerificationToken\"[^>]*value=\"([^\"]+)\"").Groups[1].Value);
        Assert.NotEmpty(token);
        var login = await Adulto.PostAsync("/conta/entrar", new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["Email"] = "adulto@example.test",
            ["Senha"] = "Teste-Seguro-123!",
            ["__RequestVerificationToken"] = token
        }));
        Assert.Equal(HttpStatusCode.Redirect, login.StatusCode);
        Assert.Contains(login.Headers.GetValues("Set-Cookie"), c => c.Contains("__Host-ibes.sessao") && c.Contains("secure") && c.Contains("httponly"));
    }

    public async Task NaIgreja(Guid? igrejaId, Func<AppDbContext, Task> action)
    {
        using var scope = Services.CreateScope();
        if (igrejaId.HasValue) scope.ServiceProvider.GetRequiredService<TenantContext>().Definir(igrejaId.Value, UsuarioId, "integration-test");
        await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public async Task<HttpResponseMessage> GetTenant(string route, Guid igrejaId)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, route);
        request.Headers.Add("X-Igreja-Id", igrejaId.ToString());
        return await Adulto.SendAsync(request);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        Adulto?.Dispose(); Anonimo?.Dispose();
        await base.DisposeAsync(); await postgres.DisposeAsync();
    }
}
