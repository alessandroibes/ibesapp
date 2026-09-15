using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Testcontainers.PostgreSql;

namespace Ibes.IntegrationTests;

public sealed class MigracoesTests
{
    [Fact]
    public async Task AtualizaFundacaoPreservandoDadosEReaplicaScriptIdempotente()
    {
        await using var postgres = new PostgreSqlBuilder("postgres:17-alpine").Build();
        await postgres.StartAsync();
        var tenant = new TenantContext();
        var igrejaId = Guid.NewGuid(); tenant.Definir(igrejaId, null, "teste-migracao");
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(postgres.GetConnectionString()).Options, tenant);
        var migrador = db.GetService<IMigrator>();
        await migrador.MigrateAsync("20260914195000_FundacaoInicial");
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO organizacoes.igrejas (\"IgrejaId\", \"Nome\") VALUES ({igrejaId}, {"Igreja preservada"})");
        await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO organizacoes.embaixadas (\"IgrejaId\", \"Nome\") VALUES ({igrejaId}, {"Embaixada preservada"})");
        await db.Database.MigrateAsync();
        Assert.Equal("Igreja preservada", (await db.Igrejas.SingleAsync()).Nome);
        Assert.Equal("Embaixada preservada", (await db.Embaixadas.SingleAsync()).Nome);
        Assert.False(db.Database.HasPendingModelChanges());
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        var script = migrador.GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        await db.Database.ExecuteSqlRawAsync(script);
        await db.Database.ExecuteSqlRawAsync(script);
        Assert.Equal(2, (await db.Database.GetAppliedMigrationsAsync()).Count());
        Assert.Single(await db.Igrejas.ToListAsync());
    }
}
