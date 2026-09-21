using Ibes.Foundation.Domain;

namespace Ibes.Embaixadas;

public sealed class Conselheiro : Entidade
{
    public Guid PessoaId { get; set; }
    public Guid? UsuarioId { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
}
