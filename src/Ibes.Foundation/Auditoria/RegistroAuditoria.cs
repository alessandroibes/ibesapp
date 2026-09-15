using Ibes.Foundation.Organizacoes;

namespace Ibes.Foundation.Auditoria;

public sealed class RegistroAuditoria : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IgrejaId { get; set; }
    public Guid? UsuarioId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string Acao { get; set; } = "";
    public string Entidade { get; set; } = "";
    public string TraceId { get; set; } = "";
    public string? Chave { get; set; }
}
