using System.Security.Claims;
using Ibes.Foundation.Identidade;
using Ibes.Foundation.Persistence;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Ibes.Api.Features;

public static class Identidade
{
    public static void MapIdentidade(this WebApplication app)
    {
        app.MapGet("/bff/sessao", async (HttpContext http, AppDbContext db, CancellationToken ct) =>
        {
            var id = Guid.Parse(http.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? http.User.FindFirstValue(Claims.Subject)!);
            // Explicit cross-tenant query: only memberships belonging to the authenticated adult.
            var igrejas = await (from v in db.VinculosIgreja.IgnoreQueryFilters()
                                 join i in db.Igrejas.IgnoreQueryFilters() on v.IgrejaId equals i.IgrejaId
                                 where v.UsuarioId == id
                                 orderby i.Nome
                                 select new IgrejaResponse(i.IgrejaId, i.Nome)).ToListAsync(ct);
            return TypedResults.Ok(new SessaoResponse(igrejas));
        }).RequireAuthorization().WithName("ConsultarSessao");
        app.MapGet("/bff/csrf", (HttpContext http, IAntiforgery csrf) =>
            TypedResults.Ok(new CsrfResponse(csrf.GetAndStoreTokens(http).RequestToken!))).AllowAnonymous();
        app.MapPost("/bff/sair", async (HttpContext http, IAntiforgery csrf, SignInManager<Usuario> signIn) =>
        {
            try { await csrf.ValidateRequestAsync(http); }
            catch (AntiforgeryValidationException) { return Results.Problem(statusCode: 400, title: "Requisição inválida."); }
            await signIn.SignOutAsync();
            return Results.NoContent();
        }).RequireAuthorization();
        app.MapGet("/connect/authorize", async (HttpContext http, UserManager<Usuario> users) =>
        {
            var request = http.GetOpenIddictServerRequest()!;
            var authentication = await http.AuthenticateAsync(IdentityConstants.ApplicationScheme);
            if (!authentication.Succeeded)
                return Results.Challenge(new AuthenticationProperties { RedirectUri = http.Request.Path + http.Request.QueryString }, [IdentityConstants.ApplicationScheme]);
            var user = await users.GetUserAsync(authentication.Principal!);
            if (user is null || await users.IsLockedOutAsync(user)) return Results.Forbid();
            var identity = new ClaimsIdentity(TokenValidationParameters.DefaultAuthenticationType, Claims.Name, Claims.Role);
            identity.SetClaim(Claims.Subject, user.Id.ToString());
            identity.SetClaim("security_stamp", user.SecurityStamp);
            var principal = new ClaimsPrincipal(identity);
            principal.SetScopes(request.GetScopes().Intersect(new[] { Scopes.OpenId, "fundacao" }));
            principal.SetResources("ibes-api");
            principal.SetDestinations(c => c.Type == "security_stamp" ? [Destinations.AccessToken] : [Destinations.AccessToken, Destinations.IdentityToken]);
            return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }).AllowAnonymous().RequireRateLimiting("autenticacao").ExcludeFromDescription();
        app.MapPost("/connect/token", async (HttpContext http, UserManager<Usuario> users) =>
        {
            var result = await http.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            if (result.Principal is null) return Results.Forbid(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
            var user = await users.FindByIdAsync(result.Principal.GetClaim(Claims.Subject)!);
            if (user is null || await users.IsLockedOutAsync(user) || user.SecurityStamp != result.Principal.GetClaim("security_stamp"))
                return Results.Forbid(authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
            return Results.SignIn(result.Principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }).AllowAnonymous().RequireRateLimiting("autenticacao").ExcludeFromDescription();
    }
}

public sealed record IgrejaResponse(Guid IgrejaId, string Nome);
public sealed record SessaoResponse(List<IgrejaResponse> Igrejas);
public sealed record CsrfResponse(string Token);
