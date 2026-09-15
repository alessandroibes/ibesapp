using Ibes.Foundation.Domain;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.AgendaAtividades;

public enum SituacaoAtividade { Planejada = 1, Confirmada, Concluida, Cancelada, Adiada }
public enum Periodicidade { Diaria = 1, Semanal, Mensal, Anual }
public sealed class EntidadePromotora : Entidade { public string Nome { get; set; } = ""; }
public sealed class TipoAtividade : Entidade { public string Nome { get; set; } = ""; }
public sealed class ModeloReuniao : Entidade
{
    public string Nome { get; set; } = "";
    public string ItensJson { get; set; } = "[]";
}
public sealed record ItemRoteiro(string Titulo, int? DuracaoMinutos, string? Observacoes);
public sealed class AtividadeAgenda : Entidade
{
    public string Titulo { get; set; } = "";
    public Guid TipoAtividadeId { get; set; }
    public Guid EntidadePromotoraId { get; set; }
    public Guid? ResponsavelId { get; set; }
    public Guid? AtividadeRelacionadaId { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly DataFim { get; set; }
    public TimeOnly? HoraInicio { get; set; }
    public TimeOnly? HoraFim { get; set; }
    public bool DiaInteiro { get; set; }
    public bool Prazo { get; set; }
    public bool Destaque { get; set; }
    public string FusoHorario { get; set; } = "America/Sao_Paulo";
    public string? Local { get; set; }
    public string? Observacoes { get; set; }
    public decimal? Valor { get; set; }
    public string? Moeda { get; set; }
    public string? Link { get; set; }
    public SituacaoAtividade Situacao { get; set; } = SituacaoAtividade.Planejada;
    public Periodicidade? Periodicidade { get; set; }
    public int Intervalo { get; set; } = 1;
    public int[] DiasSemana { get; set; } = [];
    public DateOnly? RecorrenciaAte { get; set; }
    public DateOnly? SerieEncerradaEm { get; set; }

    public void Validar()
    {
        Exigir(!string.IsNullOrWhiteSpace(Titulo) && Titulo.Length <= 200, "Informe um título de até 200 caracteres.");
        Exigir(DataInicio != default && DataFim >= DataInicio && DataFim.DayNumber - DataInicio.DayNumber <= 366, "Período inválido ou superior a 366 dias.");
        Exigir(Enum.IsDefined(Situacao), "Situação inválida.");
        Exigir(DiaInteiro ? HoraInicio is null && HoraFim is null : HoraInicio is not null && HoraFim is not null && (DataFim > DataInicio || HoraFim >= HoraInicio), "Informe horários válidos ou marque dia inteiro.");
        Exigir(Valor is null || Valor >= 0 && !string.IsNullOrWhiteSpace(Moeda) && Moeda.Length <= 10, "Informe valor não negativo e moeda.");
        Exigir(Link is null || Uri.TryCreate(Link, UriKind.Absolute, out var uri) && uri.Scheme == "https", "Informe um link HTTPS.");
        Exigir(TimeZoneInfo.TryFindSystemTimeZoneById(FusoHorario, out _), "Fuso horário inválido.");
        Exigir(Periodicidade is null || Enum.IsDefined(Periodicidade.Value) && Intervalo is >= 1 and <= 365 && (RecorrenciaAte is null || RecorrenciaAte >= DataInicio), "Recorrência inválida.");
        Exigir(DiasSemana.All(d => d is >= 0 and <= 6) && DiasSemana.Distinct().Count() == DiasSemana.Length, "Dias da semana inválidos.");
        Exigir(Periodicidade != AgendaAtividades.Periodicidade.Semanal || DiasSemana.Contains((int)DataInicio.DayOfWeek), "Inclua o dia inicial nos dias da recorrência semanal.");
    }
    public bool OcorreEm(DateOnly data)
    {
        if (data < DataInicio || data > RecorrenciaAte || data > SerieEncerradaEm) return false;
        if (Periodicidade is null) return data == DataInicio;
        var dias = data.DayNumber - DataInicio.DayNumber;
        var meses = (data.Year - DataInicio.Year) * 12 + data.Month - DataInicio.Month;
        return Periodicidade switch
        {
            AgendaAtividades.Periodicidade.Diaria => dias % Intervalo == 0,
            AgendaAtividades.Periodicidade.Semanal => ((dias + (int)DataInicio.DayOfWeek) / 7) % Intervalo == 0 && DiasSemana.Contains((int)data.DayOfWeek),
            AgendaAtividades.Periodicidade.Mensal => meses % Intervalo == 0 && data.Day == DataInicio.Day,
            AgendaAtividades.Periodicidade.Anual => (data.Year - DataInicio.Year) % Intervalo == 0 && data.Month == DataInicio.Month && data.Day == DataInicio.Day,
            _ => false
        };
    }
    public IEnumerable<DateOnly> DatasEntre(DateOnly inicio, DateOnly fim)
    {
        Exigir(fim >= inicio && fim.DayNumber - inicio.DayNumber <= 366, "Consulte um intervalo de até 366 dias.");
        var primeiro = Math.Max(DataInicio.DayNumber, inicio.DayNumber - (DataFim.DayNumber - DataInicio.DayNumber));
        for (var dia = primeiro; dia <= fim.DayNumber; dia++)
        {
            var data = DateOnly.FromDayNumber(dia);
            if (OcorreEm(data)) yield return data;
        }
    }
}
public sealed class ExcecaoAgenda : Entidade
{
    public Guid AtividadeAgendaId { get; set; }
    public DateOnly DataOriginal { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly DataFim { get; set; }
    public TimeOnly? HoraInicio { get; set; }
    public TimeOnly? HoraFim { get; set; }
    public SituacaoAtividade Situacao { get; set; }
    public string? Observacoes { get; set; }
}
