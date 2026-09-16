using Ibes.Foundation.Domain;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.ConsuladosDiretoria;

public sealed class Consulado : Entidade
{
    public string Nome { get; set; } = "";
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public void Validar(DateOnly hoje)
    {
        Exigir(!string.IsNullOrWhiteSpace(Nome) && Nome.Length <= 80, "Informe um nome curto de até 80 caracteres para o Consulado.");
        Exigir(DataInicio != default && DataInicio <= hoje && (DataFim is null || DataFim >= DataInicio && DataFim <= hoje), "Período do Consulado inválido.");
    }
}

public sealed class MembroConsulado : Entidade
{
    public Guid ConsuladoId { get; set; }
    public Guid PessoaId { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public string? MotivoFim { get; set; }
}

public sealed class LiderancaConsulado : Entidade
{
    public Guid ConsuladoId { get; set; }
    public Guid MembroConsuladoId { get; set; }
    public Guid PessoaId { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public string? MotivoFim { get; set; }
}

public sealed class MandatoDiretoria : Entidade
{
    public string Nome { get; set; } = "";
    public DateOnly DataInicio { get; set; }
    public DateOnly DataFim { get; set; }
    public string? Observacoes { get; set; }
    public void Validar()
    {
        Exigir(!string.IsNullOrWhiteSpace(Nome) && Nome.Length <= 150, "Informe o nome do mandato.");
        Exigir(DataInicio != default && DataFim >= DataInicio, "Período do mandato inválido.");
    }
}

public sealed class CargoEmbaixada : Entidade
{
    public string Nome { get; set; } = "";
    public int QuantidadeVagas { get; set; }
    public bool Ativo { get; set; } = true;
    public void Validar() => Exigir(!string.IsNullOrWhiteSpace(Nome) && Nome.Length <= 100 && QuantidadeVagas is >= 1 and <= 100, "Informe nome e quantidade de 1 a 100 vagas para o cargo.");
}

public sealed class OcupacaoCargo : Entidade
{
    public Guid MandatoDiretoriaId { get; set; }
    public Guid CargoEmbaixadaId { get; set; }
    public Guid PessoaId { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public string? MotivoFim { get; set; }
}

public sealed class ResultadoEleicao : Entidade
{
    public Guid MandatoDiretoriaId { get; set; }
    public Guid CargoEmbaixadaId { get; set; }
    public Guid PessoaEscolhidaId { get; set; }
    public Guid OcupacaoCargoId { get; set; }
    public DateOnly Data { get; set; }
    public string Motivo { get; set; } = "";
    public Guid RegistradoPor { get; set; }
}
