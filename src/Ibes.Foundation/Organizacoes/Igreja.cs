namespace Ibes.Foundation.Organizacoes;

// Identidade do tenant compartilhada com o cadastro institucional da Fase 1.
public sealed class Igreja : ITenantEntity
{
    public Guid IgrejaId { get; set; }
    public string Nome { get; set; } = "";
    public string? Endereco { get; set; }
    public string? Pastor { get; set; }
    public Guid Versao { get; set; } = Guid.NewGuid();
}

public sealed class Embaixada : ITenantEntity
{
    // PK compartilhada garante no máximo uma Embaixada por Igreja.
    // Provisionamento cria o par na mesma transação.
    public Guid IgrejaId { get; set; }
    public string Nome { get; set; } = "";
    public string? NomeUsual { get; set; }
    public DateOnly? DataFundacao { get; set; }
    public string? Endereco { get; set; }
    public string? Historia { get; set; }
    public Guid Versao { get; set; } = Guid.NewGuid();
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
    public const string ConsultarPessoas = "pessoas.consultar";
    public const string EditarPessoas = "pessoas.editar";
    public const string ConsultarEmbaixada = "embaixada.consultar";
    public const string EditarEmbaixada = "embaixada.editar";
    public const string ConsultarProgressao = "progressao.consultar";
    public const string RegistrarProgressao = "progressao.registrar";
    public const string GerenciarManuais = "manuais.gerenciar";
    public const string ConsultarAgenda = "agenda.consultar";
    public const string EditarAgenda = "agenda.editar";
    public const string ConsultarFrequencia = "frequencia.consultar";
    public const string RegistrarFrequencia = "frequencia.registrar";
    public const string ConsultarOrganizacao = "organizacao.consultar";
    public const string GerenciarOrganizacao = "organizacao.gerenciar";
    public const string ConsultarCompeticoes = "competicoes.consultar";
    public const string GerenciarCompeticoes = "competicoes.gerenciar";
    public static readonly string[] Todas = [ConsultarFundacao, ConsultarAuditoria, ConsultarPessoas, EditarPessoas,
        ConsultarEmbaixada, EditarEmbaixada, ConsultarProgressao, RegistrarProgressao, GerenciarManuais,
        ConsultarAgenda, EditarAgenda, ConsultarFrequencia, RegistrarFrequencia,
        ConsultarOrganizacao, GerenciarOrganizacao, ConsultarCompeticoes, GerenciarCompeticoes];
}
