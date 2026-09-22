using Ibes.Foundation.Domain;

namespace Ibes.Progressao;

public enum Posto { Escudeiro = 1, Arauto = 2, Senior = 3, Emerito = 4 }
public enum RequisitoMinimo { SignificadoDoNome = 1, Compromisso = 2, Tema = 3, Divisa = 4, HinoOficial = 5 }

public static class Catalogo
{
    public static string Nome(Posto posto) => posto switch
    {
        Posto.Escudeiro => "Embaixador Escudeiro",
        Posto.Arauto => "Embaixador Arauto",
        Posto.Senior => "Embaixador Sênior",
        Posto.Emerito => "Embaixador Emérito",
        _ => throw new RegraNegocioException("Posto inválido.")
    };
    public static string Nome(RequisitoMinimo requisito) => requisito switch
    {
        RequisitoMinimo.SignificadoDoNome => "Significado do nome Embaixador do Rei",
        RequisitoMinimo.Compromisso => "Compromisso dos ER",
        RequisitoMinimo.Tema => "Tema dos ER",
        RequisitoMinimo.Divisa => "Divisa dos ER",
        RequisitoMinimo.HinoOficial => "Hino Oficial dos ER",
        _ => throw new RegraNegocioException("Requisito Mínimo inválido.")
    };
}

public sealed class Manual : Entidade
{
    public Posto Posto { get; set; }
}

public sealed class VersaoManual : Entidade
{
    public Guid ManualId { get; set; }
    public string Identificacao { get; set; } = "";
    public List<TarefaManual> Tarefas { get; set; } = [];
}

public sealed class TarefaManual : Entidade
{
    public Guid VersaoManualId { get; set; }
    public string Nome { get; set; } = "";
    public int OrdemExibicao { get; set; }
    public bool Ativa { get; set; } = true;
}
