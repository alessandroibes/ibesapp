using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Progressao;
using Microsoft.EntityFrameworkCore;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Api.Features.Dominio;

public static class ProgressaoEndpoints
{
    private static IQueryable<JornadaEmbaixador> Jornadas(AppDbContext db) => db.Set<JornadaEmbaixador>()
        .Include(j => j.Requisitos).Include(j => j.Postos).ThenInclude(p => p.Tarefas).Include(j => j.Cerimonias).AsSplitQuery();

    public static void MapProgressao(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/v1").AddEndpointFilter<ValidacaoFilter>().WithTags("Progressão");
        grupo.MapGet("/manuais", async (AppDbContext db, CancellationToken ct) =>
        {
            var manuais = await db.Set<Manual>().AsNoTracking().ToListAsync(ct);
            var versoes = await db.Set<VersaoManual>().AsNoTracking().Include(v => v.Tarefas).ToListAsync(ct);
            return TypedResults.Ok(versoes.Select(v => new ManualResponse(v.Id, (int)manuais.Single(m => m.Id == v.ManualId).Posto,
                Catalogo.Nome(manuais.Single(m => m.Id == v.ManualId).Posto), v.Identificacao,
                v.Tarefas.OrderBy(t => t.OrdemExibicao).Select(t => new TarefaResponse(t.Id, t.Nome)).ToList())).ToList());
        }).RequireAuthorization(Permissoes.ConsultarProgressao).WithName("ListarVersoesManuais");
        grupo.MapGet("/manuais/tarefas-conhecidas", () =>
        {
            using var stream = typeof(Manual).Assembly.GetManifestResourceStream("Ibes.Progressao.tarefas-conhecidas.json")!;
            return TypedResults.Ok(JsonSerializer.Deserialize<Dictionary<string, string[]>>(stream)!);
        }).RequireAuthorization(Permissoes.GerenciarManuais).WithName("ConsultarTarefasConhecidas");
        grupo.MapPost("/manuais/versoes", async (ManualRequest request, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            Exigir(request.Posto is >= 1 and <= 3, "O manual do Emérito ainda não foi definido.");
            Exigir(request.Tarefas is { Count: > 0 and <= 200 } && request.Tarefas.All(t => !string.IsNullOrWhiteSpace(t) && t.Length <= 500), "Informe tarefas válidas para a versão do manual.");
            Exigir(request.Tarefas!.Select(t => t.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Count() == request.Tarefas.Count, "Há tarefas duplicadas nesta versão.");
            var manual = await db.Set<Manual>().SingleOrDefaultAsync(m => m.Posto == (Posto)request.Posto, ct);
            if (manual is null) { manual = new Manual { IgrejaId = tenant.IgrejaId, Posto = (Posto)request.Posto }; db.Add(manual); }
            var versao = new VersaoManual { IgrejaId = tenant.IgrejaId, ManualId = manual.Id, Identificacao = request.Identificacao.Trim() };
            versao.Tarefas = request.Tarefas.Select((t, i) => new TarefaManual { IgrejaId = tenant.IgrejaId, VersaoManualId = versao.Id, Nome = t.Trim(), OrdemExibicao = i }).ToList();
            db.Add(versao); await db.SaveChangesAsync(ct); return TypedResults.Created("/api/v1/manuais", new IdResponse(versao.Id, versao.Versao));
        }).RequireAuthorization(Permissoes.GerenciarManuais).WithName("CadastrarVersaoManual");
        grupo.MapPost("/pessoas/{id:guid}/candidatura", async (Guid id, VersaoRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct);
            if (pessoa is null) return Results.NotFound();
            Exigir(pessoa.Ativa, "Uma pessoa inativa não pode iniciar uma candidatura.");
            Exigir(pessoa.DataNascimento is { } nascimento && Idade(nascimento, relogio.Hoje) >= 9, "Informe data de nascimento compatível com a jornada ER.");
            Operacao.ConferirVersao(pessoa, request.Versao);
            Exigir(!await db.Set<JornadaEmbaixador>().AnyAsync(j => j.PessoaId == id, ct), "A pessoa já possui uma trajetória.");
            var jornada = new JornadaEmbaixador { IgrejaId = tenant.IgrejaId, PessoaId = id }; db.Add(jornada);
            await db.SaveChangesAsync(ct); return Results.Ok(new IdResponse(jornada.Id, jornada.Versao));
        }).RequireAuthorization(Permissoes.RegistrarProgressao).Produces<IdResponse>().WithName("RegistrarCandidatura");
        grupo.MapGet("/pessoas/{id:guid}/jornada", async (Guid id, DateOnly? dataBase, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().AsNoTracking().SingleOrDefaultAsync(p => p.Id == id, ct);
            if (pessoa is null) return Results.NotFound();
            var jornada = await Jornadas(db).AsNoTracking().SingleOrDefaultAsync(j => j.PessoaId == id, ct);
            if (jornada is null) return Results.NotFound();
            var data = dataBase ?? relogio.Hoje;
            Exigir(data >= pessoa.DataNascimento && data <= relogio.Hoje, "Data-base inválida.");
            var versoesIds = jornada.Postos.Where(p => p.VersaoManualId != null).Select(p => p.VersaoManualId!.Value).ToArray();
            var versoes = await db.Set<VersaoManual>().AsNoTracking().Include(v => v.Tarefas).Where(v => versoesIds.Contains(v.Id)).ToListAsync(ct);
            var requisitos = Enum.GetValues<RequisitoMinimo>().Select(r => new RequisitoResponse((int)r, Catalogo.Nome(r), jornada.Requisitos.SingleOrDefault(c => c.Requisito == r)?.DataConclusao)).ToList();
            var postos = jornada.Postos.OrderBy(p => p.DataIngresso).ThenBy(p => p.Posto).Select(p =>
            {
                var manual = versoes.SingleOrDefault(v => v.Id == p.VersaoManualId);
                return new PostoResponse(p.Id, (int)p.Posto, Catalogo.Nome(p.Posto), p.DataIngresso, p.DataConclusao,
                    p.VersaoManualId, manual?.Identificacao, p.DataIngresso.AddMonths(jornada.MesesPermanencia!.Value),
                    manual?.Tarefas.OrderBy(t => t.OrdemExibicao).Select(t => new TarefaJornadaResponse(t.Id, t.Nome, p.Tarefas.SingleOrDefault(c => c.TarefaManualId == t.Id)?.DataConclusao)).ToList() ?? []);
            }).ToList();
            return Results.Ok(new JornadaResponse(jornada.Id, jornada.Versao, jornada.Situacao(pessoa.DataNascimento!.Value, data),
                FaixaEtaria(pessoa.DataNascimento.Value, data), data, jornada.MesesPermanencia,
                jornada.Postos.Count == 0 && requisitos.All(r => r.DataConclusao <= data) && requisitos.All(r => r.DataConclusao != null) && Idade(pessoa.DataNascimento.Value, data) is >= 9 and < 18,
                requisitos, postos, jornada.Cerimonias.OrderBy(c => c.Data).Select(c => new CerimoniaResponse(c.Id, c.JornadaPostoId, c.Data, c.Descricao)).ToList()));
        }).RequireAuthorization(Permissoes.ConsultarProgressao).Produces<JornadaResponse>().WithName("ConsultarJornada");
        grupo.MapPost("/pessoas/{id:guid}/jornada/requisitos", async (Guid id, ConcluirRequisitoRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var (pessoa, jornada) = await Carregar(id, request.Versao, db, tenant, relogio, ct);
            jornada.ConcluirRequisito((RequisitoMinimo)request.Requisito, request.DataConclusao, pessoa.DataNascimento!.Value, relogio.Hoje, tenant.UsuarioId!.Value);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(jornada.Id, jornada.Versao));
        }).RequireAuthorization(Permissoes.RegistrarProgressao).WithName("ConcluirRequisito");
        grupo.MapPost("/pessoas/{id:guid}/jornada/admissao", async (Guid id, AdmissaoRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var (pessoa, jornada) = await Carregar(id, request.Versao, db, tenant, relogio, ct);
            await ValidarManual(request.VersaoManualId, Posto.Escudeiro, db, ct);
            jornada.Admitir(request.DataAdmissao, pessoa.DataNascimento!.Value, relogio.Hoje, request.VersaoManualId, tenant.UsuarioId!.Value);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(jornada.Id, jornada.Versao));
        }).RequireAuthorization(Permissoes.RegistrarProgressao).WithName("RegistrarAdmissao");
        grupo.MapPost("/pessoas/{id:guid}/jornada/tarefas", async (Guid id, ConcluirTarefaRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var (pessoa, jornada) = await Carregar(id, request.Versao, db, tenant, relogio, ct);
            var atual = jornada.Atual();
            Exigir(atual.VersaoManualId is not null, "O manual do Emérito ainda não foi definido.");
            var manual = await db.Set<VersaoManual>().Include(v => v.Tarefas).SingleAsync(v => v.Id == atual.VersaoManualId, ct);
            jornada.ConcluirTarefa(request.TarefaManualId, manual, request.DataConclusao, pessoa.DataNascimento!.Value, relogio.Hoje, tenant.UsuarioId!.Value);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(jornada.Id, jornada.Versao));
        }).RequireAuthorization(Permissoes.RegistrarProgressao).WithName("ConcluirTarefa");
        grupo.MapPost("/pessoas/{id:guid}/jornada/conclusao-posto", async (Guid id, ConcluirPostoRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var (pessoa, jornada) = await Carregar(id, request.Versao, db, tenant, relogio, ct);
            var atual = jornada.Atual();
            Exigir(atual.Posto != Posto.Emerito, "A conclusão do Emérito aguarda definição do manual.");
            if (atual.Posto != Posto.Senior) await ValidarManual(request.ProximaVersaoManualId ?? Guid.Empty, atual.Posto + 1, db, ct);
            var manual = await db.Set<VersaoManual>().Include(v => v.Tarefas).SingleAsync(v => v.Id == atual.VersaoManualId, ct);
            jornada.ConcluirPosto(manual, request.DataConclusao, pessoa.DataNascimento!.Value, relogio.Hoje, request.ProximaVersaoManualId, tenant.UsuarioId!.Value);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(jornada.Id, jornada.Versao));
        }).RequireAuthorization(Permissoes.RegistrarProgressao).WithName("ConcluirPosto");
        grupo.MapPost("/pessoas/{id:guid}/jornada/cerimonias", async (Guid id, CerimoniaRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var (_, jornada) = await Carregar(id, request.Versao, db, tenant, relogio, ct);
            jornada.RegistrarCerimonia(request.JornadaPostoId, request.Data, request.Descricao.Trim(), relogio.Hoje, tenant.UsuarioId!.Value);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(jornada.Id, jornada.Versao));
        }).RequireAuthorization(Permissoes.RegistrarProgressao).WithName("RegistrarCerimonia");
    }

    private static async Task<(Pessoa, JornadaEmbaixador)> Carregar(Guid id, Guid versao, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct)
    {
        await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
        var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
        Exigir(pessoa.Ativa, "A progressão não pode ser alterada enquanto a pessoa estiver inativa.");
        var jornada = await Jornadas(db).SingleOrDefaultAsync(j => j.PessoaId == id, ct) ?? throw new RegistroNaoEncontradoException();
        Operacao.ConferirVersao(jornada, versao);
        return (pessoa, jornada);
    }
    private static async Task ValidarManual(Guid versaoId, Posto posto, AppDbContext db, CancellationToken ct)
    {
        Exigir(await (from v in db.Set<VersaoManual>()
                      join m in db.Set<Manual>() on v.ManualId equals m.Id
                      where v.Id == versaoId && m.Posto == posto
                      select v.Id).AnyAsync(ct), "Selecione uma versão do manual do posto na Igreja atual.");
    }
}
public sealed class RegistroNaoEncontradoException : Exception;
public sealed record ManualRequest(int Posto, [property: Required, StringLength(150)] string Identificacao, [property: Required] List<string> Tarefas);
public sealed record ManualResponse(Guid Id, int Posto, string NomePosto, string Identificacao, List<TarefaResponse> Tarefas);
public sealed record TarefaResponse(Guid Id, string Nome);
public sealed record ConcluirRequisitoRequest(Guid Versao, int Requisito, DateOnly DataConclusao);
public sealed record AdmissaoRequest(Guid Versao, Guid VersaoManualId, DateOnly DataAdmissao);
public sealed record ConcluirTarefaRequest(Guid Versao, Guid TarefaManualId, DateOnly DataConclusao);
public sealed record ConcluirPostoRequest(Guid Versao, Guid? ProximaVersaoManualId, DateOnly DataConclusao);
public sealed record CerimoniaRequest(Guid Versao, Guid JornadaPostoId, DateOnly Data, [property: Required, StringLength(1000)] string Descricao);
public sealed record JornadaResponse(Guid Id, Guid Versao, string Situacao, string? FaixaEtaria, DateOnly DataBase, int? MesesPermanencia, bool ElegivelAdmissao, List<RequisitoResponse> Requisitos, List<PostoResponse> Postos, List<CerimoniaResponse> Cerimonias);
public sealed record RequisitoResponse(int Requisito, string Nome, DateOnly? DataConclusao);
public sealed record PostoResponse(Guid Id, int Posto, string Nome, DateOnly DataIngresso, DateOnly? DataConclusao, Guid? VersaoManualId, string? IdentificacaoManual, DateOnly PermanenciaAte, List<TarefaJornadaResponse> Tarefas);
public sealed record TarefaJornadaResponse(Guid Id, string Nome, DateOnly? DataConclusao);
public sealed record CerimoniaResponse(Guid Id, Guid JornadaPostoId, DateOnly Data, string Descricao);
