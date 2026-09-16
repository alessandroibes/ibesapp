using System.ComponentModel.DataAnnotations;
using Ibes.AgendaAtividades;
using Ibes.Financeiro;
using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Api.Features.Dominio;

public static class FinanceiroEndpoints
{
    public static void MapFinanceiro(this WebApplication app)
    {
        var g = app.MapGroup("/api/v1/financeiro").WithTags("Financeiro da Embaixada").AddEndpointFilter<ValidacaoFilter>();

        g.MapGet("/referencias", async (AppDbContext db, CancellationToken ct) => TypedResults.Ok(new ReferenciasFinanceirasResponse(
            await db.Set<Pessoa>().AsNoTracking().OrderBy(x => x.Nome).Take(1000).Select(x => new ReferenciaFinanceiraResponse(x.Id, x.Nome)).ToListAsync(ct),
            await db.Set<AtividadeAgenda>().AsNoTracking().OrderByDescending(x => x.DataInicio).ThenBy(x => x.Titulo).Take(1000).Select(x => new ReferenciaFinanceiraResponse(x.Id, x.Titulo)).ToListAsync(ct))))
            .RequireAuthorization(Permissoes.ConsultarFinanceiro);

        g.MapGet("/iniciativas", async (AppDbContext db, CancellationToken ct) =>
            TypedResults.Ok(await db.Set<IniciativaFinanceira>().AsNoTracking().OrderBy(x => x.Nome)
                .Select(x => new IniciativaFinanceiraResponse(x.Id, x.Versao, x.Nome, x.Descricao)).ToListAsync(ct)))
            .RequireAuthorization(Permissoes.ConsultarFinanceiro);

        g.MapPost("/iniciativas", async (IniciativaFinanceiraRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var item = new IniciativaFinanceira { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim(), Descricao = Limpar(r.Descricao) };
            item.Validar(); db.Add(item); await db.SaveChangesAsync(ct);
            return TypedResults.Created($"/api/v1/financeiro/iniciativas/{item.Id}", new IdResponse(item.Id, item.Versao));
        }).RequireAuthorization(Permissoes.GerenciarFinanceiro);

        g.MapPut("/iniciativas/{id:guid}", async (Guid id, AlterarIniciativaFinanceiraRequest r, AppDbContext db, CancellationToken ct) =>
        {
            var item = await db.Set<IniciativaFinanceira>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Operacao.ConferirVersao(item, r.Versao); item.Nome = r.Nome.Trim(); item.Descricao = Limpar(r.Descricao); item.Validar();
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(item.Id, item.Versao));
        }).RequireAuthorization(Permissoes.GerenciarFinanceiro);

        g.MapDelete("/iniciativas/{id:guid}", async (Guid id, Guid versao, AppDbContext db, CancellationToken ct) =>
        {
            var item = await db.Set<IniciativaFinanceira>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Operacao.ConferirVersao(item, versao); db.Remove(item); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarFinanceiro);

        g.MapGet("/lancamentos", async (DateOnly? inicio, DateOnly? fim, Guid? atividadeId, Guid? iniciativaId, Guid? pessoaId, AppDbContext db, CancellationToken ct) =>
        {
            ValidarFiltro(inicio, fim);
            var query = Filtrar(db.Set<LancamentoFinanceiro>().AsNoTracking(), inicio, fim, atividadeId, iniciativaId, pessoaId);
            var itens = await query.OrderByDescending(x => x.Data).ThenByDescending(x => x.CreatedAt).Take(1000).ToListAsync(ct);
            var pessoaIds = itens.Where(i => i.PessoaId != null).Select(i => i.PessoaId!.Value).Distinct().ToArray();
            var atividadeIds = itens.Where(i => i.AtividadeAgendaId != null).Select(i => i.AtividadeAgendaId!.Value).Distinct().ToArray();
            var pessoas = await db.Set<Pessoa>().AsNoTracking().Where(x => pessoaIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.Nome, ct);
            var atividades = await db.Set<AtividadeAgenda>().AsNoTracking().Where(x => atividadeIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.Titulo, ct);
            var iniciativas = await db.Set<IniciativaFinanceira>().AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Nome, ct);
            return TypedResults.Ok(itens.Select(x => Resposta(x, pessoas, atividades, iniciativas)).ToList());
        }).RequireAuthorization(Permissoes.ConsultarFinanceiro);

        g.MapGet("/resumo", async (DateOnly? inicio, DateOnly? fim, Guid? atividadeId, Guid? iniciativaId, Guid? pessoaId, AppDbContext db, CancellationToken ct) =>
        {
            ValidarFiltro(inicio, fim);
            var itens = await Filtrar(db.Set<LancamentoFinanceiro>().AsNoTracking(), inicio, fim, atividadeId, iniciativaId, pessoaId)
                .Select(x => new { x.Tipo, x.Valor }).ToListAsync(ct);
            var entradas = itens.Where(x => x.Tipo == TipoLancamentoFinanceiro.Entrada).Sum(x => x.Valor);
            var saidas = itens.Where(x => x.Tipo == TipoLancamentoFinanceiro.Saida).Sum(x => x.Valor);
            return TypedResults.Ok(new ResumoFinanceiroResponse(entradas, saidas, entradas - saidas, itens.Count));
        }).RequireAuthorization(Permissoes.ConsultarFinanceiro);

        g.MapPost("/lancamentos", async (LancamentoFinanceiroRequest r, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            await ValidarReferencias(r.PessoaId, r.AtividadeAgendaId, r.IniciativaFinanceiraId, db, ct);
            var item = new LancamentoFinanceiro { IgrejaId = tenant.IgrejaId };
            Aplicar(item, r); db.Add(item); await db.SaveChangesAsync(ct);
            return TypedResults.Created($"/api/v1/financeiro/lancamentos/{item.Id}", new IdResponse(item.Id, item.Versao));
        }).RequireAuthorization(Permissoes.GerenciarFinanceiro);

        g.MapPut("/lancamentos/{id:guid}", async (Guid id, AlterarLancamentoFinanceiroRequest r, AppDbContext db, CancellationToken ct) =>
        {
            var item = await db.Set<LancamentoFinanceiro>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            await ValidarReferencias(r.PessoaId, r.AtividadeAgendaId, r.IniciativaFinanceiraId, db, ct);
            Operacao.ConferirVersao(item, r.Versao); Aplicar(item, r); await db.SaveChangesAsync(ct);
            return TypedResults.Ok(new IdResponse(item.Id, item.Versao));
        }).RequireAuthorization(Permissoes.GerenciarFinanceiro);

        g.MapDelete("/lancamentos/{id:guid}", async (Guid id, Guid versao, AppDbContext db, CancellationToken ct) =>
        {
            var item = await db.Set<LancamentoFinanceiro>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Operacao.ConferirVersao(item, versao); db.Remove(item); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarFinanceiro);
    }

    private static IQueryable<LancamentoFinanceiro> Filtrar(IQueryable<LancamentoFinanceiro> q, DateOnly? inicio, DateOnly? fim, Guid? atividade, Guid? iniciativa, Guid? pessoa)
    {
        if (inicio is not null) q = q.Where(x => x.Data >= inicio);
        if (fim is not null) q = q.Where(x => x.Data <= fim);
        if (atividade is not null) q = q.Where(x => x.AtividadeAgendaId == atividade);
        if (iniciativa is not null) q = q.Where(x => x.IniciativaFinanceiraId == iniciativa);
        if (pessoa is not null) q = q.Where(x => x.PessoaId == pessoa);
        return q;
    }
    private static void ValidarFiltro(DateOnly? inicio, DateOnly? fim) => Datas.Exigir(inicio is null || fim is null || fim >= inicio, "O período informado é inválido.");
    private static string? Limpar(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
    private static void Aplicar(LancamentoFinanceiro x, LancamentoFinanceiroRequest r)
    {
        x.Tipo = r.Tipo; x.Data = r.Data; x.Valor = r.Valor; x.Motivo = r.Motivo.Trim(); x.Descricao = Limpar(r.Descricao);
        x.PessoaId = r.PessoaId; x.AtividadeAgendaId = r.AtividadeAgendaId; x.IniciativaFinanceiraId = r.IniciativaFinanceiraId; x.Validar();
    }
    private static async Task ValidarReferencias(Guid? pessoa, Guid? atividade, Guid? iniciativa, AppDbContext db, CancellationToken ct)
    {
        if (pessoa is not null && !await db.Set<Pessoa>().AnyAsync(x => x.Id == pessoa, ct)) throw new RegistroNaoEncontradoException();
        if (atividade is not null && !await db.Set<AtividadeAgenda>().AnyAsync(x => x.Id == atividade, ct)) throw new RegistroNaoEncontradoException();
        if (iniciativa is not null && !await db.Set<IniciativaFinanceira>().AnyAsync(x => x.Id == iniciativa, ct)) throw new RegistroNaoEncontradoException();
    }
    private static LancamentoFinanceiroResponse Resposta(LancamentoFinanceiro x, Dictionary<Guid, string> pessoas, Dictionary<Guid, string> atividades, Dictionary<Guid, string> iniciativas) =>
        new(x.Id, x.Versao, x.Tipo, x.Data, x.Valor, x.Motivo, x.Descricao, x.PessoaId, x.PessoaId is { } p ? pessoas.GetValueOrDefault(p) : null,
            x.AtividadeAgendaId, x.AtividadeAgendaId is { } a ? atividades.GetValueOrDefault(a) : null,
            x.IniciativaFinanceiraId, x.IniciativaFinanceiraId is { } i ? iniciativas.GetValueOrDefault(i) : null);
}

public record IniciativaFinanceiraRequest([property: Required, StringLength(200)] string Nome, [property: StringLength(2000)] string? Descricao);
public sealed record AlterarIniciativaFinanceiraRequest(Guid Versao, string Nome, string? Descricao) : IniciativaFinanceiraRequest(Nome, Descricao);
public sealed record IniciativaFinanceiraResponse(Guid Id, Guid Versao, string Nome, string? Descricao);
public record LancamentoFinanceiroRequest(TipoLancamentoFinanceiro Tipo, DateOnly Data, decimal Valor, [property: Required, StringLength(200)] string Motivo,
    [property: StringLength(2000)] string? Descricao, Guid? PessoaId, Guid? AtividadeAgendaId, Guid? IniciativaFinanceiraId);
public sealed record AlterarLancamentoFinanceiroRequest(Guid Versao, TipoLancamentoFinanceiro Tipo, DateOnly Data, decimal Valor, string Motivo, string? Descricao,
    Guid? PessoaId, Guid? AtividadeAgendaId, Guid? IniciativaFinanceiraId) : LancamentoFinanceiroRequest(Tipo, Data, Valor, Motivo, Descricao, PessoaId, AtividadeAgendaId, IniciativaFinanceiraId);
public sealed record LancamentoFinanceiroResponse(Guid Id, Guid Versao, TipoLancamentoFinanceiro Tipo, DateOnly Data, decimal Valor, string Motivo, string? Descricao,
    Guid? PessoaId, string? Pessoa, Guid? AtividadeAgendaId, string? Atividade, Guid? IniciativaFinanceiraId, string? Iniciativa);
public sealed record ResumoFinanceiroResponse(decimal Entradas, decimal Saidas, decimal Saldo, int QuantidadeLancamentos);
public sealed record ReferenciaFinanceiraResponse(Guid Id, string Nome);
public sealed record ReferenciasFinanceirasResponse(List<ReferenciaFinanceiraResponse> Pessoas, List<ReferenciaFinanceiraResponse> Atividades);
