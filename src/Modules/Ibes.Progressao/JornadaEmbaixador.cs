using Ibes.Foundation.Domain;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Progressao;

public sealed class JornadaEmbaixador : Entidade
{
    public Guid PessoaId { get; set; }
    public int? MesesPermanencia { get; private set; }
    public List<ConclusaoRequisito> Requisitos { get; private set; } = [];
    public List<JornadaPosto> Postos { get; private set; } = [];
    public List<CerimoniaReconhecimento> Cerimonias { get; private set; } = [];

    public string Situacao(DateOnly nascimento, DateOnly dataBase)
    {
        if (Idade(nascimento, dataBase) >= 18) return "Trajetória histórica";
        return Postos.Any(p => p.DataIngresso <= dataBase) ? "Embaixador" : "Candidato";
    }

    public void ConcluirRequisito(RequisitoMinimo requisito, DateOnly data, DateOnly nascimento, DateOnly hoje, Guid autor)
    {
        Exigir(Enum.IsDefined(requisito), "Requisito Mínimo inválido.");
        ValidarFato(nascimento, data, hoje);
        Exigir(Postos.Count == 0, "Os Requisitos Mínimos desta admissão já estão registrados.");
        Exigir(Requisitos.All(r => r.Requisito != requisito), "Requisito Mínimo já concluído.");
        Requisitos.Add(new ConclusaoRequisito { IgrejaId = IgrejaId, JornadaEmbaixadorId = Id, Requisito = requisito, DataConclusao = data, RegistradoPor = autor });
    }

    public void CorrigirDataRequisito(RequisitoMinimo requisito, DateOnly data, DateOnly nascimento, DateOnly hoje)
    {
        Exigir(Enum.IsDefined(requisito), "Requisito Mínimo inválido.");
        ValidarFato(nascimento, data, hoje);
        var conclusao = Requisitos.SingleOrDefault(r => r.Requisito == requisito);
        Exigir(conclusao is not null, "Conclua o Requisito Mínimo antes de corrigir sua data.");
        var admissao = Postos.OrderBy(p => p.DataIngresso).FirstOrDefault();
        Exigir(admissao is null || data <= admissao.DataIngresso,
            "A conclusão do Requisito Mínimo não pode ser posterior à admissão.");
        conclusao!.DataConclusao = data;
        Versao = Guid.NewGuid();
    }

    public void Admitir(DateOnly data, DateOnly nascimento, DateOnly hoje, VersaoManual versaoEscudeiro, Guid autor)
    {
        ValidarFato(nascimento, data, hoje);
        Exigir(Postos.Count == 0, "Admissão já registrada.");
        Exigir(versaoEscudeiro.Id != Guid.Empty && versaoEscudeiro.IgrejaId == IgrejaId, "Selecione uma versão do manual do Escudeiro.");
        Exigir(Enum.GetValues<RequisitoMinimo>().All(r => Requisitos.Any(c => c.Requisito == r && c.DataConclusao <= data)),
            "A admissão exige os cinco Requisitos Mínimos concluídos até sua data.");
        MesesPermanencia = Idade(nascimento, data) < 14 ? 12 : 6;
        Postos.Add(CriarPosto(Posto.Escudeiro, versaoEscudeiro, data, autor));
    }

    public void Admitir(DateOnly data, DateOnly nascimento, DateOnly hoje, Guid versaoEscudeiroId, Guid autor) =>
        Admitir(data, nascimento, hoje, new VersaoManual { Id = versaoEscudeiroId, IgrejaId = IgrejaId }, autor);

    public void ConcluirTarefa(Guid tarefaId, VersaoManual manual, DateOnly data, DateOnly nascimento, DateOnly hoje, Guid autor)
    {
        ValidarFato(nascimento, data, hoje);
        var posto = Atual();
        Exigir(posto.Posto != Posto.Emerito, "O manual do Emérito ainda não está definido.");
        Exigir(manual.Id == posto.VersaoManualId && manual.IgrejaId == IgrejaId && (posto.TarefasAplicaveis.Count == 0 || posto.TarefasAplicaveis.Any(t => t.TarefaManualId == tarefaId)), "Tarefa não pertence ao conjunto aplicável deste posto.");
        Exigir(data >= posto.DataIngresso, "A conclusão não pode anteceder o ingresso no posto.");
        Exigir(posto.Tarefas.All(t => t.TarefaManualId != tarefaId), "Tarefa já concluída.");
        posto.Tarefas.Add(new ConclusaoTarefa { IgrejaId = IgrejaId, JornadaPostoId = posto.Id, TarefaManualId = tarefaId, DataConclusao = data, RegistradoPor = autor });
    }

    public void CorrigirDataTarefa(Guid tarefaId, DateOnly data, DateOnly nascimento, DateOnly hoje)
    {
        ValidarFato(nascimento, data, hoje);
        var posto = Postos.SingleOrDefault(p => p.Tarefas.Any(t => t.TarefaManualId == tarefaId));
        Exigir(posto is not null, "Conclua a tarefa antes de corrigir sua data.");
        var conclusao = posto!.Tarefas.Single(t => t.TarefaManualId == tarefaId);
        Exigir(data >= posto.DataIngresso, "A conclusão não pode anteceder o ingresso no posto.");
        Exigir(posto.DataConclusao is null || data <= posto.DataConclusao,
            "A conclusão da tarefa não pode ser posterior à conclusão do posto.");
        conclusao.DataConclusao = data;
        Versao = Guid.NewGuid();
    }

    public void ConcluirPosto(VersaoManual manual, DateOnly data, DateOnly nascimento, DateOnly hoje, VersaoManual? proximaVersao, Guid autor)
    {
        ValidarFato(nascimento, data, hoje);
        var posto = Atual();
        Exigir(posto.Posto != Posto.Emerito, "A conclusão do Emérito aguarda definição de seu manual.");
        Exigir(manual.Id == posto.VersaoManualId && manual.IgrejaId == IgrejaId, "Versão do manual inválida para esta jornada.");
        var tarefasAplicaveis = posto.TarefasAplicaveis.Count == 0 ? manual.Tarefas.Where(t => t.Ativa).Select(t => t.Id) : posto.TarefasAplicaveis.Select(t => t.TarefaManualId);
        Exigir(tarefasAplicaveis.Any() && tarefasAplicaveis.All(id => posto.Tarefas.Any(c => c.TarefaManualId == id && c.DataConclusao <= data)), "Todas as tarefas aplicáveis da versão devem estar concluídas até a data da conclusão do posto.");
        Exigir(data >= posto.DataIngresso.AddMonths(MesesPermanencia!.Value), "O tempo mínimo de permanência no posto ainda não foi cumprido.");
        Exigir(posto.Posto == Posto.Senior ? proximaVersao is null : proximaVersao is not null && proximaVersao.Id != Guid.Empty,
            "Selecione a versão do próximo posto; o Emérito ingressa sem manual.");
        posto.DataConclusao = data;
        posto.ConcluidoPor = autor;
        Postos.Add(CriarPosto(posto.Posto + 1, proximaVersao, data, autor));
    }

    public void ConcluirPosto(VersaoManual manual, DateOnly data, DateOnly nascimento, DateOnly hoje, Guid? proximaVersaoId, Guid autor) =>
        ConcluirPosto(manual, data, nascimento, hoje, proximaVersaoId is { } id ? new VersaoManual { Id = id, IgrejaId = IgrejaId } : null, autor);

    public void RegistrarCerimonia(Guid jornadaPostoId, DateOnly data, string descricao, DateOnly hoje, Guid autor)
    {
        var posto = Postos.SingleOrDefault(p => p.Id == jornadaPostoId);
        Exigir(posto is not null, "Posto não encontrado nesta trajetória.");
        Exigir(data >= posto!.DataIngresso && data <= hoje, "Data da cerimônia inválida.");
        Cerimonias.Add(new CerimoniaReconhecimento { IgrejaId = IgrejaId, JornadaEmbaixadorId = Id, JornadaPostoId = jornadaPostoId, Data = data, Descricao = descricao, RegistradoPor = autor });
    }

    public JornadaPosto Atual() => Postos.SingleOrDefault(p => p.DataConclusao is null)
        ?? throw new RegraNegocioException("Registre a admissão antes de trabalhar nos postos.");

    private JornadaPosto CriarPosto(Posto posto, VersaoManual? versao, DateOnly data, Guid autor)
    {
        var jornadaPosto = new JornadaPosto { IgrejaId = IgrejaId, JornadaEmbaixadorId = Id, Posto = posto, VersaoManualId = versao?.Id, DataIngresso = data, RegistradoPor = autor };
        if (versao is not null)
            jornadaPosto.TarefasAplicaveis = versao.Tarefas.Where(t => t.Ativa).Select(t => new TarefaAplicavelPosto
            {
                IgrejaId = IgrejaId,
                JornadaPostoId = jornadaPosto.Id,
                TarefaManualId = t.Id
            }).ToList();
        return jornadaPosto;
    }
}

public sealed class ConclusaoRequisito : Entidade
{
    public Guid JornadaEmbaixadorId { get; set; }
    public RequisitoMinimo Requisito { get; set; }
    public DateOnly DataConclusao { get; set; }
    public Guid RegistradoPor { get; set; }
}

public sealed class JornadaPosto : Entidade
{
    public Guid JornadaEmbaixadorId { get; set; }
    public Posto Posto { get; set; }
    public Guid? VersaoManualId { get; set; }
    public DateOnly DataIngresso { get; set; }
    public Guid RegistradoPor { get; set; }
    public DateOnly? DataConclusao { get; set; }
    public Guid? ConcluidoPor { get; set; }
    public List<ConclusaoTarefa> Tarefas { get; set; } = [];
    public List<TarefaAplicavelPosto> TarefasAplicaveis { get; set; } = [];
}

public sealed class TarefaAplicavelPosto : Entidade
{
    public Guid JornadaPostoId { get; set; }
    public Guid TarefaManualId { get; set; }
}

public sealed class ConclusaoTarefa : Entidade
{
    public Guid JornadaPostoId { get; set; }
    public Guid TarefaManualId { get; set; }
    public DateOnly DataConclusao { get; set; }
    public Guid RegistradoPor { get; set; }
}

public sealed class CerimoniaReconhecimento : Entidade
{
    public Guid JornadaEmbaixadorId { get; set; }
    public Guid JornadaPostoId { get; set; }
    public DateOnly Data { get; set; }
    public string Descricao { get; set; } = "";
    public Guid RegistradoPor { get; set; }
}
