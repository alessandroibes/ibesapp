using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace Ibes.Api.Features;

public static class Fundacao
{
    public static void MapFundacao(this WebApplication app)
    {
        app.MapGet("/api/v1/contexto", async ([FromHeader(Name = "X-Igreja-Id")] Guid igrejaId, AppDbContext db, TenantContext tenant, HttpContext http, CancellationToken ct) =>
        {
            var igreja = await db.Igrejas.AsNoTracking().SingleAsync(ct);
            var embaixada = await db.Embaixadas.AsNoTracking().SingleAsync(ct);
            return TypedResults.Ok(new ContextoResponse(tenant.IgrejaId, igreja.Nome, embaixada.Nome, (string[])http.Items["permissoes"]!));
        }).RequireAuthorization(Permissoes.ConsultarFundacao).WithName("ConsultarContexto")
            .WithDescription("Sessão BFF ou bearer OAuth com vínculo e permissão fundacao.consultar na Igreja selecionada.")
            .ProducesProblem(400).ProducesProblem(401).ProducesProblem(403);
        app.MapGet("/api/v1/auditoria", async ([FromHeader(Name = "X-Igreja-Id")] Guid igrejaId, int? pagina, AppDbContext db, CancellationToken ct) =>
        {
            if (pagina is < 1 or > 10000) return Results.Problem(statusCode: 400, title: "Página inválida.");
            var registros = await db.Auditoria.AsNoTracking().OrderByDescending(a => a.CreatedAt).ThenBy(a => a.Id)
                .Skip(((pagina ?? 1) - 1) * 20).Take(20)
                .Select(a => new AuditoriaResponse(a.Id, a.CreatedAt, a.Acao, a.Entidade, a.TraceId)).ToListAsync(ct);
            return Results.Ok(registros);
        }).RequireAuthorization(Permissoes.ConsultarAuditoria).WithName("ConsultarAuditoria")
            .Produces<List<AuditoriaResponse>>().ProducesProblem(400).ProducesProblem(401).ProducesProblem(403);
    }
}

public sealed record ContextoResponse(Guid IgrejaId, string Igreja, string Embaixada, string[] Permissoes);
public sealed record AuditoriaResponse(Guid Id, DateTimeOffset CreatedAt, string Acao, string Entidade, string TraceId);
