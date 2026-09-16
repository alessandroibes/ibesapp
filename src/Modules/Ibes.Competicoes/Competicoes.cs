using Ibes.Foundation.Domain;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Competicoes;

public enum NaturezaProva { Individual = 1, Coletiva = 2 }
public enum TipoReferenciaProva { Nenhuma = 1, Missionario = 2, LivroBiblico = 3 }
public enum CategoriaCompeticao { Junior = 1, Adolescente = 2, Juvenil = 3, Livre = 4 }
public enum FuncaoEscalacao { Titular = 1, Reserva = 2 }
public enum SituacaoEscalacao { Rascunho = 1, Finalizada = 2 }
public enum TipoAlteracaoEscalacao { Finalizacao = 1, Reabertura = 2 }

public sealed class Modalidade : Entidade
{
    public string Nome { get; set; } = "";
    public bool Ativa { get; set; } = true;
    public void Validar() => Exigir(!string.IsNullOrWhiteSpace(Nome) && Nome.Length <= 100, "Informe o nome da modalidade com até 100 caracteres.");
}

public sealed class Prova : Entidade
{
    public Guid ModalidadeId { get; set; }
    public string Nome { get; set; } = "";
    public NaturezaProva Natureza { get; set; }
    public TipoReferenciaProva TipoReferencia { get; set; }
    public bool Ativa { get; set; } = true;
    public void Validar()
    {
        Exigir(ModalidadeId != Guid.Empty && !string.IsNullOrWhiteSpace(Nome) && Nome.Length <= 150, "Informe modalidade e nome da prova.");
        Exigir(Enum.IsDefined(Natureza) && Enum.IsDefined(TipoReferencia), "Natureza ou tipo de referência da prova inválido.");
    }
}

public sealed class AptidaoProva : Entidade
{
    public Guid PessoaId { get; set; }
    public Guid ProvaId { get; set; }
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public Guid RegistradoPor { get; set; }
    public Guid? EncerradoPor { get; set; }
    public string? MotivoFim { get; set; }
    public void Validar(DateOnly hoje) => Exigir(DataInicio != default && DataInicio <= hoje && (DataFim is null || DataFim >= DataInicio && DataFim <= hoje), "Período da aptidão inválido.");
}

public sealed class Competicao : Entidade
{
    public string Nome { get; set; } = "";
    public DateOnly DataInicio { get; set; }
    public DateOnly DataFim { get; set; }
    public DateOnly DataBaseCategoria { get; set; }
    public string? Local { get; set; }
    public string? Observacoes { get; set; }
    public void Validar()
    {
        Exigir(!string.IsNullOrWhiteSpace(Nome) && Nome.Length <= 200, "Informe o nome da competição.");
        Exigir(DataInicio != default && DataFim >= DataInicio && DataBaseCategoria != default, "Datas da competição inválidas.");
        Exigir(Local is null || Local.Length <= 500, "O local deve ter até 500 caracteres.");
        Exigir(Observacoes is null || Observacoes.Length <= 4000, "As observações devem ter até 4.000 caracteres.");
    }
}

public sealed class ProvaCompeticao : Entidade
{
    public Guid CompeticaoId { get; set; }
    public Guid ProvaId { get; set; }
    public int MinimoTitulares { get; set; }
    public int MaximoParticipantes { get; set; }
    public int MaximoReservas { get; set; }
    public int? QuantidadeExataTitulares { get; set; }
    public string? Referencia { get; set; }
    public DateOnly? Data { get; set; }
    public TimeOnly? HoraInicio { get; set; }
    public TimeOnly? HoraFim { get; set; }
    public List<CategoriaProvaCompeticao> Categorias { get; set; } = [];

    public void Validar(Prova prova)
    {
        Exigir(CompeticaoId != Guid.Empty && ProvaId != Guid.Empty, "Competição e prova são obrigatórias.");
        Exigir(MinimoTitulares >= 1 && MaximoParticipantes >= MinimoTitulares && MaximoReservas >= 0 && MaximoReservas <= MaximoParticipantes,
            "Os limites de titulares, participantes e reservas são inválidos.");
        Exigir(QuantidadeExataTitulares is null || QuantidadeExataTitulares >= MinimoTitulares && QuantidadeExataTitulares <= MaximoParticipantes,
            "A quantidade exata de titulares deve respeitar os limites da prova.");
        Exigir(Categorias.Count > 0 && Categorias.Select(x => x.Categoria).Distinct().Count() == Categorias.Count, "Informe ao menos uma categoria sem repetições.");
        Exigir(!Categorias.Any(x => x.Categoria == CategoriaCompeticao.Livre) || Categorias.Count == 1, "A categoria Livre não deve ser combinada com outras categorias.");
        Exigir(prova.TipoReferencia == TipoReferenciaProva.Nenhuma || !string.IsNullOrWhiteSpace(Referencia), "Informe a referência exigida por esta prova.");
        Exigir(Referencia is null || Referencia.Length <= 500, "A referência deve ter até 500 caracteres.");
        var semHorario = Data is null && HoraInicio is null && HoraFim is null;
        var horarioCompleto = Data is not null && HoraInicio is not null && HoraFim is not null && HoraFim > HoraInicio;
        Exigir(semHorario || horarioCompleto, "Informe data, início e fim válidos ou deixe o horário em branco.");
    }

    public bool Elegivel(DateOnly nascimento, DateOnly dataBase)
    {
        var faixa = FaixaEtaria(nascimento, dataBase);
        if (faixa is null) return false;
        return Categorias.Any(x => x.Categoria == CategoriaCompeticao.Livre || x.Categoria.ToString() == faixa);
    }
}

public sealed class CategoriaProvaCompeticao : Entidade
{
    public Guid ProvaCompeticaoId { get; set; }
    public CategoriaCompeticao Categoria { get; set; }
}

public sealed class EscalacaoProva : Entidade
{
    public Guid ProvaCompeticaoId { get; set; }
    public SituacaoEscalacao Situacao { get; set; } = SituacaoEscalacao.Rascunho;
    public List<ParticipanteEscalacao> Participantes { get; set; } = [];
    public List<AlteracaoEscalacao> Alteracoes { get; set; } = [];

    public void SubstituirParticipantes(IEnumerable<(Guid PessoaId, FuncaoEscalacao Funcao)> participantes, ProvaCompeticao configuracao)
    {
        Exigir(Situacao == SituacaoEscalacao.Rascunho, "Reabra a escalação antes de alterá-la.");
        var lista = participantes.ToList();
        Exigir(lista.All(x => x.PessoaId != Guid.Empty && Enum.IsDefined(x.Funcao)) && lista.Select(x => x.PessoaId).Distinct().Count() == lista.Count,
            "Participantes da escalação são inválidos ou repetidos.");
        Exigir(lista.Count <= configuracao.MaximoParticipantes, "O total de titulares e reservas excede o máximo da prova.");
        Exigir(lista.Count(x => x.Funcao == FuncaoEscalacao.Reserva) <= configuracao.MaximoReservas, "A quantidade de reservas excede o máximo da prova.");
        Participantes.Clear();
        Participantes.AddRange(lista.Select(x => new ParticipanteEscalacao { IgrejaId = IgrejaId, EscalacaoProvaId = Id, PessoaId = x.PessoaId, Funcao = x.Funcao }));
    }

    public void Finalizar(ProvaCompeticao configuracao, Guid autor)
    {
        Exigir(Situacao == SituacaoEscalacao.Rascunho, "A escalação já está finalizada.");
        var titulares = Participantes.Count(x => x.Funcao == FuncaoEscalacao.Titular);
        Exigir(titulares >= configuracao.MinimoTitulares, "A escalação não possui o mínimo de titulares.");
        Exigir(configuracao.QuantidadeExataTitulares is null || titulares == configuracao.QuantidadeExataTitulares, "A escalação não possui a quantidade exata de titulares.");
        Exigir(Participantes.Count <= configuracao.MaximoParticipantes, "O total de titulares e reservas excede o máximo da prova.");
        Exigir(Participantes.Count(x => x.Funcao == FuncaoEscalacao.Reserva) <= configuracao.MaximoReservas, "A quantidade de reservas excede o máximo da prova.");
        Situacao = SituacaoEscalacao.Finalizada;
        Alteracoes.Add(new AlteracaoEscalacao { IgrejaId = IgrejaId, EscalacaoProvaId = Id, Tipo = TipoAlteracaoEscalacao.Finalizacao, RegistradoPor = autor });
    }

    public void Reabrir(Guid autor, string motivo)
    {
        Exigir(Situacao == SituacaoEscalacao.Finalizada && !string.IsNullOrWhiteSpace(motivo) && motivo.Length <= 500, "Informe um motivo válido para reabrir a escalação finalizada.");
        Situacao = SituacaoEscalacao.Rascunho;
        Alteracoes.Add(new AlteracaoEscalacao { IgrejaId = IgrejaId, EscalacaoProvaId = Id, Tipo = TipoAlteracaoEscalacao.Reabertura, RegistradoPor = autor, Motivo = motivo.Trim() });
    }
}

public sealed class ParticipanteEscalacao : Entidade
{
    public Guid EscalacaoProvaId { get; set; }
    public Guid PessoaId { get; set; }
    public FuncaoEscalacao Funcao { get; set; }
}

public sealed class AlteracaoEscalacao : Entidade
{
    public Guid EscalacaoProvaId { get; set; }
    public TipoAlteracaoEscalacao Tipo { get; set; }
    public Guid RegistradoPor { get; set; }
    public string? Motivo { get; set; }
}
