using System.ComponentModel.DataAnnotations;
using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Embaixadas;
using Microsoft.EntityFrameworkCore;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Api.Features.Dominio;

public static class EmbaixadaEndpoints
{
    public static void MapEmbaixada(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/v1/embaixada").AddEndpointFilter<ValidacaoFilter>().WithTags("Embaixada");
        grupo.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
        {
            var igreja = await db.Igrejas.AsNoTracking().SingleAsync(ct);
            var embaixada = await db.Embaixadas.AsNoTracking().SingleAsync(ct);
            return TypedResults.Ok(new EmbaixadaResponse(igreja.Nome, igreja.Endereco, igreja.Pastor, igreja.Versao,
                embaixada.Nome, embaixada.NomeUsual, embaixada.DataFundacao, embaixada.Endereco, embaixada.Historia, embaixada.Versao));
        }).RequireAuthorization(Permissoes.ConsultarEmbaixada).WithName("ConsultarEmbaixada");
        grupo.MapPut("/", async (EmbaixadaRequest request, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var igreja = await db.Igrejas.SingleAsync(ct); var embaixada = await db.Embaixadas.SingleAsync(ct);
            if (igreja.Versao != request.VersaoIgreja || embaixada.Versao != request.VersaoEmbaixada) throw new DbUpdateConcurrencyException();
            Exigir(request.DataFundacao is null || request.DataFundacao != default(DateOnly) && request.DataFundacao <= relogio.Hoje, "Data de fundação inválida.");
            igreja.Nome = request.NomeIgreja.Trim(); igreja.Endereco = request.EnderecoIgreja; igreja.Pastor = request.Pastor; igreja.Versao = Guid.NewGuid();
            embaixada.Nome = request.NomeOficial.Trim(); embaixada.NomeUsual = request.NomeUsual; embaixada.DataFundacao = request.DataFundacao;
            embaixada.Endereco = request.EnderecoEmbaixada; embaixada.Historia = request.Historia; embaixada.Versao = Guid.NewGuid();
            await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.EditarEmbaixada).WithName("AlterarEmbaixada");
        grupo.MapGet("/conselheiros", async (AppDbContext db, CancellationToken ct) => TypedResults.Ok(await (
            from c in db.Set<Conselheiro>()
            join p in db.Set<Pessoa>() on c.PessoaId equals p.Id
            orderby p.Nome, c.DataInicio descending
            select new ConselheiroResponse(c.Id, c.Versao, c.PessoaId, p.Nome, c.UsuarioId, c.Funcao, c.DataInicio, c.DataFim)).ToListAsync(ct)))
            .RequireAuthorization(Permissoes.ConsultarEmbaixada).WithName("ListarConselheiros");
        grupo.MapGet("/contas", async (AppDbContext db, CancellationToken ct) => TypedResults.Ok(await (
            from v in db.VinculosIgreja
            join u in db.Users on v.UsuarioId equals u.Id
            select new ContaResponse(u.Id, u.Email!)).ToListAsync(ct)))
            .RequireAuthorization(Permissoes.EditarEmbaixada).WithName("ListarContasDaIgreja");
        grupo.MapPost("/conselheiros", async (ConselheiroRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == request.PessoaId, ct);
            if (pessoa is null) return Results.NotFound();
            if (request.UsuarioId is { } usuario && !await db.VinculosIgreja.AnyAsync(v => v.UsuarioId == usuario, ct)) return Results.NotFound();
            Operacao.ValidarPeriodo(request.DataInicio, null, relogio.Hoje);
            Exigir(pessoa.DataNascimento is { } nascimento && Idade(nascimento, request.DataInicio) >= 18, "Conselheiro deve ser adulto na data de início. Informe a data de nascimento.");
            Operacao.ConferirVersao(pessoa, request.VersaoPessoa);
            Exigir(!await db.Set<Conselheiro>().AnyAsync(c => (c.PessoaId == pessoa.Id || request.UsuarioId != null && c.UsuarioId == request.UsuarioId) && (c.DataFim == null || c.DataFim >= request.DataInicio), ct), "Já existe vínculo de Conselheiro nesse período.");
            var conselheiro = new Conselheiro { IgrejaId = tenant.IgrejaId, PessoaId = pessoa.Id, UsuarioId = request.UsuarioId, Funcao = request.Funcao.Trim(), DataInicio = request.DataInicio };
            db.Add(conselheiro); await db.SaveChangesAsync(ct); return Results.Ok(new IdResponse(conselheiro.Id, conselheiro.Versao));
        }).RequireAuthorization(Permissoes.EditarEmbaixada).Produces<IdResponse>().WithName("CadastrarConselheiro");
        grupo.MapPost("/conselheiros/{id:guid}/encerramento", async (Guid id, EncerrarVinculoRequest request, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var c = await db.Set<Conselheiro>().SingleOrDefaultAsync(c => c.Id == id, ct);
            if (c is null) return Results.NotFound();
            Exigir(c.DataFim is null, "Vínculo de Conselheiro já encerrado."); Operacao.ValidarPeriodo(c.DataInicio, request.DataFim, relogio.Hoje);
            Exigir(!await db.Set<LiderancaEmbaixada>().AnyAsync(l => l.ConselheiroId == id && (l.DataFim == null || l.DataFim > request.DataFim), ct), "Encerre as lideranças vinculadas antes de encerrar o Conselheiro.");
            Operacao.ConferirVersao(c, request.Versao); c.DataFim = request.DataFim; await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.EditarEmbaixada);
        grupo.MapGet("/liderancas", async (AppDbContext db, CancellationToken ct) => TypedResults.Ok(await (
            from l in db.Set<LiderancaEmbaixada>()
            join c in db.Set<Conselheiro>() on l.ConselheiroId equals c.Id
            join p in db.Set<Pessoa>() on c.PessoaId equals p.Id
            orderby l.DataInicio descending
            select new LiderancaResponse(l.Id, l.Versao, c.Id, p.Nome, l.Funcao, l.DataInicio, l.DataFim)).ToListAsync(ct)))
            .RequireAuthorization(Permissoes.ConsultarEmbaixada).WithName("ListarLiderancas");
        grupo.MapPost("/liderancas", async (LiderancaRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var c = await db.Set<Conselheiro>().SingleOrDefaultAsync(c => c.Id == request.ConselheiroId, ct);
            if (c is null) return Results.NotFound();
            Operacao.ValidarPeriodo(request.DataInicio, null, relogio.Hoje);
            Exigir(request.DataInicio >= c.DataInicio && c.DataFim is null, "A liderança deve começar durante um vínculo de Conselheiro aberto.");
            Operacao.ConferirVersao(c, request.VersaoConselheiro);
            var l = new LiderancaEmbaixada { IgrejaId = tenant.IgrejaId, ConselheiroId = c.Id, Funcao = request.Funcao.Trim(), DataInicio = request.DataInicio };
            db.Add(l); await db.SaveChangesAsync(ct); return Results.Ok(new IdResponse(l.Id, l.Versao));
        }).RequireAuthorization(Permissoes.EditarEmbaixada).Produces<IdResponse>();
        grupo.MapPost("/liderancas/{id:guid}/encerramento", async (Guid id, EncerrarVinculoRequest request, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var l = await db.Set<LiderancaEmbaixada>().SingleOrDefaultAsync(l => l.Id == id, ct);
            if (l is null) return Results.NotFound();
            Exigir(l.DataFim is null, "Liderança já encerrada."); Operacao.ValidarPeriodo(l.DataInicio, request.DataFim, relogio.Hoje);
            Operacao.ConferirVersao(l, request.Versao); l.DataFim = request.DataFim; await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.EditarEmbaixada);
    }
}
public sealed record EmbaixadaResponse(string NomeIgreja, string? EnderecoIgreja, string? Pastor, Guid VersaoIgreja, string NomeOficial, string? NomeUsual, DateOnly? DataFundacao, string? EnderecoEmbaixada, string? Historia, Guid VersaoEmbaixada);
public sealed record EmbaixadaRequest([property: Required, StringLength(200)] string NomeIgreja, [property: StringLength(500)] string? EnderecoIgreja,
    [property: StringLength(200)] string? Pastor, Guid VersaoIgreja, [property: Required, StringLength(200)] string NomeOficial, [property: StringLength(200)] string? NomeUsual,
    DateOnly? DataFundacao, [property: StringLength(500)] string? EnderecoEmbaixada, [property: StringLength(10000)] string? Historia, Guid VersaoEmbaixada);
public sealed record ConselheiroRequest(Guid PessoaId, Guid VersaoPessoa, Guid? UsuarioId, [property: Required, StringLength(100)] string Funcao, DateOnly DataInicio);
public sealed record ConselheiroResponse(Guid Id, Guid Versao, Guid PessoaId, string Nome, Guid? UsuarioId, string Funcao, DateOnly DataInicio, DateOnly? DataFim);
public sealed record LiderancaRequest(Guid ConselheiroId, Guid VersaoConselheiro, [property: Required, StringLength(100)] string Funcao, DateOnly DataInicio);
public sealed record LiderancaResponse(Guid Id, Guid Versao, Guid ConselheiroId, string Nome, string Funcao, DateOnly DataInicio, DateOnly? DataFim);
public sealed record ContaResponse(Guid Id, string Email);
