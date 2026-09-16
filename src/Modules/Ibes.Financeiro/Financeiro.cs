using Ibes.Foundation.Domain;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Financeiro;

public enum TipoLancamentoFinanceiro { Entrada = 1, Saida }

public sealed class IniciativaFinanceira : Entidade
{
    public string Nome { get; set; } = "";
    public string? Descricao { get; set; }
    public void Validar()
    {
        Exigir(!string.IsNullOrWhiteSpace(Nome) && Nome.Length <= 200, "Informe o nome da iniciativa com até 200 caracteres.");
        Exigir(Descricao is null || Descricao.Length <= 2000, "A descrição da iniciativa deve ter até 2.000 caracteres.");
    }
}

public sealed class LancamentoFinanceiro : Entidade
{
    public TipoLancamentoFinanceiro Tipo { get; set; }
    public DateOnly Data { get; set; }
    public decimal Valor { get; set; }
    public string Motivo { get; set; } = "";
    public string? Descricao { get; set; }
    public Guid? PessoaId { get; set; }
    public Guid? AtividadeAgendaId { get; set; }
    public Guid? IniciativaFinanceiraId { get; set; }

    public void Validar()
    {
        Exigir(Enum.IsDefined(Tipo), "Informe se o lançamento é uma entrada ou saída.");
        Exigir(Data != default, "Informe a data do lançamento.");
        Exigir(Valor > 0 && decimal.Round(Valor, 2) == Valor, "Informe um valor positivo com até duas casas decimais.");
        Exigir(!string.IsNullOrWhiteSpace(Motivo) && Motivo.Length <= 200, "Informe o motivo com até 200 caracteres.");
        Exigir(Descricao is null || Descricao.Length <= 2000, "A descrição deve ter até 2.000 caracteres.");
    }
}
