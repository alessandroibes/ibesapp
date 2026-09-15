using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Ibes.Foundation.Domain;
using Ibes.Api.Features.Dominio;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Ibes.Api.Infrastructure;

public sealed class SafeExceptionHandler(IProblemDetailsService problems, ILogger<SafeExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        var (status, titulo) = exception switch
        {
            RegraNegocioException => (400, exception.Message),
            RegistroNaoEncontradoException => (404, "Registro não encontrado."),
            AcessoConselheiroException => (403, "Esta operação exige conta vinculada a um Conselheiro ativo na Igreja, além da permissão."),
            DbUpdateConcurrencyException => (409, "O registro mudou. Atualize os dados antes de tentar novamente."),
            DbUpdateException { InnerException: PostgresException { SqlState: "23505" or "23503" } } => (409, "Registro duplicado ou vínculo inválido. Atualize os dados."),
            _ => (500, "Não foi possível concluir a operação.")
        };
        if (status == 500) logger.LogError("Falha {Tipo}; trace {TraceId}", exception.GetType().Name, context.TraceIdentifier);
        context.Response.StatusCode = status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails { Status = status, Title = titulo }
        });
    }
}
