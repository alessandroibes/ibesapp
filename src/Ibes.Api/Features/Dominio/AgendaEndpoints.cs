using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Ibes.AgendaAtividades;
using Ibes.Frequencia;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Api.Features.Dominio;

public static class AgendaEndpoints
{
    public static void MapAgenda(this WebApplication app)
    {
        var g = app.MapGroup("/api/v1/agenda").WithTags("Agenda").AddEndpointFilter<ValidacaoFilter>();
        g.MapGet("/cadastros", async (AppDbContext db, CancellationToken ct) => TypedResults.Ok(new CadastrosAgendaResponse(
            await db.Set<EntidadePromotora>().OrderBy(x => x.Nome).Select(x => new NomeAgendaResponse(x.Id, x.Versao, x.Nome)).ToListAsync(ct),
            await db.Set<TipoAtividade>().OrderBy(x => x.Nome).Select(x => new NomeAgendaResponse(x.Id, x.Versao, x.Nome)).ToListAsync(ct),
            (await db.Set<ModeloReuniao>().OrderBy(x => x.Nome).ToListAsync(ct)).Select(x => new ModeloResponse(x.Id, x.Versao, x.Nome, JsonSerializer.Deserialize<List<ItemRoteiro>>(x.ItensJson)!)).ToList())))
            .RequireAuthorization(Permissoes.ConsultarAgenda);
        g.MapPost("/promotoras", async (NomeAgendaRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var e = new EntidadePromotora { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim() }; db.Add(e); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(e.Id, e.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapPost("/tipos", async (NomeAgendaRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var e = new TipoAtividade { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim() }; db.Add(e); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(e.Id, e.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapPost("/modelos", async (ModeloRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            ValidarItens(r.Itens); var e = new ModeloReuniao { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim(), ItensJson = JsonSerializer.Serialize(r.Itens) };
            db.Add(e); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(e.Id, e.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapPut("/modelos/{id:guid}", async (Guid id, ModeloRequest r, AppDbContext db, CancellationToken ct) =>
        {
            var e = await db.Set<ModeloReuniao>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            ValidarItens(r.Itens); Operacao.ConferirVersao(e, r.Versao ?? Guid.Empty); e.Nome = r.Nome.Trim(); e.ItensJson = JsonSerializer.Serialize(r.Itens);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(e.Id, e.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapPost("/atividades", async (AtividadeRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var a = r.Entidade(tenant.IgrejaId); a.Validar(); await ValidarVinculos(a, db, ct); db.Add(a); await db.SaveChangesAsync(ct);
            return TypedResults.Ok(new IdResponse(a.Id, a.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapGet("/atividades/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var a = await db.Set<AtividadeAgenda>().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            return TypedResults.Ok(new AtividadeDetalheResponse(a.Id, a.Versao, AtividadeRequest.De(a)));
        }).RequireAuthorization(Permissoes.ConsultarAgenda);
        g.MapGet("/", async (DateOnly inicio, DateOnly fim, Guid? promotoraId, Guid? tipoId, int? situacao, AppDbContext db, CancellationToken ct) =>
        {
            Exigir(inicio != default && fim >= inicio && fim.DayNumber - inicio.DayNumber <= 366, "Consulte até 366 dias.");
            Exigir(situacao is null || Enum.IsDefined((SituacaoAtividade)situacao), "Situação inválida.");
            var query = db.Set<AtividadeAgenda>().AsNoTracking().Where(a => a.DataInicio <= fim);
            if (promotoraId is not null) query = query.Where(a => a.EntidadePromotoraId == promotoraId);
            if (tipoId is not null) query = query.Where(a => a.TipoAtividadeId == tipoId);
            // Exceções podem trazer para o intervalo uma ocorrência cuja série começa mais tarde.
            var movidas = await db.Set<ExcecaoAgenda>().AsNoTracking().Where(e => e.DataInicio <= fim && e.DataFim >= inicio).Select(e => e.AtividadeAgendaId).Distinct().ToListAsync(ct);
            var adicionais = db.Set<AtividadeAgenda>().AsNoTracking().Where(a => movidas.Contains(a.Id));
            if (promotoraId is not null) adicionais = adicionais.Where(a => a.EntidadePromotoraId == promotoraId);
            if (tipoId is not null) adicionais = adicionais.Where(a => a.TipoAtividadeId == tipoId);
            var atividades = await query.Union(adicionais).Take(1001).ToListAsync(ct);
            Exigir(atividades.Count <= 1000, "Muitas séries. Refine os filtros.");
            var ids = atividades.Select(a => a.Id).ToArray();
            var excecoes = await db.Set<ExcecaoAgenda>().AsNoTracking().Where(e => ids.Contains(e.AtividadeAgendaId)).ToListAsync(ct);
            var reunioes = await db.Set<Reuniao>().AsNoTracking().Where(r => ids.Contains(r.AtividadeAgendaId)).ToListAsync(ct);
            var promotoras = await db.Set<EntidadePromotora>().AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Nome, ct);
            var tipos = await db.Set<TipoAtividade>().AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Nome, ct);
            var lista = new List<OcorrenciaResponse>();
            foreach (var a in atividades)
            {
                var datas = a.DatasEntre(inicio, fim).Concat(excecoes.Where(e => e.AtividadeAgendaId == a.Id && e.DataInicio <= fim && e.DataFim >= inicio).Select(e => e.DataOriginal)).Distinct();
                foreach (var data in datas)
                {
                    if (!a.OcorreEm(data)) continue;
                    var e = excecoes.SingleOrDefault(e => e.AtividadeAgendaId == a.Id && e.DataOriginal == data);
                    var o = Ocorrencia(a, data, e, reunioes.SingleOrDefault(r => r.AtividadeAgendaId == a.Id && r.DataOriginal == data)?.Id, promotoras[a.EntidadePromotoraId], tipos[a.TipoAtividadeId]);
                    if (o.DataInicio <= fim && o.DataFim >= inicio && (situacao is null || o.Situacao == situacao)) lista.Add(o);
                    Exigir(lista.Count <= 5000, "Muitas ocorrências. Reduza o intervalo ou filtre a agenda.");
                }
            }
            return TypedResults.Ok(lista.OrderBy(o => o.DataInicio).ThenBy(o => o.HoraInicio).ThenBy(o => o.Titulo).ToList());
        }).RequireAuthorization(Permissoes.ConsultarAgenda);
        g.MapPut("/atividades/{id:guid}/ocorrencias/{data}", async (Guid id, DateOnly data, ExcecaoRequest r, AppDbContext db, Relogio relogio, TenantContext tenant, CancellationToken ct) =>
        {
            var a = await db.Set<AtividadeAgenda>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(a.OcorreEm(data), "Ocorrência inexistente."); Operacao.ConferirVersao(a, r.Versao);
            var e = await db.Set<ExcecaoAgenda>().SingleOrDefaultAsync(x => x.AtividadeAgendaId == id && x.DataOriginal == data, ct);
            var anterior = Ocorrencia(a, data, e, null, "", "");
            var teste = AtividadeRequest.De(a).Entidade(a.IgrejaId); teste.Periodicidade = null;
            teste.DataInicio = r.DataInicio; teste.DataFim = r.DataFim; teste.HoraInicio = r.HoraInicio; teste.HoraFim = r.HoraFim; teste.Situacao = (SituacaoAtividade)r.Situacao; teste.Validar();
            var reuniao = await db.Set<Reuniao>().SingleOrDefaultAsync(x => x.AtividadeAgendaId == id && x.DataOriginal == data, ct);
            var mudouHorario = anterior.DataInicio != r.DataInicio || anterior.DataFim != r.DataFim || anterior.HoraInicio != r.HoraInicio || anterior.HoraFim != r.HoraFim;
            Exigir(!mudouHorario || anterior.DataFim >= relogio.Hoje && (reuniao is null || !await db.Set<RegistroFrequencia>().AnyAsync(f => f.ReuniaoId == reuniao.Id, ct)), "Não é possível remarcar reunião realizada ou com frequência. O cancelamento preserva os registros.");
            if (e is null) { e = new ExcecaoAgenda { IgrejaId = tenant.IgrejaId, AtividadeAgendaId = id, DataOriginal = data }; db.Add(e); }
            e.DataInicio = r.DataInicio; e.DataFim = r.DataFim; e.HoraInicio = r.HoraInicio; e.HoraFim = r.HoraFim; e.Situacao = (SituacaoAtividade)r.Situacao; e.Observacoes = r.Observacoes;
            if (reuniao is not null && mudouHorario) reuniao.Data = r.DataInicio;
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(a.Id, a.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapPost("/atividades/{id:guid}/alteracoes-futuras", async (Guid id, AlteracaoSerieRequest r, AppDbContext db, Relogio relogio, TenantContext tenant, CancellationToken ct) =>
        {
            var a = await db.Set<AtividadeAgenda>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(a.Periodicidade is not null && r.APartirDe > relogio.Hoje && a.OcorreEm(r.APartirDe), "Escolha uma ocorrência futura da série.");
            Exigir(!await db.Set<Reuniao>().AnyAsync(x => x.AtividadeAgendaId == id && x.DataOriginal >= r.APartirDe, ct), "Há reuniões preparadas nesse trecho. Altere as ocorrências individualmente ou escolha um trecho posterior.");
            Exigir(!await db.Set<ExcecaoAgenda>().AnyAsync(x => x.AtividadeAgendaId == id && x.DataOriginal >= r.APartirDe, ct), "Há exceções nesse trecho. Preserve-as escolhendo uma data posterior.");
            Operacao.ConferirVersao(a, r.Versao); var nova = r.Dados.Entidade(tenant.IgrejaId); nova.Validar();
            Exigir(nova.DataInicio >= r.APartirDe, "A nova série deve começar no trecho futuro."); await ValidarVinculos(nova, db, ct);
            a.SerieEncerradaEm = r.APartirDe.AddDays(-1); db.Add(nova); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(nova.Id, nova.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapPost("/atividades/{id:guid}/ocorrencias/{data}/reuniao", async (Guid id, DateOnly data, PrepararReuniaoRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var a = await db.Set<AtividadeAgenda>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(a.OcorreEm(data) && !a.Prazo, "Escolha uma ocorrência de atividade, não um prazo."); Operacao.ConferirVersao(a, r.Versao);
            var e = await db.Set<ExcecaoAgenda>().SingleOrDefaultAsync(x => x.AtividadeAgendaId == id && x.DataOriginal == data, ct);
            ModeloReuniao? modelo = null;
            if (r.ModeloId is { } modeloId) modelo = await db.Set<ModeloReuniao>().SingleOrDefaultAsync(x => x.Id == modeloId, ct) ?? throw new RegistroNaoEncontradoException();
            var reuniao = new Reuniao { IgrejaId = tenant.IgrejaId, AtividadeAgendaId = id, DataOriginal = data, Data = e?.DataInicio ?? data, Titulo = a.Titulo, ModeloReuniaoId = modelo?.Id, VersaoModelo = modelo?.Versao, RoteiroJson = modelo?.ItensJson ?? "[]" };
            db.Add(reuniao); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(reuniao.Id, reuniao.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
    }
    public static void ValidarItens(List<ItemRoteiro>? itens) => Exigir(itens is { Count: <= 100 } && itens.All(i => i is not null && !string.IsNullOrWhiteSpace(i.Titulo) && i.Titulo.Length <= 200 && (i.DuracaoMinutos is null || i.DuracaoMinutos is >= 0 and <= 1440) && (i.Observacoes?.Length ?? 0) <= 1000), "Roteiro inválido: use até 100 itens com título, duração e observações válidas.");
    private static async Task ValidarVinculos(AtividadeAgenda a, AppDbContext db, CancellationToken ct)
    {
        if (!await db.Set<TipoAtividade>().AnyAsync(x => x.Id == a.TipoAtividadeId, ct) || !await db.Set<EntidadePromotora>().AnyAsync(x => x.Id == a.EntidadePromotoraId, ct)
            || a.ResponsavelId is { } pessoa && !await db.Set<Pessoa>().AnyAsync(x => x.Id == pessoa, ct)
            || a.AtividadeRelacionadaId is { } relacionada && !await db.Set<AtividadeAgenda>().AnyAsync(x => x.Id == relacionada, ct)) throw new RegistroNaoEncontradoException();
    }
    private static OcorrenciaResponse Ocorrencia(AtividadeAgenda a, DateOnly data, ExcecaoAgenda? e, Guid? reuniao, string promotora, string tipo) => new(a.Id, a.Versao, data, a.Titulo,
        e?.DataInicio ?? data, e?.DataFim ?? data.AddDays(a.DataFim.DayNumber - a.DataInicio.DayNumber), e is null ? a.HoraInicio : e.HoraInicio, e is null ? a.HoraFim : e.HoraFim,
        a.DiaInteiro, a.FusoHorario, (int)(e?.Situacao ?? a.Situacao), a.Local, e?.Observacoes ?? a.Observacoes, promotora, tipo, a.Prazo, a.Destaque, a.Valor, a.Moeda, a.Link, a.AtividadeRelacionadaId, reuniao, a.Periodicidade is not null);
}
public sealed record NomeAgendaRequest([property: Required, StringLength(100)] string Nome);
public sealed record NomeAgendaResponse(Guid Id, Guid Versao, string Nome);
public sealed record ModeloRequest([property: Required, StringLength(200)] string Nome, List<ItemRoteiro> Itens, Guid? Versao);
public sealed record ModeloResponse(Guid Id, Guid Versao, string Nome, List<ItemRoteiro> Itens);
public sealed record CadastrosAgendaResponse(List<NomeAgendaResponse> Promotoras, List<NomeAgendaResponse> Tipos, List<ModeloResponse> Modelos);
public sealed record AtividadeRequest([property: Required, StringLength(200)] string Titulo, Guid TipoAtividadeId, Guid EntidadePromotoraId,
    DateOnly DataInicio, DateOnly DataFim, TimeOnly? HoraInicio, TimeOnly? HoraFim, bool DiaInteiro, int Situacao,
    int? Periodicidade, int Intervalo, int[]? DiasSemana, DateOnly? RecorrenciaAte,
    [property: StringLength(500)] string? Local, [property: StringLength(4000)] string? Observacoes, bool Prazo, bool Destaque,
    decimal? Valor, [property: StringLength(10)] string? Moeda, [property: StringLength(2000)] string? Link,
    Guid? ResponsavelId, Guid? AtividadeRelacionadaId, [property: Required, StringLength(100)] string FusoHorario)
{
    public AtividadeAgenda Entidade(Guid igreja) => new()
    {
        IgrejaId = igreja,
        Titulo = Titulo.Trim(),
        TipoAtividadeId = TipoAtividadeId,
        EntidadePromotoraId = EntidadePromotoraId,
        DataInicio = DataInicio,
        DataFim = DataFim,
        HoraInicio = HoraInicio,
        HoraFim = HoraFim,
        DiaInteiro = DiaInteiro,
        Situacao = (SituacaoAtividade)Situacao,
        Periodicidade = (Periodicidade?)Periodicidade,
        Intervalo = Intervalo,
        DiasSemana = DiasSemana ?? [],
        RecorrenciaAte = RecorrenciaAte,
        Local = Local,
        Observacoes = Observacoes,
        Prazo = Prazo,
        Destaque = Destaque,
        Valor = Valor,
        Moeda = Moeda,
        Link = Link,
        ResponsavelId = ResponsavelId,
        AtividadeRelacionadaId = AtividadeRelacionadaId,
        FusoHorario = FusoHorario
    };
    public static AtividadeRequest De(AtividadeAgenda a) => new(a.Titulo, a.TipoAtividadeId, a.EntidadePromotoraId, a.DataInicio, a.DataFim, a.HoraInicio, a.HoraFim, a.DiaInteiro, (int)a.Situacao,
        (int?)a.Periodicidade, a.Intervalo, a.DiasSemana, a.RecorrenciaAte, a.Local, a.Observacoes, a.Prazo, a.Destaque, a.Valor, a.Moeda, a.Link, a.ResponsavelId, a.AtividadeRelacionadaId, a.FusoHorario);
}
public sealed record AtividadeDetalheResponse(Guid Id, Guid Versao, AtividadeRequest Dados);
public sealed record ExcecaoRequest(Guid Versao, DateOnly DataInicio, DateOnly DataFim, TimeOnly? HoraInicio, TimeOnly? HoraFim, int Situacao, [property: StringLength(4000)] string? Observacoes);
public sealed record AlteracaoSerieRequest(Guid Versao, DateOnly APartirDe, [property: Required] AtividadeRequest Dados);
public sealed record PrepararReuniaoRequest(Guid Versao, Guid? ModeloId);
public sealed record OcorrenciaResponse(Guid AtividadeId, Guid Versao, DateOnly DataOriginal, string Titulo, DateOnly DataInicio, DateOnly DataFim, TimeOnly? HoraInicio, TimeOnly? HoraFim,
    bool DiaInteiro, string FusoHorario, int Situacao, string? Local, string? Observacoes, string Promotora, string Tipo, bool Prazo, bool Destaque,
    decimal? Valor, string? Moeda, string? Link, Guid? AtividadeRelacionadaId, Guid? ReuniaoId, bool Recorrente);
