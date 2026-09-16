using System.ComponentModel.DataAnnotations;
using Ibes.ConsuladosDiretoria;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Progressao;
using Microsoft.EntityFrameworkCore;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Api.Features.Dominio;

public static class OrganizacaoEndpoints
{
    public static void MapOrganizacao(this WebApplication app)
    {
        var g = app.MapGroup("/api/v1/organizacao").WithTags("Organização interna").AddEndpointFilter<ValidacaoFilter>();
        g.MapGet("/", async (AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var pessoas = await db.Set<Pessoa>().AsNoTracking().ToDictionaryAsync(x => x.Id, ct);
            var igreja = await db.Igrejas.AsNoTracking().SingleAsync(ct);
            var vinculos = await db.Set<VinculoEclesiastico>().AsNoTracking().ToListAsync(ct);
            var consulados = await db.Set<Consulado>().AsNoTracking().OrderBy(x => x.Nome).ToListAsync(ct);
            var membros = await db.Set<MembroConsulado>().AsNoTracking().OrderByDescending(x => x.DataInicio).ToListAsync(ct);
            var liderancas = await db.Set<LiderancaConsulado>().AsNoTracking().OrderByDescending(x => x.DataInicio).ToListAsync(ct);
            var mandatos = await db.Set<MandatoDiretoria>().AsNoTracking().OrderByDescending(x => x.DataInicio).ToListAsync(ct);
            var cargos = await db.Set<CargoEmbaixada>().AsNoTracking().OrderBy(x => x.Nome).ToListAsync(ct);
            var ocupacoes = await db.Set<OcupacaoCargo>().AsNoTracking().OrderByDescending(x => x.DataInicio).ToListAsync(ct);
            var eleicoes = await db.Set<ResultadoEleicao>().AsNoTracking().OrderByDescending(x => x.Data).ToListAsync(ct);
            bool MembroIgreja(Guid pessoaId, DateOnly data) => vinculos.Any(v => v.PessoaId == pessoaId && string.Equals(v.Tipo.Trim(), "Membro", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(v.NomeIgreja.Trim(), igreja.Nome.Trim(), StringComparison.OrdinalIgnoreCase) && v.DataInicio <= data && (v.DataFim is null || v.DataFim >= data));
            return TypedResults.Ok(new OrganizacaoResponse(
                consulados.Select(c => new ConsuladoResponse(c.Id, c.Versao, c.Nome, c.DataInicio, c.DataFim,
                    membros.Where(m => m.ConsuladoId == c.Id).Select(m => new MembroConsuladoResponse(m.Id, m.Versao, m.PessoaId, pessoas[m.PessoaId].Nome, m.DataInicio, m.DataFim, m.MotivoFim)).ToList(),
                    liderancas.Where(l => l.ConsuladoId == c.Id).Select(l => new ConsulResponse(l.Id, l.Versao, l.PessoaId, pessoas[l.PessoaId].Nome, l.DataInicio, l.DataFim, l.MotivoFim)).ToList())).ToList(),
                cargos.Select(c => new CargoResponse(c.Id, c.Versao, c.Nome, c.QuantidadeVagas, c.Ativo)).ToList(),
                mandatos.Select(m => new MandatoResponse(m.Id, m.Versao, m.Nome, m.DataInicio, m.DataFim, m.Observacoes,
                    ocupacoes.Where(o => o.MandatoDiretoriaId == m.Id).Select(o => new OcupacaoResponse(o.Id, o.Versao, o.CargoEmbaixadaId, cargos.Single(c => c.Id == o.CargoEmbaixadaId).Nome,
                        o.PessoaId, pessoas[o.PessoaId].Nome, o.DataInicio, o.DataFim, o.MotivoFim, MembroIgreja(o.PessoaId, o.DataInicio))).ToList(),
                    eleicoes.Where(e => e.MandatoDiretoriaId == m.Id).Select(e => new EleicaoResponse(e.Id, e.CargoEmbaixadaId, cargos.Single(c => c.Id == e.CargoEmbaixadaId).Nome,
                        e.PessoaEscolhidaId, pessoas[e.PessoaEscolhidaId].Nome, e.OcupacaoCargoId, e.Data, e.Motivo)).ToList())).ToList(), relogio.Hoje));
        }).RequireAuthorization(Permissoes.ConsultarOrganizacao);

        g.MapPost("/consulados", async (ConsuladoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var c = new Consulado { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim(), DataInicio = r.DataInicio }; c.Validar(relogio.Hoje);
            db.Add(c); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(c.Id, c.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPut("/consulados/{id:guid}", async (Guid id, AlterarConsuladoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var c = await db.Set<Consulado>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Operacao.ConferirVersao(c, r.Versao); c.Nome = r.Nome.Trim(); c.Validar(relogio.Hoje); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(c.Id, c.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/consulados/{id:guid}/encerramento", async (Guid id, EncerrarOrganizacaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var c = await db.Set<Consulado>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(!await db.Set<MembroConsulado>().AnyAsync(x => x.ConsuladoId == id && (x.DataFim == null || x.DataFim > r.DataFim), ct), "Encerre ou transfira os membros antes do Consulado.");
            Operacao.ConferirVersao(c, r.Versao); c.DataFim = r.DataFim; c.Validar(relogio.Hoje); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/consulados/{id:guid}/membros", async (Guid id, MembroRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var c = await db.Set<Consulado>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(r.DataInicio <= relogio.Hoje, "O vínculo no Consulado não pode começar no futuro.");
            Exigir(c.DataInicio <= r.DataInicio && (c.DataFim is null || r.DataInicio <= c.DataFim), "O vínculo deve começar durante a existência do Consulado.");
            await ExigirJornada(db, r.PessoaId, r.DataInicio, false, ct); Exigir(!await db.Set<MembroConsulado>().AnyAsync(x => x.PessoaId == r.PessoaId && (x.DataFim == null || x.DataFim >= r.DataInicio), ct), "O menino já possui vínculo de Consulado sobreposto a esta data.");
            var m = new MembroConsulado { IgrejaId = tenant.IgrejaId, ConsuladoId = id, PessoaId = r.PessoaId, DataInicio = r.DataInicio }; db.Add(m); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(m.Id, m.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/membros/{id:guid}/encerramento", async (Guid id, EncerrarOrganizacaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var m = await db.Set<MembroConsulado>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            await EncerrarMembro(m, r, db, tenant, relogio.Hoje, ct); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/membros/{id:guid}/transferencia", async (Guid id, TransferenciaRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var atual = await db.Set<MembroConsulado>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var destino = await db.Set<Consulado>().SingleOrDefaultAsync(x => x.Id == r.ConsuladoDestinoId, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(atual.ConsuladoId != destino.Id && destino.DataInicio <= r.Data && (destino.DataFim is null || r.Data <= destino.DataFim), "Destino ou data de transferência inválidos.");
            await EncerrarMembro(atual, new(r.Versao, r.Data, "Transferência de Consulado"), db, tenant, relogio.Hoje, ct);
            var novo = new MembroConsulado { IgrejaId = tenant.IgrejaId, ConsuladoId = destino.Id, PessoaId = atual.PessoaId, DataInicio = r.Data }; db.Add(novo); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(novo.Id, novo.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/consulados/{id:guid}/consul", async (ConsulRequest r, Guid id, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var membro = await db.Set<MembroConsulado>().SingleOrDefaultAsync(x => x.Id == r.MembroConsuladoId && x.ConsuladoId == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(r.DataInicio <= relogio.Hoje, "A liderança do Cônsul não pode começar no futuro.");
            Exigir(membro.DataInicio <= r.DataInicio && (membro.DataFim is null || r.DataInicio <= membro.DataFim), "O Cônsul deve ser membro vigente do Consulado na data.");
            Exigir(!await db.Set<LiderancaConsulado>().AnyAsync(x => x.ConsuladoId == id && (x.DataFim == null || x.DataFim >= r.DataInicio), ct), "O Consulado já possui liderança de Cônsul sobreposta a esta data.");
            var l = new LiderancaConsulado { IgrejaId = tenant.IgrejaId, ConsuladoId = id, MembroConsuladoId = membro.Id, PessoaId = membro.PessoaId, DataInicio = r.DataInicio }; db.Add(l); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(l.Id, l.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/consules/{id:guid}/encerramento", async (Guid id, EncerrarOrganizacaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var l = await db.Set<LiderancaConsulado>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            ValidarEncerramento(l.DataInicio, l.DataFim, r.DataFim, r.Motivo, relogio.Hoje); Operacao.ConferirVersao(l, r.Versao); l.DataFim = r.DataFim; l.MotivoFim = r.Motivo.Trim(); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);

        g.MapPost("/cargos", async (CargoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var c = new CargoEmbaixada { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim(), QuantidadeVagas = r.QuantidadeVagas }; c.Validar(); db.Add(c); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(c.Id, c.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPut("/cargos/{id:guid}", async (Guid id, AlterarCargoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var c = await db.Set<CargoEmbaixada>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var maximo = await MaximoOcupacoesSimultaneas(db, id, ct); Exigir(r.QuantidadeVagas >= maximo, $"Existem {maximo} ocupações simultâneas no histórico deste cargo.");
            Operacao.ConferirVersao(c, r.Versao); c.Nome = r.Nome.Trim(); c.QuantidadeVagas = r.QuantidadeVagas; c.Ativo = r.Ativo; c.Validar(); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(c.Id, c.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/mandatos", async (MandatoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var m = new MandatoDiretoria { IgrejaId = tenant.IgrejaId, Nome = r.Nome.Trim(), DataInicio = r.DataInicio, DataFim = r.DataFim, Observacoes = r.Observacoes }; m.Validar();
            Exigir(!await db.Set<MandatoDiretoria>().AnyAsync(x => x.DataInicio <= m.DataFim && x.DataFim >= m.DataInicio, ct), "Já existe mandato da Diretoria sobreposto neste período."); db.Add(m); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(m.Id, m.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/mandatos/{id:guid}/ocupacoes", async (Guid id, OcupacaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var o = await CriarOcupacao(id, r.VersaoMandato, r.CargoEmbaixadaId, r.PessoaId, r.DataInicio, db, tenant, relogio.Hoje, ct); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(o.Id, o.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/ocupacoes/{id:guid}/encerramento", async (Guid id, EncerrarOrganizacaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); var o = await db.Set<OcupacaoCargo>().SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            var mandato = await db.Set<MandatoDiretoria>().SingleAsync(x => x.Id == o.MandatoDiretoriaId, ct); ValidarEncerramento(o.DataInicio, o.DataFim, r.DataFim, r.Motivo, relogio.Hoje); Exigir(r.DataFim <= mandato.DataFim, "Encerramento posterior ao mandato.");
            Operacao.ConferirVersao(o, r.Versao); o.DataFim = r.DataFim; o.MotivoFim = r.Motivo.Trim(); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
        g.MapPost("/mandatos/{id:guid}/eleicoes", async (Guid id, EleicaoRequest r, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            await Operacao.ExigirConselheiro(db, tenant, relogio.Hoje, ct); Exigir(!string.IsNullOrWhiteSpace(r.Motivo), "Informe o motivo ou identificação da eleição.");
            var o = await CriarOcupacao(id, r.VersaoMandato, r.CargoEmbaixadaId, r.PessoaEscolhidaId, r.Data, db, tenant, relogio.Hoje, ct);
            var e = new ResultadoEleicao { IgrejaId = tenant.IgrejaId, MandatoDiretoriaId = id, CargoEmbaixadaId = r.CargoEmbaixadaId, PessoaEscolhidaId = r.PessoaEscolhidaId, OcupacaoCargoId = o.Id, Data = r.Data, Motivo = r.Motivo.Trim(), RegistradoPor = tenant.UsuarioId!.Value };
            db.Add(e); await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(o.Id, o.Versao));
        }).RequireAuthorization(Permissoes.GerenciarOrganizacao);
    }

    private static async Task EncerrarMembro(MembroConsulado m, EncerrarOrganizacaoRequest r, AppDbContext db, TenantContext tenant, DateOnly hoje, CancellationToken ct)
    {
        ValidarEncerramento(m.DataInicio, m.DataFim, r.DataFim, r.Motivo, hoje); Operacao.ConferirVersao(m, r.Versao); m.DataFim = r.DataFim; m.MotivoFim = r.Motivo.Trim();
        var consul = await db.Set<LiderancaConsulado>().SingleOrDefaultAsync(x => x.MembroConsuladoId == m.Id && x.DataFim == null, ct);
        if (consul is not null) { consul.DataFim = r.DataFim; consul.MotivoFim = r.Motivo.Trim(); }
    }
    private static void ValidarEncerramento(DateOnly inicio, DateOnly? fimAtual, DateOnly fim, string motivo, DateOnly hoje) =>
        Exigir(fimAtual is null && fim >= inicio && fim <= hoje && !string.IsNullOrWhiteSpace(motivo) && motivo.Length <= 500, "Informe data e motivo válidos para o encerramento.");
    private static async Task<(Pessoa Pessoa, JornadaEmbaixador Jornada)> ExigirJornada(AppDbContext db, Guid pessoaId, DateOnly data, bool admitido, CancellationToken ct)
    {
        var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(x => x.Id == pessoaId, ct) ?? throw new RegistroNaoEncontradoException();
        Exigir(pessoa.Ativa, "Somente pessoas ativas podem iniciar um vínculo organizacional.");
        var jornada = await db.Set<JornadaEmbaixador>().Include(x => x.Postos).SingleOrDefaultAsync(x => x.PessoaId == pessoaId, ct) ?? throw new Ibes.Foundation.Domain.RegraNegocioException(admitido ? "Somente Embaixadores podem integrar a Diretoria." : "Somente Candidatos e Embaixadores podem integrar Consulados.");
        Exigir(pessoa.DataNascimento is { } nascimento && Idade(nascimento, data) is >= 9 and < 18 && (!admitido || jornada.Postos.Any(p => p.DataIngresso <= data)), admitido ? "Somente Embaixadores podem integrar a Diretoria na data informada." : "A pessoa deve ser Candidato ou Embaixador na data informada.");
        return (pessoa, jornada);
    }
    private static async Task<OcupacaoCargo> CriarOcupacao(Guid mandatoId, Guid versaoMandato, Guid cargoId, Guid pessoaId, DateOnly data, AppDbContext db, TenantContext tenant, DateOnly hoje, CancellationToken ct)
    {
        Exigir(data <= hoje, "A ocupação não pode começar no futuro."); await ExigirJornada(db, pessoaId, data, true, ct);
        var mandato = await db.Set<MandatoDiretoria>().SingleOrDefaultAsync(x => x.Id == mandatoId, ct) ?? throw new RegistroNaoEncontradoException();
        Operacao.ConferirVersao(mandato, versaoMandato);
        var cargo = await db.Set<CargoEmbaixada>().SingleOrDefaultAsync(x => x.Id == cargoId, ct) ?? throw new RegistroNaoEncontradoException();
        Exigir(cargo.Ativo && data >= mandato.DataInicio && data <= mandato.DataFim, "Cargo inativo ou data fora do mandato.");
        var existentes = await db.Set<OcupacaoCargo>().Where(x => x.MandatoDiretoriaId == mandatoId && x.CargoEmbaixadaId == cargoId && (x.DataFim == null || x.DataFim >= data)).ToListAsync(ct);
        var maiorLotacao = new[] { data }.Concat(existentes.Where(x => x.DataInicio >= data).Select(x => x.DataInicio))
            .Max(ponto => 1 + existentes.Count(x => x.DataInicio <= ponto && (x.DataFim == null || x.DataFim >= ponto)));
        Exigir(maiorLotacao <= cargo.QuantidadeVagas, "Todas as vagas deste cargo estão ocupadas durante o período.");
        mandato.UpdatedAt = DateTimeOffset.UtcNow;
        var o = new OcupacaoCargo { IgrejaId = tenant.IgrejaId, MandatoDiretoriaId = mandatoId, CargoEmbaixadaId = cargoId, PessoaId = pessoaId, DataInicio = data }; db.Add(o); return o;
    }
    private static async Task<int> MaximoOcupacoesSimultaneas(AppDbContext db, Guid cargoId, CancellationToken ct)
    {
        var ocupacoes = await db.Set<OcupacaoCargo>().Where(x => x.CargoEmbaixadaId == cargoId).ToListAsync(ct); if (ocupacoes.Count == 0) return 0;
        return ocupacoes.SelectMany(x => new[] { x.DataInicio, x.DataFim ?? DateOnly.MaxValue }).Distinct().Max(d => ocupacoes.Count(x => x.DataInicio <= d && (x.DataFim is null || x.DataFim >= d)));
    }
}

public sealed record ConsuladoRequest([property: Required, StringLength(80)] string Nome, DateOnly DataInicio);
public sealed record AlterarConsuladoRequest(Guid Versao, [property: Required, StringLength(80)] string Nome);
public sealed record MembroRequest(Guid PessoaId, DateOnly DataInicio);
public sealed record ConsulRequest(Guid MembroConsuladoId, DateOnly DataInicio);
public sealed record EncerrarOrganizacaoRequest(Guid Versao, DateOnly DataFim, [property: Required, StringLength(500)] string Motivo);
public sealed record TransferenciaRequest(Guid Versao, Guid ConsuladoDestinoId, DateOnly Data);
public sealed record CargoRequest([property: Required, StringLength(100)] string Nome, int QuantidadeVagas);
public sealed record AlterarCargoRequest(Guid Versao, [property: Required, StringLength(100)] string Nome, int QuantidadeVagas, bool Ativo);
public sealed record MandatoRequest([property: Required, StringLength(150)] string Nome, DateOnly DataInicio, DateOnly DataFim, [property: StringLength(2000)] string? Observacoes);
public sealed record OcupacaoRequest(Guid VersaoMandato, Guid CargoEmbaixadaId, Guid PessoaId, DateOnly DataInicio);
public sealed record EleicaoRequest(Guid VersaoMandato, Guid CargoEmbaixadaId, Guid PessoaEscolhidaId, DateOnly Data, [property: Required, StringLength(500)] string Motivo);
public sealed record OrganizacaoResponse(List<ConsuladoResponse> Consulados, List<CargoResponse> Cargos, List<MandatoResponse> Mandatos, DateOnly Hoje);
public sealed record ConsuladoResponse(Guid Id, Guid Versao, string Nome, DateOnly DataInicio, DateOnly? DataFim, List<MembroConsuladoResponse> Membros, List<ConsulResponse> Consules);
public sealed record MembroConsuladoResponse(Guid Id, Guid Versao, Guid PessoaId, string Nome, DateOnly DataInicio, DateOnly? DataFim, string? MotivoFim);
public sealed record ConsulResponse(Guid Id, Guid Versao, Guid PessoaId, string Nome, DateOnly DataInicio, DateOnly? DataFim, string? MotivoFim);
public sealed record CargoResponse(Guid Id, Guid Versao, string Nome, int QuantidadeVagas, bool Ativo);
public sealed record MandatoResponse(Guid Id, Guid Versao, string Nome, DateOnly DataInicio, DateOnly DataFim, string? Observacoes, List<OcupacaoResponse> Ocupacoes, List<EleicaoResponse> Eleicoes);
public sealed record OcupacaoResponse(Guid Id, Guid Versao, Guid CargoId, string Cargo, Guid PessoaId, string Nome, DateOnly DataInicio, DateOnly? DataFim, string? MotivoFim, bool MembroIgreja);
public sealed record EleicaoResponse(Guid Id, Guid CargoId, string Cargo, Guid PessoaId, string Nome, Guid OcupacaoId, DateOnly Data, string Motivo);
