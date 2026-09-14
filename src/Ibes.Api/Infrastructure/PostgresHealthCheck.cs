using Ibes.Foundation.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Ibes.Api.Infrastructure;

public sealed class PostgresHealthCheck(IServiceScopeFactory scopes) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.Database.CanConnectAsync(cancellationToken)
            && !(await db.Database.GetPendingMigrationsAsync(cancellationToken)).Any()
            ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy();
    }
}
