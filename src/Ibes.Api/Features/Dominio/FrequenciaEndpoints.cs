using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Ibes.AgendaAtividades;
using Ibes.Frequencia;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Progressao;
using Microsoft.EntityFrameworkCore;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Api.Features.Dominio;

public static class FrequenciaEndpoints
{
    public static void MapFrequencia(this WebApplication app)
    {
        var g = app.MapGroup("/api/v1/reunioes").WithTags("Reuniões e frequência").AddEndpointFilter<ValidacaoFilter>();
        g.MapGet("/", async (DateOnly inicio, DateOnly fim, AppDbContext db, CancellationToken ct) =>
        {
            Exigir(inicio != default && fim >= inicio && fim.DayNumber - inicio.DayNumber <= 366, "Consulte até 366 dias.");
            return TypedResults.Ok(await db.Set<Reuniao>().Where(r => r.Data >= inicio && r.Data <= fim).OrderBy(r => r.Data).Select(r => new ReuniaoResumo(r.Id, r.Titulo, r.Data)).ToListAsync(ct));
        }).RequireAuthorization(Permissoes.ConsultarFrequencia);
        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var r = await db.Set<Reuniao>().AsNoTracking().SingleOrDefaultAsync(r => r.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var a = await db.Set<AtividadeAgenda>().SingleAsync(a => a.Id == r.AtividadeAgendaId, ct);
            var excecao = await db.Set<ExcecaoAgenda>().SingleOrDefaultAsync(e => e.AtividadeAgendaId == a.Id && e.DataOriginal == r.DataOriginal, ct);
            return TypedResults.Ok(new ReuniaoResponse(r.Id, r.Versao, r.Titulo, r.Data, (int)(excecao?.Situacao ?? a.Situacao), r.ModeloReuniaoId, r.VersaoModelo, JsonSerializer.Deserialize<List<ItemRoteiro>>(r.RoteiroJson)!));
        }).RequireAuthorization(Permissoes.ConsultarFrequencia);
        g.MapPut("/{id:guid}/roteiro", async (Guid id, RoteiroRequest request, AppDbContext db, CancellationToken ct) =>
        {
            var r = await db.Set<Reuniao>().SingleOrDefaultAsync(r => r.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            AgendaEndpoints.ValidarItens(request.Itens); Operacao.ConferirVersao(r, request.Versao); r.RoteiroJson = JsonSerializer.Serialize(request.Itens); await db.SaveChangesAsync(ct);
            return TypedResults.Ok(new IdResponse(r.Id, r.Versao));
        }).RequireAuthorization(Permissoes.EditarAgenda);
        g.MapGet("/{id:guid}/chamada", async (Guid id, string? busca, int? pagina, AppDbContext db, CancellationToken ct) =>
        {
            var r = await db.Set<Reuniao>().SingleOrDefaultAsync(r => r.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir((pagina ?? 1) is >= 1 and <= 10000 && (busca?.Length ?? 0) <= 100, "Busca inválida.");
            var query = db.Set<Pessoa>().AsNoTracking();
            query = query.Where(p => p.Ativa || db.Set<RegistroFrequencia>().Any(f => f.PessoaId == p.Id && f.ReuniaoId == id));
            if (!string.IsNullOrWhiteSpace(busca)) query = query.Where(p => p.Nome.Contains(busca));
            else query = query.Where(p => db.Set<JornadaEmbaixador>().Any(j => j.PessoaId == p.Id) || db.Set<RegistroFrequencia>().Any(f => f.PessoaId == p.Id && f.ReuniaoId == id));
            var total = await query.CountAsync(ct);
            var pessoas = await query.OrderBy(p => p.Nome).ThenBy(p => p.Id).Skip(((pagina ?? 1) - 1) * 30).Take(30).ToListAsync(ct);
            var ids = pessoas.Select(p => p.Id).ToArray();
            var frequencias = await db.Set<RegistroFrequencia>().Where(f => f.ReuniaoId == id && ids.Contains(f.PessoaId)).ToListAsync(ct);
            var jornadas = await db.Set<JornadaEmbaixador>().Include(j => j.Postos).Where(j => ids.Contains(j.PessoaId)).ToListAsync(ct);
            var totais = await db.Set<RegistroFrequencia>().Where(f => f.ReuniaoId == id).GroupBy(f => f.Situacao).Select(x => new { Situacao = x.Key, Quantidade = x.Count() }).ToListAsync(ct);
            var contagens = totais.Select(x => new ContagemFrequencia((int)x.Situacao, x.Quantidade)).ToList();
            return TypedResults.Ok(new ChamadaResponse(r.Id, r.Versao, total, pessoas.Select(p =>
            {
                var f = frequencias.SingleOrDefault(f => f.PessoaId == p.Id); var j = jornadas.SingleOrDefault(j => j.PessoaId == p.Id);
                return new PessoaChamada(p.Id, p.Nome, p.DataNascimento is { } nascimento ? j?.Situacao(nascimento, r.Data) ?? "Visitante" : "Visitante", f?.Id, f?.Versao, f is null ? null : (int)f.Situacao, f?.Observacoes);
            }).ToList(), contagens));
        }).RequireAuthorization(Permissoes.ConsultarFrequencia);
        g.MapPut("/{id:guid}/frequencia/{pessoaId:guid}", async (Guid id, Guid pessoaId, FrequenciaRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var r = await db.Set<Reuniao>().SingleOrDefaultAsync(r => r.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == pessoaId, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(r.Data <= relogio.Hoje && (pessoa.DataNascimento is null || r.Data >= pessoa.DataNascimento), "Frequência exige reunião ocorrida e data compatível com o nascimento.");
            Exigir(Enum.IsDefined((SituacaoFrequencia)request.Situacao), "Situação de frequência inválida.");
            var f = await db.Set<RegistroFrequencia>().SingleOrDefaultAsync(f => f.ReuniaoId == id && f.PessoaId == pessoaId, ct);
            // A versão da reunião serializa remarcações concorrentes; a frequência possui versão própria.
            r.Versao = Guid.NewGuid();
            var anterior = f?.Situacao;
            if (f is null)
            {
                Exigir(request.Versao is null, "A frequência ainda não possui lançamento.");
                f = new RegistroFrequencia { IgrejaId = tenant.IgrejaId, ReuniaoId = id, PessoaId = pessoaId }; db.Add(f);
            }
            else Operacao.ConferirVersao(f, request.Versao ?? Guid.Empty);
            f.Situacao = (SituacaoFrequencia)request.Situacao; f.Observacoes = request.Observacoes; f.RegistradoPor = tenant.UsuarioId!.Value;
            db.Add(new AlteracaoFrequencia { IgrejaId = tenant.IgrejaId, RegistroFrequenciaId = f.Id, SituacaoAnterior = anterior, Situacao = f.Situacao, Observacoes = request.Observacoes, RegistradoPor = tenant.UsuarioId.Value });
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(f.Id, f.Versao));
        }).RequireAuthorization(Permissoes.RegistrarFrequencia);
        g.MapPost("/{id:guid}/visitantes", async (Guid id, VisitanteRequest request, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            if (!await db.Set<Reuniao>().AnyAsync(r => r.Id == id, ct)) throw new RegistroNaoEncontradoException();
            var pessoa = new Pessoa { IgrejaId = tenant.IgrejaId, Nome = request.Nome.Trim() }; db.Add(pessoa); await db.SaveChangesAsync(ct);
            return TypedResults.Ok(new IdResponse(pessoa.Id, pessoa.Versao));
        }).RequireAuthorization(Permissoes.RegistrarFrequencia);
        g.MapGet("/{id:guid}/frequencia/{pessoaId:guid}/historico", async (Guid id, Guid pessoaId, AppDbContext db, CancellationToken ct) =>
        {
            var f = await db.Set<RegistroFrequencia>().SingleOrDefaultAsync(f => f.ReuniaoId == id && f.PessoaId == pessoaId, ct) ?? throw new RegistroNaoEncontradoException();
            var historico = await db.Set<AlteracaoFrequencia>().Where(a => a.RegistroFrequenciaId == f.Id).OrderBy(a => a.CreatedAt).ToListAsync(ct);
            return TypedResults.Ok(historico.Select(a => new AlteracaoFrequenciaResponse(a.Id, (int?)a.SituacaoAnterior, (int)a.Situacao, a.Observacoes, a.RegistradoPor, a.CreatedAt)).ToList());
        }).RequireAuthorization(Permissoes.ConsultarFrequencia);
        app.MapGet("/api/v1/pessoas/{id:guid}/frequencia", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            if (!await db.Set<Pessoa>().AnyAsync(p => p.Id == id, ct)) throw new RegistroNaoEncontradoException();
            var frequencias = await (from f in db.Set<RegistroFrequencia>()
                                     join r in db.Set<Reuniao>() on f.ReuniaoId equals r.Id
                                     where f.PessoaId == id
                                     orderby r.Data descending
                                     select new { r.Id, r.Titulo, r.Data, f.Situacao }).Take(500).ToListAsync(ct);
            return TypedResults.Ok(frequencias.Select(f => new FrequenciaPessoaResponse(f.Id, f.Titulo, f.Data, (int)f.Situacao)).ToList());
        }).RequireAuthorization(Permissoes.ConsultarFrequencia).WithTags("Reuniões e frequência");
    }
    public static Task<DateOnly?> PrimeiraReuniao(AppDbContext db, Guid pessoaId, CancellationToken ct) =>
        (from f in db.Set<RegistroFrequencia>()
         join r in db.Set<Reuniao>() on f.ReuniaoId equals r.Id
         where f.PessoaId == pessoaId && (f.Situacao == SituacaoFrequencia.PresencaComPontualidade || f.Situacao == SituacaoFrequencia.PresencaComAtraso)
         select (DateOnly?)r.Data).MinAsync(ct);
}
public sealed record ReuniaoResumo(Guid Id, string Titulo, DateOnly Data);
public sealed record ReuniaoResponse(Guid Id, Guid Versao, string Titulo, DateOnly Data, int Situacao, Guid? ModeloId, Guid? VersaoModelo, List<ItemRoteiro> Roteiro);
public sealed record RoteiroRequest(Guid Versao, List<ItemRoteiro> Itens);
public sealed record FrequenciaRequest(Guid? Versao, int Situacao, [property: StringLength(1000)] string? Observacoes);
public sealed record VisitanteRequest([property: Required, StringLength(200)] string Nome);
public sealed record PessoaChamada(Guid PessoaId, string Nome, string Condicao, Guid? FrequenciaId, Guid? Versao, int? Situacao, string? Observacoes);
public sealed record ChamadaResponse(Guid ReuniaoId, Guid Versao, int Total, List<PessoaChamada> Pessoas, List<ContagemFrequencia> Contagens);
public sealed record ContagemFrequencia(int Situacao, int Quantidade);
public sealed record AlteracaoFrequenciaResponse(Guid Id, int? SituacaoAnterior, int Situacao, string? Observacoes, Guid RegistradoPor, DateTimeOffset CreatedAt);
public sealed record FrequenciaPessoaResponse(Guid ReuniaoId, string Titulo, DateOnly Data, int Situacao);
