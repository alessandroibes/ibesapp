using Ibes.Foundation.Domain;

namespace Ibes.Embaixadas;

public sealed class Conselheiro : Entidade
{
    public Guid PessoaId { get; set; }
    public Guid? UsuarioId { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public string Funcao { get; set; } = "";
}

public sealed class LiderancaEmbaixada : Entidade
{
    public Guid ConselheiroId { get; set; }
    public string Funcao { get; set; } = "";
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
}
