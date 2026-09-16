using System.ComponentModel.DataAnnotations;
using Ibes.Competicoes;
using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Progressao;
using Microsoft.EntityFrameworkCore;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Api.Features.Dominio;

public static class CompeticoesEndpoints
{
    public static void MapCompeticoes(this WebApplication app)
    {
        var g = app.MapGroup("/api/v1/competicoes").WithTags("Competições e provas").AddEndpointFilter<ValidacaoFilter>();

        g.MapGet("/catalogo", async (AppDbContext db, CancellationToken ct) =>
        {
            var modalidades = await db.Set<Modalidade>().AsNoTracking().OrderBy(x => x.Nome).ToListAsync(ct);
            var provas = await db.Set<Prova>().AsNoTracking().OrderBy(x => x.Nome).ToListAsync(ct);
            return TypedResults.Ok(modalidades.Select(m => new ModalidadeResponse(m.Id, m.Versao, m.Nome, m.Ativa,
                provas.Where(p => p.ModalidadeId == m.Id).Select(p => new ProvaResponse(p.Id, p.Versao, p.Nome, p.Natureza, p.TipoReferencia, p.Ativa)).ToList())).ToList());
        }).RequireAuthorization(Permissoes.ConsultarCompeticoes);

        g.MapPost("/catalogo/modalidades", async (ModalidadeRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var modalidade = new Modalidade { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim() }; modalidade.Validar();
            db.Add(modalidade); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(modalidade.Id, modalidade.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPut("/catalogo/modalidades/{id:guid}", async (Guid id, AlterarModalidadeRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var modalidade = await db.Set<Modalidade>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Operacao.ConferirVersao(modalidade, r.Versao); modalidade.Nome = r.Nome.Trim(); modalidade.Ativa = r.Ativa; modalidade.Validar();
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(modalidade.Id, modalidade.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPost("/catalogo/provas", async (ProvaRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var modalidade = await db.Set<Modalidade>().SingleOrDefaultAsync(x => x.Id == r.ModalidadeId, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(modalidade.Ativa, "A modalidade está inativa.");
            var prova = new Prova { IgrejaId = tenant.IgrejaId, ModalidadeId = r.ModalidadeId, Nome = r.Nome.Trim(), Natureza = r.Natureza, TipoReferencia = r.TipoReferencia }; prova.Validar();
            db.Add(prova); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(prova.Id, prova.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPut("/catalogo/provas/{id:guid}", async (Guid id, AlterarProvaRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var prova = await db.Set<Prova>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var modalidade = await db.Set<Modalidade>().SingleOrDefaultAsync(x => x.Id == r.ModalidadeId, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(modalidade.Ativa || prova.ModalidadeId == modalidade.Id, "A modalidade está inativa.");
            Operacao.ConferirVersao(prova, r.Versao); prova.ModalidadeId = r.ModalidadeId; prova.Nome = r.Nome.Trim(); prova.Natureza = r.Natureza; prova.TipoReferencia = r.TipoReferencia; prova.Ativa = r.Ativa; prova.Validar();
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(prova.Id, prova.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapGet("/aptidoes", async (Guid? pessoaId, AppDbContext db, CancellationToken ct) =>
        {
            var pessoas = await db.Set<Pessoa>().AsNoTracking().ToDictionaryAsync(x => x.Id, ct);
            var provas = await db.Set<Prova>().AsNoTracking().ToDictionaryAsync(x => x.Id, ct);
            var query = db.Set<AptidaoProva>().AsNoTracking().AsQueryable();
            if (pessoaId is not null) query = query.Where(x => x.PessoaId == pessoaId);
            var aptidoes = await query.OrderByDescending(x => x.DataInicio).ToListAsync(ct);
            return TypedResults.Ok(aptidoes.Select(x => new AptidaoResponse(x.Id, x.Versao, x.PessoaId, pessoas[x.PessoaId].Nome, x.ProvaId, provas[x.ProvaId].Nome, x.DataInicio, x.DataFim, x.MotivoFim)).ToList());
        }).RequireAuthorization(Permissoes.ConsultarCompeticoes);

        g.MapPost("/aptidoes", async (AptidaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            await ExigirCandidatoOuEmbaixador(db, r.PessoaId, r.DataInicio, ct);
            var prova = await db.Set<Prova>().SingleOrDefaultAsync(x => x.Id == r.ProvaId, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(prova.Ativa, "A prova está inativa.");
            Exigir(!await db.Set<AptidaoProva>().AnyAsync(x => x.PessoaId == r.PessoaId && x.ProvaId == r.ProvaId && x.DataFim == null, ct), "Já existe aptidão vigente para esta prova.");
            var aptidao = new AptidaoProva { IgrejaId = tenant.IgrejaId, PessoaId = r.PessoaId, ProvaId = r.ProvaId, DataInicio = r.DataInicio, RegistradoPor = tenant.UsuarioId!.Value }; aptidao.Validar(relogio.Hoje);
            db.Add(aptidao); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(aptidao.Id, aptidao.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPost("/aptidoes/{id:guid}/encerramento", async (Guid id, EncerrarAptidaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var aptidao = await db.Set<AptidaoProva>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(aptidao.DataFim is null && r.DataFim >= aptidao.DataInicio && r.DataFim <= relogio.Hoje && !string.IsNullOrWhiteSpace(r.Motivo), "Informe data e motivo válidos para encerrar a aptidão.");
            Operacao.ConferirVersao(aptidao, r.Versao); aptidao.DataFim = r.DataFim; aptidao.MotivoFim = r.Motivo.Trim(); aptidao.EncerradoPor = tenant.UsuarioId;
            aptidao.Validar(relogio.Hoje); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
        {
            var competicoes = await db.Set<Competicao>().AsNoTracking().OrderByDescending(x => x.DataInicio).ToListAsync(ct);
            var quantidades = await db.Set<ProvaCompeticao>().AsNoTracking().GroupBy(x => x.CompeticaoId).Select(x => new { Id = x.Key, Total = x.Count() }).ToDictionaryAsync(x => x.Id, x => x.Total, ct);
            return TypedResults.Ok(competicoes.Select(x => new CompeticaoResumoResponse(x.Id, x.Versao, x.Nome, x.DataInicio, x.DataFim, x.DataBaseCategoria, x.Local, quantidades.GetValueOrDefault(x.Id))).ToList());
        }).RequireAuthorization(Permissoes.ConsultarCompeticoes);

        g.MapPost("/", async (CompeticaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var competicao = r.Entidade(tenant.IgrejaId); competicao.Validar(); db.Add(competicao); await db.SaveChangesAsync(ct);
            return TypedResults.Ok(new IdResponse(competicao.Id, competicao.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPut("/{id:guid}", async (Guid id, AlterarCompeticaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var competicao = await db.Set<Competicao>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var provasIds = await db.Set<ProvaCompeticao>().Where(x => x.CompeticaoId == id).Select(x => x.Id).ToListAsync(ct);
            Exigir(!await db.Set<EscalacaoProva>().AnyAsync(x => provasIds.Contains(x.ProvaCompeticaoId) && x.Situacao == SituacaoEscalacao.Finalizada, ct), "Reabra as escalações finalizadas antes de alterar a competição.");
            Operacao.ConferirVersao(competicao, r.Versao); r.Dados.Aplicar(competicao); competicao.Validar(); await db.SaveChangesAsync(ct);
            return TypedResults.Ok(new IdResponse(competicao.Id, competicao.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db, CancellationToken ct) => TypedResults.Ok(await Detalhar(id, db, ct)))
            .RequireAuthorization(Permissoes.ConsultarCompeticoes);

        g.MapPost("/{id:guid}/provas", async (Guid id, ProvaCompeticaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            _ = await db.Set<Competicao>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var prova = await db.Set<Prova>().SingleOrDefaultAsync(x => x.Id == r.ProvaId, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(prova.Ativa, "A prova está inativa.");
            var configuracao = r.Entidade(tenant.IgrejaId, id); configuracao.Validar(prova);
            var escalacao = new EscalacaoProva { IgrejaId = tenant.IgrejaId, ProvaCompeticaoId = configuracao.Id };
            db.AddRange(configuracao, escalacao); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(configuracao.Id, configuracao.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPut("/provas/{id:guid}", async (Guid id, AlterarProvaCompeticaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var configuracao = await db.Set<ProvaCompeticao>().Include(x => x.Categorias).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var prova = await db.Set<Prova>().SingleAsync(x => x.Id == configuracao.ProvaId, ct);
            var escalacao = await db.Set<EscalacaoProva>().Include(x => x.Participantes).SingleAsync(x => x.ProvaCompeticaoId == id, ct);
            Exigir(escalacao.Situacao == SituacaoEscalacao.Rascunho, "Reabra a escalação antes de alterar as regras da prova.");
            Exigir(r.Dados.ProvaId == configuracao.ProvaId, "A prova do catálogo não pode ser trocada nesta configuração.");
            Operacao.ConferirVersao(configuracao, r.Versao); Operacao.ConferirVersao(escalacao, r.VersaoEscalacao);
            r.Dados.Aplicar(configuracao); configuracao.Validar(prova);
            escalacao.SubstituirParticipantes(escalacao.Participantes.Select(x => (x.PessoaId, x.Funcao)), configuracao);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(configuracao.Id, configuracao.Versao));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapGet("/{competicaoId:guid}/provas/{provaCompeticaoId:guid}/candidatos", async (Guid competicaoId, Guid provaCompeticaoId, AppDbContext db, Relogio relogio, CancellationToken ct) =>
            TypedResults.Ok(await Candidatos(competicaoId, provaCompeticaoId, db, relogio.Hoje, ct)))
            .RequireAuthorization(Permissoes.ConsultarCompeticoes);

        g.MapPut("/escalacoes/{id:guid}", async (Guid id, EscalacaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var escalacao = await CarregarEscalacao(id, db, ct); var configuracao = await db.Set<ProvaCompeticao>().SingleAsync(x => x.Id == escalacao.ProvaCompeticaoId, ct);
            var competicao = await db.Set<Competicao>().SingleAsync(x => x.Id == configuracao.CompeticaoId, ct);
            var candidatos = await Candidatos(competicao.Id, configuracao.Id, db, relogio.Hoje, ct);
            Exigir(r.Participantes.All(x => candidatos.Any(c => c.PessoaId == x.PessoaId)), "A escalação aceita somente Candidatos ou Embaixadores aptos e elegíveis.");
            Operacao.ConferirVersao(escalacao, r.Versao); escalacao.SubstituirParticipantes(r.Participantes.Select(x => (x.PessoaId, x.Funcao)), configuracao);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(await ResponderEscalacao(escalacao.Id, db, ct));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPost("/escalacoes/{id:guid}/finalizacao", async (Guid id, VersaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var escalacao = await CarregarEscalacao(id, db, ct); var configuracao = await db.Set<ProvaCompeticao>().SingleAsync(x => x.Id == escalacao.ProvaCompeticaoId, ct);
            var competicao = await db.Set<Competicao>().SingleAsync(x => x.Id == configuracao.CompeticaoId, ct);
            var candidatos = await Candidatos(competicao.Id, configuracao.Id, db, relogio.Hoje, ct);
            Exigir(escalacao.Participantes.All(x => candidatos.Any(c => c.PessoaId == x.PessoaId)), "Todos os participantes devem permanecer aptos e elegíveis para finalizar.");
            Operacao.ConferirVersao(escalacao, r.Versao); escalacao.Finalizar(configuracao, tenant.UsuarioId!.Value); await db.SaveChangesAsync(ct);
            return TypedResults.Ok(await ResponderEscalacao(escalacao.Id, db, ct));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);

        g.MapPost("/escalacoes/{id:guid}/reabertura", async (Guid id, ReabrirEscalacaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct);
            var escalacao = await CarregarEscalacao(id, db, ct); Operacao.ConferirVersao(escalacao, r.Versao); escalacao.Reabrir(tenant.UsuarioId!.Value, r.Motivo);
            await db.SaveChangesAsync(ct); return TypedResults.Ok(await ResponderEscalacao(escalacao.Id, db, ct));
        }).RequireAuthorization(Permissoes.GerenciarCompeticoes);
    }

    private static async Task<CompeticaoDetalheResponse> Detalhar(Guid id, AppDbContext db, CancellationToken ct)
    {
        var competicao = await db.Set<Competicao>().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
        var configuracoes = await db.Set<ProvaCompeticao>().AsNoTracking().Include(x => x.Categorias).Where(x => x.CompeticaoId == id).ToListAsync(ct);
        var provas = await db.Set<Prova>().AsNoTracking().ToDictionaryAsync(x => x.Id, ct);
        var modalidades = await db.Set<Modalidade>().AsNoTracking().ToDictionaryAsync(x => x.Id, ct);
        var escalacoes = await db.Set<EscalacaoProva>().AsNoTracking().Include(x => x.Participantes).Include(x => x.Alteracoes).Where(x => configuracoes.Select(c => c.Id).Contains(x.ProvaCompeticaoId)).ToListAsync(ct);
        var pessoas = await db.Set<Pessoa>().AsNoTracking().ToDictionaryAsync(x => x.Id, ct);
        return new(competicao.Id, competicao.Versao, competicao.Nome, competicao.DataInicio, competicao.DataFim, competicao.DataBaseCategoria, competicao.Local, competicao.Observacoes,
            configuracoes.Select(c =>
            {
                var prova = provas[c.ProvaId]; var escalacao = escalacoes.Single(x => x.ProvaCompeticaoId == c.Id);
                return new ProvaCompeticaoResponse(c.Id, c.Versao, prova.Id, prova.Nome, modalidades[prova.ModalidadeId].Nome, prova.Natureza, prova.TipoReferencia,
                    c.Categorias.Select(x => x.Categoria).Order().ToList(), c.MinimoTitulares, c.MaximoParticipantes, c.MaximoReservas, c.QuantidadeExataTitulares, c.Referencia, c.Data, c.HoraInicio, c.HoraFim,
                    new EscalacaoResponse(escalacao.Id, escalacao.Versao, escalacao.Situacao,
                        escalacao.Participantes.Select(p => new ParticipanteEscalacaoResponse(p.PessoaId, pessoas[p.PessoaId].Nome, p.Funcao)).OrderBy(x => x.Funcao).ThenBy(x => x.Nome).ToList(),
                        escalacao.Alteracoes.OrderBy(x => x.CreatedAt).Select(a => new AlteracaoEscalacaoResponse(a.Tipo, a.CreatedAt, a.Motivo)).ToList(), []));
            }).OrderBy(x => x.Modalidade).ThenBy(x => x.Prova).ToList());
    }

    private static async Task<List<CandidatoEscalacaoResponse>> Candidatos(Guid competicaoId, Guid provaCompeticaoId, AppDbContext db, DateOnly hoje, CancellationToken ct)
    {
        var competicao = await db.Set<Competicao>().AsNoTracking().SingleOrDefaultAsync(x => x.Id == competicaoId, ct) ?? throw new RegistroNaoEncontradoException();
        var configuracao = await db.Set<ProvaCompeticao>().AsNoTracking().Include(x => x.Categorias).SingleOrDefaultAsync(x => x.Id == provaCompeticaoId && x.CompeticaoId == competicaoId, ct) ?? throw new RegistroNaoEncontradoException();
        var aptos = await db.Set<AptidaoProva>().AsNoTracking().Where(x => x.ProvaId == configuracao.ProvaId && x.DataInicio <= hoje && (x.DataFim == null || x.DataFim >= hoje)).Select(x => x.PessoaId).Distinct().ToListAsync(ct);
        var jornadas = await db.Set<JornadaEmbaixador>().AsNoTracking().Where(x => aptos.Contains(x.PessoaId)).ToListAsync(ct);
        var pessoas = await db.Set<Pessoa>().AsNoTracking().Where(x => jornadas.Select(j => j.PessoaId).Contains(x.Id)).ToListAsync(ct);
        var conflitos = await Conflitos(configuracao, db, ct);
        return pessoas.Where(p => p.DataNascimento is { } nascimento && configuracao.Elegivel(nascimento, competicao.DataBaseCategoria))
            .OrderBy(p => p.Nome).Select(p => new CandidatoEscalacaoResponse(p.Id, p.Nome, FaixaEtaria(p.DataNascimento!.Value, competicao.DataBaseCategoria)!, conflitos.GetValueOrDefault(p.Id) ?? [])).ToList();
    }

    private static async Task<Dictionary<Guid, List<string>>> Conflitos(ProvaCompeticao atual, AppDbContext db, CancellationToken ct)
    {
        var resultado = new Dictionary<Guid, List<string>>();
        if (atual.Data is null || atual.HoraInicio is null || atual.HoraFim is null) return resultado;
        var outras = await db.Set<ProvaCompeticao>().AsNoTracking().Where(x => x.Id != atual.Id && x.Data == atual.Data && x.HoraInicio < atual.HoraFim && x.HoraFim > atual.HoraInicio).ToListAsync(ct);
        if (outras.Count == 0) return resultado;
        var provas = await db.Set<Prova>().AsNoTracking().ToDictionaryAsync(x => x.Id, ct);
        var ids = outras.Select(x => x.Id).ToList();
        var escalacoes = await db.Set<EscalacaoProva>().AsNoTracking().Include(x => x.Participantes).Where(x => ids.Contains(x.ProvaCompeticaoId)).ToListAsync(ct);
        foreach (var escalacao in escalacoes)
        {
            var outra = outras.Single(x => x.Id == escalacao.ProvaCompeticaoId);
            foreach (var participante in escalacao.Participantes)
            {
                if (!resultado.TryGetValue(participante.PessoaId, out var avisos)) resultado[participante.PessoaId] = avisos = [];
                avisos.Add($"Conflito de horário com {provas[outra.ProvaId].Nome}.");
            }
        }
        return resultado;
    }

    private static async Task<EscalacaoProva> CarregarEscalacao(Guid id, AppDbContext db, CancellationToken ct) =>
        await db.Set<EscalacaoProva>().Include(x => x.Participantes).Include(x => x.Alteracoes).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();

    private static async Task<EscalacaoResponse> ResponderEscalacao(Guid id, AppDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EscalacaoProva>().AsNoTracking().Include(x => x.Participantes).Include(x => x.Alteracoes).SingleAsync(x => x.Id == id, ct);
        var configuracao = await db.Set<ProvaCompeticao>().AsNoTracking().SingleAsync(x => x.Id == e.ProvaCompeticaoId, ct);
        var pessoas = await db.Set<Pessoa>().AsNoTracking().Where(x => e.Participantes.Select(p => p.PessoaId).Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        var conflitos = await Conflitos(configuracao, db, ct);
        return new(e.Id, e.Versao, e.Situacao, e.Participantes.Select(p => new ParticipanteEscalacaoResponse(p.PessoaId, pessoas[p.PessoaId].Nome, p.Funcao)).OrderBy(x => x.Funcao).ThenBy(x => x.Nome).ToList(),
            e.Alteracoes.OrderBy(x => x.CreatedAt).Select(a => new AlteracaoEscalacaoResponse(a.Tipo, a.CreatedAt, a.Motivo)).ToList(),
            e.Participantes.SelectMany(p => conflitos.GetValueOrDefault(p.PessoaId) ?? []).Distinct().ToList());
    }

    private static async Task ExigirCandidatoOuEmbaixador(AppDbContext db, Guid pessoaId, DateOnly data, CancellationToken ct)
    {
        var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(x => x.Id == pessoaId, ct) ?? throw new RegistroNaoEncontradoException();
        Exigir(await db.Set<JornadaEmbaixador>().AnyAsync(x => x.PessoaId == pessoaId, ct) && pessoa.DataNascimento is { } nascimento && Idade(nascimento, data) is >= 9 and < 18,
            "Somente Candidatos e Embaixadores podem receber aptidão nesta data.");
    }
}

public sealed record ModalidadeRequest([property: Required, StringLength(100)] string Nome);
public sealed record AlterarModalidadeRequest(Guid Versao, [property: Required, StringLength(100)] string Nome, bool Ativa);
public sealed record ProvaRequest(Guid ModalidadeId, [property: Required, StringLength(150)] string Nome, NaturezaProva Natureza, TipoReferenciaProva TipoReferencia);
public sealed record AlterarProvaRequest(Guid Versao, Guid ModalidadeId, [property: Required, StringLength(150)] string Nome, NaturezaProva Natureza, TipoReferenciaProva TipoReferencia, bool Ativa);
public sealed record AptidaoRequest(Guid PessoaId, Guid ProvaId, DateOnly DataInicio);
public sealed record EncerrarAptidaoRequest(Guid Versao, DateOnly DataFim, [property: Required, StringLength(500)] string Motivo);
public sealed record CompeticaoRequest([property: Required, StringLength(200)] string Nome, DateOnly DataInicio, DateOnly DataFim, DateOnly DataBaseCategoria, [property: StringLength(500)] string? Local, [property: StringLength(4000)] string? Observacoes)
{
    public Competicao Entidade(Guid igrejaId) => new() { IgrejaId = igrejaId, Nome = Nome.Trim(), DataInicio = DataInicio, DataFim = DataFim, DataBaseCategoria = DataBaseCategoria, Local = Local?.Trim(), Observacoes = Observacoes?.Trim() };
    public void Aplicar(Competicao c) { c.Nome = Nome.Trim(); c.DataInicio = DataInicio; c.DataFim = DataFim; c.DataBaseCategoria = DataBaseCategoria; c.Local = Local?.Trim(); c.Observacoes = Observacoes?.Trim(); }
}
public sealed record AlterarCompeticaoRequest(Guid Versao, CompeticaoRequest Dados);
public sealed record ProvaCompeticaoRequest(Guid ProvaId, List<CategoriaCompeticao> Categorias, int MinimoTitulares, int MaximoParticipantes, int MaximoReservas, int? QuantidadeExataTitulares, [property: StringLength(500)] string? Referencia, DateOnly? Data, TimeOnly? HoraInicio, TimeOnly? HoraFim)
{
    public ProvaCompeticao Entidade(Guid igrejaId, Guid competicaoId)
    {
        var entidade = new ProvaCompeticao { IgrejaId = igrejaId, CompeticaoId = competicaoId, ProvaId = ProvaId, MinimoTitulares = MinimoTitulares, MaximoParticipantes = MaximoParticipantes, MaximoReservas = MaximoReservas, QuantidadeExataTitulares = QuantidadeExataTitulares, Referencia = Referencia?.Trim(), Data = Data, HoraInicio = HoraInicio, HoraFim = HoraFim };
        entidade.Categorias.AddRange(Categorias.Select(x => new CategoriaProvaCompeticao { IgrejaId = igrejaId, ProvaCompeticaoId = entidade.Id, Categoria = x })); return entidade;
    }
    public void Aplicar(ProvaCompeticao entidade)
    {
        entidade.MinimoTitulares = MinimoTitulares; entidade.MaximoParticipantes = MaximoParticipantes; entidade.MaximoReservas = MaximoReservas; entidade.QuantidadeExataTitulares = QuantidadeExataTitulares; entidade.Referencia = Referencia?.Trim(); entidade.Data = Data; entidade.HoraInicio = HoraInicio; entidade.HoraFim = HoraFim;
        entidade.Categorias.Clear(); entidade.Categorias.AddRange(Categorias.Select(x => new CategoriaProvaCompeticao { IgrejaId = entidade.IgrejaId, ProvaCompeticaoId = entidade.Id, Categoria = x }));
    }
}
public sealed record AlterarProvaCompeticaoRequest(Guid Versao, Guid VersaoEscalacao, ProvaCompeticaoRequest Dados);
public sealed record ParticipanteEscalacaoRequest(Guid PessoaId, FuncaoEscalacao Funcao);
public sealed record EscalacaoRequest(Guid Versao, List<ParticipanteEscalacaoRequest> Participantes);
public sealed record ReabrirEscalacaoRequest(Guid Versao, [property: Required, StringLength(500)] string Motivo);
public sealed record ModalidadeResponse(Guid Id, Guid Versao, string Nome, bool Ativa, List<ProvaResponse> Provas);
public sealed record ProvaResponse(Guid Id, Guid Versao, string Nome, NaturezaProva Natureza, TipoReferenciaProva TipoReferencia, bool Ativa);
public sealed record AptidaoResponse(Guid Id, Guid Versao, Guid PessoaId, string Pessoa, Guid ProvaId, string Prova, DateOnly DataInicio, DateOnly? DataFim, string? MotivoFim);
public sealed record CompeticaoResumoResponse(Guid Id, Guid Versao, string Nome, DateOnly DataInicio, DateOnly DataFim, DateOnly DataBaseCategoria, string? Local, int QuantidadeProvas);
public sealed record CompeticaoDetalheResponse(Guid Id, Guid Versao, string Nome, DateOnly DataInicio, DateOnly DataFim, DateOnly DataBaseCategoria, string? Local, string? Observacoes, List<ProvaCompeticaoResponse> Provas);
public sealed record ProvaCompeticaoResponse(Guid Id, Guid Versao, Guid ProvaId, string Prova, string Modalidade, NaturezaProva Natureza, TipoReferenciaProva TipoReferencia, List<CategoriaCompeticao> Categorias, int MinimoTitulares, int MaximoParticipantes, int MaximoReservas, int? QuantidadeExataTitulares, string? Referencia, DateOnly? Data, TimeOnly? HoraInicio, TimeOnly? HoraFim, EscalacaoResponse Escalacao);
public sealed record CandidatoEscalacaoResponse(Guid PessoaId, string Nome, string FaixaEtaria, List<string> Conflitos);
public sealed record ParticipanteEscalacaoResponse(Guid PessoaId, string Nome, FuncaoEscalacao Funcao);
public sealed record AlteracaoEscalacaoResponse(TipoAlteracaoEscalacao Tipo, DateTimeOffset RegistradoEm, string? Motivo);
public sealed record EscalacaoResponse(Guid Id, Guid Versao, SituacaoEscalacao Situacao, List<ParticipanteEscalacaoResponse> Participantes, List<AlteracaoEscalacaoResponse> Alteracoes, List<string> Avisos);
