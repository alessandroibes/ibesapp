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
    public async Task AtualizaFasesAnterioresPreservandoDadosEReaplicaScriptIdempotente()
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
        await migrador.MigrateAsync("20260915112439_PessoasEJornada");
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO pessoas.pessoas ("Id", "IgrejaId", "Nome", "DataNascimento", "Versao", "CreatedAt", "UpdatedAt")
            VALUES ({Guid.NewGuid()}, {igrejaId}, {"Pessoa da fase anterior"}, {new DateOnly(2010, 1, 1)}, {Guid.NewGuid()}, {DateTimeOffset.UtcNow}, {DateTimeOffset.UtcNow})
            """);
        await db.Database.MigrateAsync();
        var pessoa = await db.Set<Ibes.Pessoas.Pessoa>().AsNoTracking().SingleAsync();
        Assert.Equal("Pessoa da fase anterior", pessoa.Nome);
        Assert.True(pessoa.Ativa);
        Assert.Equal("Igreja preservada", (await db.Igrejas.SingleAsync()).Nome);
        Assert.Equal("Embaixada preservada", (await db.Embaixadas.SingleAsync()).Nome);
        Assert.False(db.Database.HasPendingModelChanges());
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        var script = migrador.GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        await db.Database.ExecuteSqlRawAsync(script);
        await db.Database.ExecuteSqlRawAsync(script);
        Assert.Equal(7, (await db.Database.GetAppliedMigrationsAsync()).Count());
        Assert.Single(await db.Igrejas.ToListAsync());
    }
}
