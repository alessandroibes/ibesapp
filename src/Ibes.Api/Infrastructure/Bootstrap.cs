using Ibes.Foundation.Identidade;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Embaixadas;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;
using OrganizacoesPermissoes = Ibes.Foundation.Organizacoes.Permissoes;
using Permissions = OpenIddict.Abstractions.OpenIddictConstants.Permissions;

namespace Ibes.Api.Infrastructure;

public static class Bootstrap
{
    public static readonly Guid IgrejaDevelopment = Guid.Parse("11111111-1111-4111-8111-111111111111");

    public static async Task RegistrarClienteAsync(IServiceProvider services, IConfiguration configuration)
    {
        var manager = services.GetRequiredService<IOpenIddictApplicationManager>();
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = "ibes-mobile",
            ClientType = ClientTypes.Public,
            ConsentType = ConsentTypes.Implicit,
            DisplayName = "IBES Mobile",
            RedirectUris = { new Uri(configuration["Auth:MobileRedirectUri"] ?? "ibes://oauth/callback") },
            Permissions =
            {
                Permissions.Endpoints.Authorization, Permissions.Endpoints.Token,
                Permissions.GrantTypes.AuthorizationCode, Permissions.ResponseTypes.Code,
                Permissions.Prefixes.Scope + "fundacao"
            },
            Requirements = { Requirements.Features.ProofKeyForCodeExchange }
        };
        var existing = await manager.FindByClientIdAsync("ibes-mobile");
        if (existing is null) await manager.CreateAsync(descriptor);
        else await manager.UpdateAsync(existing, descriptor);
    }

    public static async Task SeedDevelopmentAsync(IServiceProvider services, IConfiguration config)
    {
        if (!config.GetValue<bool>("Bootstrap:Enabled")) return;
        var password = config["Bootstrap:Password"] ?? throw new InvalidOperationException("Configure Bootstrap__Password para dados fictícios.");
        var db = services.GetRequiredService<AppDbContext>();
        var tenant = services.GetRequiredService<TenantContext>();
        tenant.Definir(IgrejaDevelopment, null, "bootstrap-development");
        if (await db.Igrejas.AnyAsync()) { await CompletarDominioDevelopmentAsync(services); return; }
        await using var transaction = await db.Database.BeginTransactionAsync();
        var users = services.GetRequiredService<UserManager<Usuario>>();
        var email = "adulto@example.test";
        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            user = new Usuario { Id = Guid.NewGuid(), UserName = email, Email = email, EmailConfirmed = true };
            var result = await users.CreateAsync(user, password);
            if (!result.Succeeded) throw new InvalidOperationException("Senha de bootstrap não atende à política de segurança.");
        }
        db.Igrejas.Add(new Igreja { IgrejaId = IgrejaDevelopment, Nome = "Igreja de demonstração" });
        db.Embaixadas.Add(new Embaixada { IgrejaId = IgrejaDevelopment, Nome = "Embaixada de demonstração" });
        db.VinculosIgreja.Add(new VinculoIgreja
        {
            IgrejaId = IgrejaDevelopment,
            UsuarioId = user.Id,
            Permissoes = OrganizacoesPermissoes.Todas
        });
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        await CompletarDominioDevelopmentAsync(services);
    }

    private static async Task CompletarDominioDevelopmentAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var usuario = await db.Users.SingleOrDefaultAsync(u => u.Email == "adulto@example.test");
        if (usuario is null) return;
        var vinculo = await db.VinculosIgreja.SingleOrDefaultAsync(v => v.UsuarioId == usuario.Id);
        if (vinculo is null) return;
        if (!vinculo.Permissoes.Order().SequenceEqual(OrganizacoesPermissoes.Todas.Order())) vinculo.Permissoes = OrganizacoesPermissoes.Todas;
        if (!await db.Set<Conselheiro>().AnyAsync(c => c.UsuarioId == usuario.Id))
        {
            var pessoa = new Pessoa { IgrejaId = IgrejaDevelopment, Nome = "Conselheiro de demonstração", DataNascimento = new DateOnly(1980, 1, 1) };
            db.Add(pessoa);
            db.Add(new Conselheiro { IgrejaId = IgrejaDevelopment, PessoaId = pessoa.Id, UsuarioId = usuario.Id, DataInicio = new DateOnly(2020, 1, 1) });
        }
        await db.SaveChangesAsync();
    }
}
