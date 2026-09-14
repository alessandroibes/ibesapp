using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Ibes.Api.Infrastructure;

public sealed class SafeExceptionHandler(IProblemDetailsService problems, ILogger<SafeExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError("Falha {Tipo}; trace {TraceId}", exception.GetType().Name, context.TraceIdentifier);
        context.Response.StatusCode = 500;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails { Status = 500, Title = "Não foi possível concluir a operação." }
        });
    }
}
