using Ibes.Foundation.Domain;

namespace Ibes.Frequencia;

public enum SituacaoFrequencia { PresencaComPontualidade = 1, PresencaComAtraso, Falta, FaltaJustificada }
public sealed class Reuniao : Entidade
{
    public Guid AtividadeAgendaId { get; set; }
    public DateOnly DataOriginal { get; set; }
    public DateOnly Data { get; set; }
    public string Titulo { get; set; } = "";
    public Guid? ModeloReuniaoId { get; set; }
    public Guid? VersaoModelo { get; set; }
    public string RoteiroJson { get; set; } = "[]";
}
public sealed class RegistroFrequencia : Entidade
{
    public Guid ReuniaoId { get; set; }
    public Guid PessoaId { get; set; }
    public SituacaoFrequencia Situacao { get; set; }
    public string? Observacoes { get; set; }
    public Guid RegistradoPor { get; set; }
}
public sealed class AlteracaoFrequencia : Entidade
{
    public Guid RegistroFrequenciaId { get; set; }
    public SituacaoFrequencia? SituacaoAnterior { get; set; }
    public SituacaoFrequencia Situacao { get; set; }
    public string? Observacoes { get; set; }
    public Guid RegistradoPor { get; set; }
}
