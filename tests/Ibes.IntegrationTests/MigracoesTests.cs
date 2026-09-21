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
        var meninoId = Guid.NewGuid();
        var responsavelId = Guid.NewGuid();
        var conselheiroId = Guid.NewGuid();
        var agora = DateTimeOffset.UtcNow;
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO pessoas.pessoas ("Id", "IgrejaId", "Nome", "DataNascimento", "WhatsApp", "Versao", "CreatedAt", "UpdatedAt")
            VALUES ({meninoId}, {igrejaId}, {"Pessoa da fase anterior"}, {new DateOnly(2010, 1, 1)}, {null}, {Guid.NewGuid()}, {agora}, {agora}),
                   ({responsavelId}, {igrejaId}, {"Responsável preservado"}, {new DateOnly(1980, 1, 1)}, {"11999999999"}, {Guid.NewGuid()}, {agora}, {agora})
            """);
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO pessoas.responsaveis_pessoa ("Id", "IgrejaId", "PessoaId", "ResponsavelId", "Parentesco", "DataInicio", "Versao", "CreatedAt", "UpdatedAt")
            VALUES ({Guid.NewGuid()}, {igrejaId}, {meninoId}, {responsavelId}, {"Mãe"}, {new DateOnly(2024, 1, 1)}, {Guid.NewGuid()}, {agora}, {agora})
            """);
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO embaixadas.conselheiros ("Id", "IgrejaId", "PessoaId", "DataInicio", "Funcao", "Versao", "CreatedAt", "UpdatedAt")
            VALUES ({conselheiroId}, {igrejaId}, {responsavelId}, {new DateOnly(2020, 1, 1)}, {"Conselheiro"}, {Guid.NewGuid()}, {agora}, {agora});
            INSERT INTO embaixadas.liderancas_embaixada ("Id", "IgrejaId", "ConselheiroId", "DataInicio", "Funcao", "Versao", "CreatedAt", "UpdatedAt")
            VALUES ({Guid.NewGuid()}, {igrejaId}, {conselheiroId}, {new DateOnly(2021, 1, 1)}, {"Cadastro legado"}, {Guid.NewGuid()}, {agora}, {agora})
            """);
        await db.Database.MigrateAsync();
        var pessoa = await db.Set<Ibes.Pessoas.Pessoa>().AsNoTracking().SingleAsync(x => x.Id == meninoId);
        Assert.Equal("Pessoa da fase anterior", pessoa.Nome);
        Assert.True(pessoa.Ativa);
        var responsavel = await db.Set<Ibes.Pessoas.ResponsavelPessoa>().AsNoTracking().SingleAsync();
        Assert.Equal("Mãe", responsavel.Relacao);
        Assert.Equal("Responsável preservado", responsavel.Nome);
        Assert.Equal("11999999999", responsavel.TelefoneWhatsApp);
        Assert.Null(responsavel.MoraComOEmbaixador);
        Assert.Equal("Igreja preservada", (await db.Igrejas.SingleAsync()).Nome);
        Assert.Equal("Embaixada preservada", (await db.Embaixadas.SingleAsync()).Nome);
        Assert.False(db.Database.HasPendingModelChanges());
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        var script = migrador.GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        await db.Database.ExecuteSqlRawAsync(script);
        await db.Database.ExecuteSqlRawAsync(script);
        Assert.Equal(8, (await db.Database.GetAppliedMigrationsAsync()).Count());
        Assert.Single(await db.Igrejas.ToListAsync());
    }
}
