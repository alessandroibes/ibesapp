using Ibes.Foundation.Domain;

namespace Ibes.Pessoas;

public sealed class Pessoa : Entidade
{
    public bool Ativa { get; set; } = true;
    public string Nome { get; set; } = "";
    public DateOnly? DataNascimento { get; set; }
    public string? Naturalidade { get; set; }
    public string? WhatsApp { get; set; }
    public string? Endereco { get; set; }
    public DateOnly? DataBatismo { get; set; }
    public string? LocalBatismo { get; set; }
    public string? NumeroCarteira { get; set; }
    public string? SituacaoCarteira { get; set; }
    public bool? PossuiBiblia { get; set; }
    public string? Observacoes { get; set; }
}

public enum TipoAlteracaoSituacaoPessoa { Inativacao, Reativacao }

public sealed class AlteracaoSituacaoPessoa : Entidade
{
    public Guid PessoaId { get; set; }
    public TipoAlteracaoSituacaoPessoa Tipo { get; set; }
    public DateOnly Data { get; set; }
    public string Motivo { get; set; } = "";
    public Guid RegistradoPor { get; set; }
}

public sealed class ResponsavelPessoa : Entidade
{
    public Guid PessoaId { get; set; }
    public string Relacao { get; set; } = "";
    public string Nome { get; set; } = "";
    public string? TelefoneWhatsApp { get; set; }
    public bool? MoraComOEmbaixador { get; set; }
}

public sealed class VinculoEclesiastico : Entidade
{
    public Guid PessoaId { get; set; }
    public string NomeIgreja { get; set; } = "";
    public string Tipo { get; set; } = "";
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
}

public sealed class FotoPessoa : Entidade
{
    public Guid PessoaId { get; set; }
    public byte[] Conteudo { get; set; } = [];
    public string TipoConteudo { get; set; } = "";
}
