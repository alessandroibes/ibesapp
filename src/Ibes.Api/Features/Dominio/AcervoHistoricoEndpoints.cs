using System.ComponentModel.DataAnnotations;
using Ibes.AcervoHistorico;
using Ibes.AgendaAtividades;
using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Api.Features.Dominio;

public static class AcervoHistoricoEndpoints
{
    public static void MapAcervoHistorico(this WebApplication app)
    {
        var g = app.MapGroup("/api/v1/acervo-historico").WithTags("Acervo histórico").AddEndpointFilter<ValidacaoFilter>();

        g.MapGet("/referencias", async (AppDbContext db, CancellationToken ct) => TypedResults.Ok(new ReferenciasAcervoResponse(
            await db.Set<Pessoa>().AsNoTracking().OrderBy(x => x.Nome).Take(1000).Select(x => new ReferenciaAcervoResponse(x.Id, x.Nome)).ToListAsync(ct),
            await db.Set<AtividadeAgenda>().AsNoTracking().OrderByDescending(x => x.DataInicio).ThenBy(x => x.Titulo).Take(1000).Select(x => new ReferenciaAcervoResponse(x.Id, x.Titulo)).ToListAsync(ct))))
            .RequireAuthorization(Permissoes.ConsultarAcervo);

        g.MapGet("/marcos", async (int? ano, string? categoria, Guid? pessoaId, Guid? atividadeId, bool? ordemCrescente, AppDbContext db, CancellationToken ct) =>
        {
            Datas.Exigir(ano is null or >= 1 and <= 9999 && (categoria?.Length ?? 0) <= 100, "Filtro da linha do tempo inválido.");
            var query = db.Set<MarcoHistorico>().AsNoTracking().Include(x => x.Pessoas).AsQueryable();
            if (ano is { } a)
            {
                var inicio = new DateOnly(a, 1, 1); var fim = new DateOnly(a, 12, 31);
                query = query.Where(x => x.DataInicio <= fim && (x.DataFim == null || x.DataFim >= inicio));
            }
            if (!string.IsNullOrWhiteSpace(categoria)) query = query.Where(x => x.Categoria == categoria);
            if (pessoaId is not null) query = query.Where(x => x.Pessoas.Any(p => p.PessoaId == pessoaId));
            if (atividadeId is not null) query = query.Where(x => x.AtividadeAgendaId == atividadeId);
            query = ordemCrescente == true ? query.OrderBy(x => x.DataInicio).ThenBy(x => x.Titulo) : query.OrderByDescending(x => x.DataInicio).ThenBy(x => x.Titulo);
            var marcos = await query.Take(1000).ToListAsync(ct);
            return TypedResults.Ok(await Respostas(marcos, db, ct));
        }).RequireAuthorization(Permissoes.ConsultarAcervo);

        g.MapGet("/marcos/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var marco = await db.Set<MarcoHistorico>().AsNoTracking().Include(x => x.Pessoas).SingleOrDefaultAsync(x => x.Id == id, ct);
            return marco is null ? Results.NotFound() : Results.Ok((await Respostas([marco], db, ct)).Single());
        }).RequireAuthorization(Permissoes.ConsultarAcervo).Produces<MarcoHistoricoResponse>();

        g.MapPost("/marcos", async (MarcoHistoricoRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            await ValidarReferencias(r.PessoaIds, r.AtividadeAgendaId, db, ct);
            var marco = new MarcoHistorico { IgrejaId = tenant.IgrejaId, AutorId = tenant.UsuarioId!.Value };
            Aplicar(marco, r); marco.Pessoas.AddRange(r.PessoaIds.Distinct().Select(x => new PessoaMarcoHistorico { IgrejaId = tenant.IgrejaId, MarcoHistoricoId = marco.Id, PessoaId = x }));
            db.Add(marco); await db.SaveChangesAsync(ct);
            return TypedResults.Created($"/api/v1/acervo-historico/marcos/{marco.Id}", new IdResponse(marco.Id, marco.Versao));
        }).RequireAuthorization(Permissoes.GerenciarAcervo);

        g.MapPut("/marcos/{id:guid}", async (Guid id, AlterarMarcoHistoricoRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var marco = await db.Set<MarcoHistorico>().Include(x => x.Pessoas).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            await ValidarReferencias(r.PessoaIds, r.AtividadeAgendaId, db, ct); Operacao.ConferirVersao(marco, r.Versao); Aplicar(marco, r);
            var desejadas = r.PessoaIds.Distinct().ToHashSet();
            db.RemoveRange(marco.Pessoas.Where(x => !desejadas.Contains(x.PessoaId)));
            foreach (var pessoaId in desejadas.Except(marco.Pessoas.Select(x => x.PessoaId)))
                marco.Pessoas.Add(new PessoaMarcoHistorico { IgrejaId = tenant.IgrejaId, MarcoHistoricoId = marco.Id, PessoaId = pessoaId });
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(marco.Id, marco.Versao));
        }).RequireAuthorization(Permissoes.GerenciarAcervo);

        g.MapDelete("/marcos/{id:guid}", async (Guid id, Guid versao, AppDbContext db, CancellationToken ct) =>
        {
            var marco = await db.Set<MarcoHistorico>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Operacao.ConferirVersao(marco, versao); db.Remove(marco); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarAcervo);

        g.MapGet("/marcos/{marcoId:guid}/anexos/{id:guid}", async (Guid marcoId, Guid id, HttpResponse response, AppDbContext db, CancellationToken ct) =>
        {
            var anexo = await db.Set<AnexoMarcoHistorico>().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.MarcoHistoricoId == marcoId, ct);
            if (anexo is null) return Results.NotFound();
            response.Headers.CacheControl = "no-store";
            return Results.File(anexo.Conteudo, anexo.TipoConteudo, anexo.NomeArquivo, enableRangeProcessing: true);
        }).RequireAuthorization(Permissoes.ConsultarAcervo);

        g.MapPost("/marcos/{marcoId:guid}/anexos", async (Guid marcoId, HttpRequest request, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var marco = await db.Set<MarcoHistorico>().SingleOrDefaultAsync(x => x.Id == marcoId, ct) ?? throw new RegistroNaoEncontradoException();
            var (versao, arquivo, descricao) = await LerFormulario(request, ct); Operacao.ConferirVersao(marco, versao);
            var anexo = new AnexoMarcoHistorico { IgrejaId = tenant.IgrejaId, MarcoHistoricoId = marcoId, Descricao = descricao };
            await AplicarArquivo(anexo, arquivo, ct); db.Add(anexo); await db.SaveChangesAsync(ct);
            return TypedResults.Created($"/api/v1/acervo-historico/marcos/{marcoId}/anexos/{anexo.Id}", new IdResponse(anexo.Id, anexo.Versao));
        }).RequireAuthorization(Permissoes.GerenciarAcervo);

        g.MapPut("/marcos/{marcoId:guid}/anexos/{id:guid}", async (Guid marcoId, Guid id, HttpRequest request, AppDbContext db, CancellationToken ct) =>
        {
            var anexo = await db.Set<AnexoMarcoHistorico>().SingleOrDefaultAsync(x => x.Id == id && x.MarcoHistoricoId == marcoId, ct) ?? throw new RegistroNaoEncontradoException();
            var (versao, arquivo, descricao) = await LerFormulario(request, ct); Operacao.ConferirVersao(anexo, versao); anexo.Descricao = descricao;
            await AplicarArquivo(anexo, arquivo, ct); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(anexo.Id, anexo.Versao));
        }).RequireAuthorization(Permissoes.GerenciarAcervo);

        g.MapDelete("/marcos/{marcoId:guid}/anexos/{id:guid}", async (Guid marcoId, Guid id, Guid versao, AppDbContext db, CancellationToken ct) =>
        {
            var anexo = await db.Set<AnexoMarcoHistorico>().SingleOrDefaultAsync(x => x.Id == id && x.MarcoHistoricoId == marcoId, ct) ?? throw new RegistroNaoEncontradoException();
            Operacao.ConferirVersao(anexo, versao); db.Remove(anexo); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarAcervo);
    }

    private static void Aplicar(MarcoHistorico x, MarcoHistoricoRequest r)
    {
        x.DataInicio = r.DataInicio; x.DataFim = r.DataFim; x.Titulo = r.Titulo.Trim(); x.Descricao = r.Descricao.Trim();
        x.Categoria = r.Categoria.Trim(); x.AtividadeAgendaId = r.AtividadeAgendaId; x.Validar();
    }
    private static async Task ValidarReferencias(Guid[] pessoas, Guid? atividade, AppDbContext db, CancellationToken ct)
    {
        Datas.Exigir(pessoas.Length <= 100, "Relacione no máximo 100 pessoas ao marco.");
        var distintas = pessoas.Distinct().ToArray();
        if (await db.Set<Pessoa>().CountAsync(x => distintas.Contains(x.Id), ct) != distintas.Length) throw new RegistroNaoEncontradoException();
        if (atividade is not null && !await db.Set<AtividadeAgenda>().AnyAsync(x => x.Id == atividade, ct)) throw new RegistroNaoEncontradoException();
    }
    private static async Task<(Guid Versao, IFormFile Arquivo, string? Descricao)> LerFormulario(HttpRequest request, CancellationToken ct)
    {
        Datas.Exigir(request.HasFormContentType && request.ContentLength is > 0 and <= 11 * 1024 * 1024, "Envie uma foto ou documento de até 10 MB.");
        var form = await request.ReadFormAsync(ct); Datas.Exigir(Guid.TryParse(form["versao"], out var versao), "Informe a versão do registro.");
        var arquivo = form.Files.GetFile("arquivo"); Datas.Exigir(arquivo is not null && arquivo.Length is > 0 and <= 10 * 1024 * 1024, "Arquivo inválido ou maior que 10 MB.");
        var descricao = string.IsNullOrWhiteSpace(form["descricao"]) ? null : form["descricao"].ToString().Trim();
        return (versao, arquivo!, descricao);
    }
    private static async Task AplicarArquivo(AnexoMarcoHistorico anexo, IFormFile arquivo, CancellationToken ct)
    {
        using var stream = new MemoryStream(); await arquivo.CopyToAsync(stream, ct); var bytes = stream.ToArray();
        var tipo = bytes.AsSpan().StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? "image/png"
            : bytes.AsSpan().StartsWith(new byte[] { 255, 216, 255 }) ? "image/jpeg"
            : bytes.AsSpan().StartsWith("%PDF-"u8) ? "application/pdf" : "";
        anexo.NomeArquivo = Path.GetFileName(arquivo.FileName); anexo.TipoConteudo = tipo; anexo.Conteudo = bytes; anexo.Tamanho = bytes.LongLength; anexo.Validar();
    }
    private static async Task<List<MarcoHistoricoResponse>> Respostas(List<MarcoHistorico> marcos, AppDbContext db, CancellationToken ct)
    {
        var pessoaIds = marcos.SelectMany(x => x.Pessoas).Select(x => x.PessoaId).Distinct().ToArray();
        var atividadeIds = marcos.Where(x => x.AtividadeAgendaId != null).Select(x => x.AtividadeAgendaId!.Value).Distinct().ToArray();
        var autorIds = marcos.Select(x => x.AutorId).Distinct().ToArray();
        var marcoIds = marcos.Select(x => x.Id).ToArray();
        var pessoas = await db.Set<Pessoa>().AsNoTracking().Where(x => pessoaIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.Nome, ct);
        var atividades = await db.Set<AtividadeAgenda>().AsNoTracking().Where(x => atividadeIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.Titulo, ct);
        var autores = await db.Users.AsNoTracking().Where(x => autorIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.UserName ?? "Conta adulta", ct);
        var anexos = (await db.Set<AnexoMarcoHistorico>().AsNoTracking().Where(x => marcoIds.Contains(x.MarcoHistoricoId))
            .Select(x => new { x.MarcoHistoricoId, Anexo = new AnexoMarcoHistoricoResponse(x.Id, x.Versao, x.NomeArquivo, x.TipoConteudo, x.Descricao, x.Tamanho) }).ToListAsync(ct))
            .ToLookup(x => x.MarcoHistoricoId, x => x.Anexo);
        return marcos.Select(x => new MarcoHistoricoResponse(x.Id, x.Versao, x.DataInicio, x.DataFim, x.Titulo, x.Descricao, x.Categoria,
            x.AtividadeAgendaId, x.AtividadeAgendaId is { } a ? atividades.GetValueOrDefault(a) : null, x.AutorId, autores.GetValueOrDefault(x.AutorId, "Conta adulta"),
            x.Pessoas.Select(p => new PessoaRelacionadaResponse(p.PessoaId, pessoas.GetValueOrDefault(p.PessoaId, "Pessoa"))).OrderBy(p => p.Nome).ToList(),
            anexos[x.Id].ToList())).ToList();
    }
}

public record MarcoHistoricoRequest(DateOnly DataInicio, DateOnly? DataFim, [property: Required, StringLength(200)] string Titulo,
    [property: Required, StringLength(10000)] string Descricao, [property: Required, StringLength(100)] string Categoria, Guid? AtividadeAgendaId, Guid[] PessoaIds);
public sealed record AlterarMarcoHistoricoRequest(Guid Versao, DateOnly DataInicio, DateOnly? DataFim, string Titulo, string Descricao, string Categoria,
    Guid? AtividadeAgendaId, Guid[] PessoaIds) : MarcoHistoricoRequest(DataInicio, DataFim, Titulo, Descricao, Categoria, AtividadeAgendaId, PessoaIds);
public sealed record PessoaRelacionadaResponse(Guid Id, string Nome);
public sealed record AnexoMarcoHistoricoResponse(Guid Id, Guid Versao, string NomeArquivo, string TipoConteudo, string? Descricao, long Tamanho);
public sealed record MarcoHistoricoResponse(Guid Id, Guid Versao, DateOnly DataInicio, DateOnly? DataFim, string Titulo, string Descricao, string Categoria,
    Guid? AtividadeAgendaId, string? Atividade, Guid AutorId, string Autor, List<PessoaRelacionadaResponse> Pessoas, List<AnexoMarcoHistoricoResponse> Anexos);
public sealed record ReferenciaAcervoResponse(Guid Id, string Nome);
public sealed record ReferenciasAcervoResponse(List<ReferenciaAcervoResponse> Pessoas, List<ReferenciaAcervoResponse> Atividades);
