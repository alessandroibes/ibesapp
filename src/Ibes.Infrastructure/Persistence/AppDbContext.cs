using Ibes.Foundation.Auditoria;
using Ibes.Foundation.Identidade;
using Ibes.Foundation.Organizacoes;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Ibes.Foundation.Domain;
using Ibes.Pessoas;
using Ibes.Embaixadas;
using Ibes.Progressao;

namespace Ibes.Foundation.Persistence;

public sealed partial class AppDbContext(DbContextOptions<AppDbContext> options, TenantContext tenant)
    : IdentityDbContext<Usuario, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Igreja> Igrejas => Set<Igreja>();
    public DbSet<Embaixada> Embaixadas => Set<Embaixada>();
    public DbSet<VinculoIgreja> VinculosIgreja => Set<VinculoIgreja>();
    public DbSet<RegistroAuditoria> Auditoria => Set<RegistroAuditoria>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.UseOpenIddict();
        ConfigurarDominio(b);
        ConfigurarOperacao(b);
        ConfigurarOrganizacao(b);
        ConfigurarCompeticoes(b);
        b.Entity<Usuario>().ToTable("usuarios", "identidade");
        b.Entity<IdentityRole<Guid>>().ToTable("papeis", "identidade");
        b.Entity<IdentityUserRole<Guid>>().ToTable("usuarios_papeis", "identidade");
        b.Entity<IdentityUserClaim<Guid>>().ToTable("usuarios_claims", "identidade");
        b.Entity<IdentityUserLogin<Guid>>().ToTable("usuarios_logins", "identidade");
        b.Entity<IdentityUserToken<Guid>>().ToTable("usuarios_tokens", "identidade");
        b.Entity<IdentityRoleClaim<Guid>>().ToTable("papeis_claims", "identidade");
        b.Entity<Igreja>(e =>
        {
            e.ToTable("igrejas", "organizacoes");
            e.HasKey(x => x.IgrejaId);
            e.Property(x => x.Nome).HasMaxLength(200);
            e.Property(x => x.Versao).IsConcurrencyToken();
            e.Property(x => x.Endereco).HasMaxLength(500);
            e.Property(x => x.Pastor).HasMaxLength(200);
            e.HasQueryFilter(x => tenant.IgrejaId != Guid.Empty && x.IgrejaId == tenant.IgrejaId);
        });
        b.Entity<Embaixada>(e =>
        {
            e.ToTable("embaixadas", "organizacoes");
            e.HasKey(x => x.IgrejaId);
            e.Property(x => x.Nome).HasMaxLength(200);
            e.Property(x => x.Versao).IsConcurrencyToken();
            e.Property(x => x.NomeUsual).HasMaxLength(200);
            e.Property(x => x.Endereco).HasMaxLength(500);
            e.Property(x => x.Historia).HasMaxLength(10000);
            e.HasOne<Igreja>().WithOne().HasForeignKey<Embaixada>(x => x.IgrejaId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => tenant.IgrejaId != Guid.Empty && x.IgrejaId == tenant.IgrejaId);
        });
        b.Entity<VinculoIgreja>(e =>
        {
            e.ToTable("vinculos_igreja", "identidade");
            e.HasKey(x => new { x.IgrejaId, x.UsuarioId });
            e.HasOne<Igreja>().WithMany().HasForeignKey(x => x.IgrejaId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Usuario>().WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => tenant.IgrejaId != Guid.Empty && x.IgrejaId == tenant.IgrejaId);
        });
        b.Entity<RegistroAuditoria>(e =>
        {
            e.ToTable("auditoria", "auditoria");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.IgrejaId, x.CreatedAt });
            e.Property(x => x.Acao).HasMaxLength(100);
            e.Property(x => x.Entidade).HasMaxLength(100);
            e.Property(x => x.TraceId).HasMaxLength(100);
            e.Property(x => x.Chave).HasMaxLength(200);
            e.HasOne<Igreja>().WithMany().HasForeignKey(x => x.IgrejaId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => tenant.IgrejaId != Guid.Empty && x.IgrejaId == tenant.IgrejaId);
        });
    }

    private void PrepararAlteracoes()
    {
        var alteracoes = ChangeTracker.Entries<ITenantEntity>()
            .Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted).ToList();
        foreach (var entry in alteracoes)
        {
            if (entry.Entity is Ibes.Frequencia.AlteracaoFrequencia && entry.State != EntityState.Added)
                throw new InvalidOperationException("Histórico de frequência é imutável.");
            if (entry.Entity is Ibes.ConsuladosDiretoria.ResultadoEleicao && entry.State != EntityState.Added)
                throw new InvalidOperationException("Resultado de eleição é imutável.");
            if (entry.Entity is Ibes.Competicoes.AlteracaoEscalacao && entry.State != EntityState.Added)
                throw new InvalidOperationException("Histórico da escalação é imutável.");
            if (entry.State != EntityState.Added && entry.Entity is VersaoManual or TarefaManual or Manual or ConclusaoRequisito or ConclusaoTarefa or CerimoniaReconhecimento)
                throw new InvalidOperationException("Registro histórico ou versão de manual imutável.");
            if (entry.Entity is JornadaPosto && entry.State == EntityState.Modified && entry.Property(nameof(JornadaPosto.VersaoManualId)).IsModified)
                throw new InvalidOperationException("A versão do manual é fixa durante o posto.");
            if (tenant.IgrejaId == Guid.Empty || entry.Entity.IgrejaId != tenant.IgrejaId ||
                (entry.State != EntityState.Added && entry.Property(nameof(ITenantEntity.IgrejaId)).OriginalValue is Guid original && original != tenant.IgrejaId))
                throw new InvalidOperationException("Escrita fora da Igreja selecionada.");
            if (entry.Entity is RegistroAuditoria)
            {
                if (entry.State != EntityState.Added)
                    throw new InvalidOperationException("Auditoria é imutável.");
                continue;
            }
            Auditoria.Add(new RegistroAuditoria
            {
                IgrejaId = tenant.IgrejaId,
                UsuarioId = tenant.UsuarioId,
                TraceId = tenant.TraceId,
                Acao = entry.State switch { EntityState.Added => "Criacao", EntityState.Modified => "Alteracao", _ => "Exclusao" },
                Entidade = entry.Metadata.ClrType.Name,
                Chave = string.Join("/", entry.Metadata.FindPrimaryKey()!.Properties.Select(p => entry.Property(p.Name).CurrentValue))
            });
            if (entry.Entity is Entidade entidade)
            {
                entidade.Versao = Guid.NewGuid();
                entidade.UpdatedAt = DateTimeOffset.UtcNow;
            }
            if (entry.Entity is Igreja igreja) igreja.Versao = Guid.NewGuid();
            if (entry.Entity is Embaixada embaixada) embaixada.Versao = Guid.NewGuid();
        }
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        PrepararAlteracoes();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        PrepararAlteracoes();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }
}
