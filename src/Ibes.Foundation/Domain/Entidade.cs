using Ibes.Foundation.Organizacoes;

namespace Ibes.Foundation.Domain;

public abstract class Entidade : ITenantEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IgrejaId { get; set; }
    public Guid Versao { get; set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class RegraNegocioException(string mensagem) : Exception(mensagem);

public static class Datas
{
    public static int Idade(DateOnly nascimento, DateOnly data)
    {
        var idade = data.Year - nascimento.Year;
        return nascimento.AddYears(idade) > data ? idade - 1 : idade;
    }

    public static void Exigir(bool condicao, string mensagem)
    {
        if (!condicao) throw new RegraNegocioException(mensagem);
    }

    public static void ValidarFato(DateOnly nascimento, DateOnly data, DateOnly hoje)
    {
        Exigir(data <= hoje, "A data do fato não pode estar no futuro.");
        Exigir(Idade(nascimento, data) is >= 9 and < 18, "O fato da jornada deve ocorrer entre 9 anos e a véspera dos 18 anos.");
    }

    public static string? FaixaEtaria(DateOnly nascimento, DateOnly data) => Idade(nascimento, data) switch
    {
        >= 9 and < 12 => "Junior",
        >= 12 and < 15 => "Adolescente",
        >= 15 and < 18 => "Juvenil",
        _ => null
    };
}
