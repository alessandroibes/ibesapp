using System.Security.Claims;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Api.Infrastructure;

public sealed class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db, TenantContext tenant)
    {
        if (!context.Request.Path.StartsWithSegments("/api/v1")) { await next(context); return; }
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await Results.Problem(statusCode: 401, title: "Autenticação necessária.").ExecuteAsync(context); return;
        }
        var id = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub");
        if (!Guid.TryParse(id, out var usuarioId))
        {
            await Results.Problem(statusCode: 401, title: "Sessão inválida.").ExecuteAsync(context); return;
        }
        if (!Guid.TryParse(context.Request.Headers["X-Igreja-Id"], out var igrejaId) || igrejaId == Guid.Empty)
        {
            await Results.Problem(statusCode: 400, title: "Selecione uma Igreja válida em X-Igreja-Id.").ExecuteAsync(context); return;
        }
        // The header selects a tenant; the current database membership authorizes it.
        var vinculo = await db.VinculosIgreja.IgnoreQueryFilters().AsNoTracking()
            .SingleOrDefaultAsync(v => v.IgrejaId == igrejaId && v.UsuarioId == usuarioId, context.RequestAborted);
        if (vinculo is null)
        {
            await Results.Problem(statusCode: 403, title: "Acesso não autorizado à Igreja.").ExecuteAsync(context); return;
        }
        tenant.Definir(igrejaId, usuarioId, context.TraceIdentifier);
        context.Items["permissoes"] = vinculo.Permissoes;
        await next(context);
    }
}
