namespace Ibes.Foundation.Organizacoes;

// Identificação mínima da fundação; cadastro institucional pertence à Fase 1.
public sealed class Igreja : ITenantEntity
{
    public Guid IgrejaId { get; set; }
    public string Nome { get; set; } = "";
}

public sealed class Embaixada : ITenantEntity
{
    // PK compartilhada garante no máximo uma Embaixada por Igreja.
    // Provisionamento cria o par na mesma transação.
    public Guid IgrejaId { get; set; }
    public string Nome { get; set; } = "";
}

public sealed class VinculoIgreja : ITenantEntity
{
    public Guid IgrejaId { get; set; }
    public Guid UsuarioId { get; set; }
    public string[] Permissoes { get; set; } = [];
}

public static class Permissoes
{
    public const string ConsultarFundacao = "fundacao.consultar";
    public const string ConsultarAuditoria = "auditoria.consultar";
}
