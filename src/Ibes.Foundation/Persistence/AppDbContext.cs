using Ibes.Foundation.Auditoria;
using Ibes.Foundation.Identidade;
using Ibes.Foundation.Organizacoes;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Foundation.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, TenantContext tenant)
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
            e.HasQueryFilter(x => tenant.IgrejaId != Guid.Empty && x.IgrejaId == tenant.IgrejaId);
        });
        b.Entity<Embaixada>(e =>
        {
            e.ToTable("embaixadas", "organizacoes");
            e.HasKey(x => x.IgrejaId);
            e.Property(x => x.Nome).HasMaxLength(200);
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
                Acao = entry.State.ToString(),
                Entidade = entry.Metadata.ClrType.Name
            });
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
