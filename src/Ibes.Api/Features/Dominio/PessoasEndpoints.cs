using System.ComponentModel.DataAnnotations;
using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Progressao;
using Ibes.Embaixadas;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.Api.Features.Dominio;

public static class PessoasEndpoints
{
    public static void MapPessoas(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/v1/pessoas").AddEndpointFilter<ValidacaoFilter>().WithTags("Pessoas");
        grupo.MapGet("/", async (string? busca, string? condicao, bool? incluirInativos, int? pagina, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            Exigir((pagina ?? 1) is >= 1 and <= 10000 && (busca?.Length ?? 0) <= 100, "Busca ou página inválida.");
            var query = db.Set<Pessoa>().AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(busca)) query = query.Where(p => p.Nome.Contains(busca));
            var filtro = condicao?.ToLowerInvariant();
            if (filtro == "inativos") query = query.Where(p => !p.Ativa);
            else if (incluirInativos != true) query = query.Where(p => p.Ativa);
            if (filtro != "inativos")
            {
                var hoje = relogio.Hoje;
                var conselheirosVigentes = db.Set<Conselheiro>()
                    .Where(c => c.DataInicio <= hoje && (c.DataFim == null || c.DataFim >= hoje))
                    .Select(c => c.PessoaId);
                query = query.Where(p => !conselheirosVigentes.Contains(p.Id));
            }
            var pessoas = await query.OrderBy(p => p.Nome).ThenBy(p => p.Id).ToListAsync(ct);
            var ids = pessoas.Select(p => p.Id).ToArray();
            var jornadas = await db.Set<JornadaEmbaixador>().AsNoTracking().Include(j => j.Postos).Where(j => ids.Contains(j.PessoaId)).ToListAsync(ct);
            var resultados = pessoas.Select(p => new PessoaResumo(p.Id, p.Versao, p.Nome, p.DataNascimento,
                p.DataNascimento is { } nascimento ? jornadas.SingleOrDefault(j => j.PessoaId == p.Id)?.Situacao(nascimento, relogio.Hoje) : null, p.Ativa)).ToList();
            resultados = filtro switch
            {
                "embaixadores" => resultados.Where(x => x.Situacao?.StartsWith("Embaixador") == true).ToList(),
                "candidatos" => resultados.Where(x => x.Situacao == "Candidato").ToList(),
                "visitantes" => resultados.Where(x => x.Situacao is null).ToList(),
                null or "" or "todos" or "inativos" => resultados,
                _ => throw new RegraNegocioException("Filtro de condição inválido.")
            };
            var total = resultados.Count;
            return TypedResults.Ok(new PessoasResponse(total, resultados.Skip(((pagina ?? 1) - 1) * 20).Take(20).ToList()));
        }).RequireAuthorization(Permissoes.ConsultarPessoas).WithName("ListarPessoas");
        grupo.MapGet("/{id:guid}", async (Guid id, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().AsNoTracking().SingleOrDefaultAsync(p => p.Id == id, ct);
            if (pessoa is null) return Results.NotFound();
            var responsaveis = await db.Set<ResponsavelPessoa>().AsNoTracking().Where(r => r.PessoaId == id)
                .OrderBy(r => r.Nome)
                .Select(r => new ResponsavelResponse(r.Id, r.Versao, r.Relacao, r.Nome, r.TelefoneWhatsApp, r.MoraComOEmbaixador)).ToListAsync(ct);
            var vinculos = await db.Set<VinculoEclesiastico>().Where(v => v.PessoaId == id).OrderByDescending(v => v.DataInicio)
                .Select(v => new VinculoResponse(v.Id, v.Versao, v.NomeIgreja, v.Tipo, v.DataInicio, v.DataFim)).ToListAsync(ct);
            var alteracoes = await db.Set<AlteracaoSituacaoPessoa>().AsNoTracking().Where(x => x.PessoaId == id)
                .OrderByDescending(x => x.Data).ThenByDescending(x => x.CreatedAt)
                .Select(x => new AlteracaoSituacaoPessoaResponse(x.Tipo, x.Data, x.Motivo, x.CreatedAt)).ToListAsync(ct);
            var possuiJornada = await db.Set<JornadaEmbaixador>().AnyAsync(j => j.PessoaId == id, ct);
            var hoje = relogio.Hoje;
            var conselheiroVigente = await db.Set<Conselheiro>().AnyAsync(c => c.PessoaId == id && c.DataInicio <= hoje && (c.DataFim == null || c.DataFim >= hoje), ct);
            return Results.Ok(new PessoaResponse(pessoa.Id, pessoa.Versao, DadosPessoa.De(pessoa),
                pessoa.DataNascimento is { } nascimento ? FaixaEtaria(nascimento, relogio.Hoje) : null,
                await db.Set<FotoPessoa>().AnyAsync(f => f.PessoaId == id, ct), responsaveis, vinculos,
                await FrequenciaEndpoints.PrimeiraReuniao(db, id, ct), pessoa.Ativa, possuiJornada, conselheiroVigente, alteracoes));
        }).RequireAuthorization(Permissoes.ConsultarPessoas).Produces<PessoaResponse>().WithName("ConsultarPessoa");
        grupo.MapPost("/", async (DadosPessoa dados, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            dados.Validar(relogio.Hoje);
            var pessoa = new Pessoa { IgrejaId = tenant.IgrejaId };
            dados.Aplicar(pessoa); db.Add(pessoa); await db.SaveChangesAsync(ct);
            return TypedResults.Created($"/api/v1/pessoas/{pessoa.Id}", new IdResponse(pessoa.Id, pessoa.Versao));
        }).RequireAuthorization(Permissoes.EditarPessoas).WithName("CadastrarPessoa");
        grupo.MapPut("/{id:guid}", async (Guid id, AlterarPessoaRequest request, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct);
            if (pessoa is null) return Results.NotFound();
            var resultados = new List<ValidationResult>();
            Exigir(request.Dados is not null && Validator.TryValidateObject(request.Dados, new ValidationContext(request.Dados), resultados, true), "Dados pessoais inválidos.");
            request.Dados!.Validar(relogio.Hoje);
            if (request.Dados.DataNascimento != pessoa.DataNascimento)
            {
                var inicios = await db.Set<Ibes.Embaixadas.Conselheiro>().Where(c => c.PessoaId == id).Select(c => c.DataInicio).ToListAsync(ct);
                Exigir(inicios.All(inicio => request.Dados.DataNascimento is { } nascimento && Idade(nascimento, inicio) >= 18),
                    "A data de nascimento deve preservar a idade adulta em todos os vínculos de Conselheiro.");
            }
            Exigir(request.Dados.DataNascimento == pessoa.DataNascimento || !await db.Set<JornadaEmbaixador>().AnyAsync(j => j.PessoaId == id, ct),
                "A data de nascimento está vinculada a uma trajetória histórica e não pode ser alterada por este cadastro.");
            Operacao.ConferirVersao(pessoa, request.Versao); request.Dados.Aplicar(pessoa);
            await db.SaveChangesAsync(ct); return Results.Ok(new IdResponse(pessoa.Id, pessoa.Versao));
        }).RequireAuthorization(Permissoes.EditarPessoas).Produces<IdResponse>().WithName("AlterarPessoa");
        grupo.MapPost("/{id:guid}/inativacao", async (Guid id, AlterarSituacaoPessoaRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(pessoa.Ativa, "A pessoa já está inativa.");
            ValidarAlteracaoSituacao(pessoa, request, relogio.Hoje);
            Operacao.ConferirVersao(pessoa, request.Versao); pessoa.Ativa = false;
            db.Add(new AlteracaoSituacaoPessoa { IgrejaId = tenant.IgrejaId, PessoaId = id, Tipo = TipoAlteracaoSituacaoPessoa.Inativacao, Data = request.Data, Motivo = request.Motivo.Trim(), RegistradoPor = tenant.UsuarioId!.Value });
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(pessoa.Id, pessoa.Versao));
        }).RequireAuthorization(Permissoes.EditarPessoas).Produces<IdResponse>();
        grupo.MapPost("/{id:guid}/reativacao", async (Guid id, AlterarSituacaoPessoaRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct) ?? throw new RegistroNaoEncontradoException();
            Exigir(!pessoa.Ativa, "A pessoa já está ativa.");
            ValidarAlteracaoSituacao(pessoa, request, relogio.Hoje);
            var ultima = await db.Set<AlteracaoSituacaoPessoa>().Where(x => x.PessoaId == id).MaxAsync(x => (DateOnly?)x.Data, ct);
            Exigir(ultima is null || request.Data >= ultima, "A reativação não pode anteceder a última alteração de situação.");
            Operacao.ConferirVersao(pessoa, request.Versao); pessoa.Ativa = true;
            db.Add(new AlteracaoSituacaoPessoa { IgrejaId = tenant.IgrejaId, PessoaId = id, Tipo = TipoAlteracaoSituacaoPessoa.Reativacao, Data = request.Data, Motivo = request.Motivo.Trim(), RegistradoPor = tenant.UsuarioId!.Value });
            await db.SaveChangesAsync(ct); return TypedResults.Ok(new IdResponse(pessoa.Id, pessoa.Versao));
        }).RequireAuthorization(Permissoes.EditarPessoas).Produces<IdResponse>();
        grupo.MapPost("/{id:guid}/responsaveis", async (Guid id, ResponsavelRequest request, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct);
            if (pessoa is null) return Results.NotFound();
            Exigir(pessoa.Ativa, "Não é possível criar vínculos para uma pessoa inativa.");
            ValidarResponsavel(request.Relacao, request.Nome, request.TelefoneWhatsApp);
            Operacao.ConferirVersao(pessoa, request.VersaoPessoa);
            var responsavel = new ResponsavelPessoa { IgrejaId = tenant.IgrejaId, PessoaId = id };
            AplicarResponsavel(responsavel, request.Relacao, request.Nome, request.TelefoneWhatsApp, request.MoraComOEmbaixador);
            db.Add(responsavel); await db.SaveChangesAsync(ct); return Results.Ok(new IdResponse(responsavel.Id, responsavel.Versao));
        }).RequireAuthorization(Permissoes.EditarPessoas).Produces<IdResponse>();
        grupo.MapPut("/{id:guid}/responsaveis/{responsavelId:guid}", async (Guid id, Guid responsavelId, AlterarResponsavelRequest request, AppDbContext db, CancellationToken ct) =>
        {
            var responsavel = await db.Set<ResponsavelPessoa>().SingleOrDefaultAsync(r => r.Id == responsavelId && r.PessoaId == id, ct);
            if (responsavel is null) return Results.NotFound();
            ValidarResponsavel(request.Relacao, request.Nome, request.TelefoneWhatsApp);
            Operacao.ConferirVersao(responsavel, request.Versao);
            AplicarResponsavel(responsavel, request.Relacao, request.Nome, request.TelefoneWhatsApp, request.MoraComOEmbaixador);
            await db.SaveChangesAsync(ct); return Results.Ok(new IdResponse(responsavel.Id, responsavel.Versao));
        }).RequireAuthorization(Permissoes.EditarPessoas).Produces<IdResponse>();
        grupo.MapDelete("/{id:guid}/responsaveis/{responsavelId:guid}", async (Guid id, Guid responsavelId, Guid versao, AppDbContext db, CancellationToken ct) =>
        {
            var responsavel = await db.Set<ResponsavelPessoa>().SingleOrDefaultAsync(r => r.Id == responsavelId && r.PessoaId == id, ct);
            if (responsavel is null) return Results.NotFound();
            Operacao.ConferirVersao(responsavel, versao);
            db.Remove(responsavel); await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.EditarPessoas);
        grupo.MapPost("/{id:guid}/vinculos-eclesiasticos", async (Guid id, VinculoRequest request, AppDbContext db, TenantContext tenant, Relogio relogio, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct);
            if (pessoa is null) return Results.NotFound();
            Exigir(pessoa.Ativa, "Não é possível criar vínculos para uma pessoa inativa.");
            Exigir(request.Tipo is "Membro" or "Congregado", "Tipo de vínculo deve ser Membro ou Congregado.");
            Operacao.ValidarPeriodo(request.DataInicio, null, relogio.Hoje); Operacao.ConferirVersao(pessoa, request.Versao);
            var vinculo = new VinculoEclesiastico { IgrejaId = tenant.IgrejaId, PessoaId = id, NomeIgreja = request.NomeIgreja.Trim(), Tipo = request.Tipo, DataInicio = request.DataInicio };
            db.Add(vinculo); await db.SaveChangesAsync(ct); return Results.Ok(new IdResponse(vinculo.Id, vinculo.Versao));
        }).RequireAuthorization(Permissoes.EditarPessoas).Produces<IdResponse>();
        grupo.MapPost("/{id:guid}/vinculos-eclesiasticos/{vinculoId:guid}/encerramento", async (Guid id, Guid vinculoId, EncerrarVinculoRequest request, AppDbContext db, Relogio relogio, CancellationToken ct) =>
        {
            var vinculo = await db.Set<VinculoEclesiastico>().SingleOrDefaultAsync(v => v.Id == vinculoId && v.PessoaId == id, ct);
            if (vinculo is null) return Results.NotFound();
            Exigir(vinculo.DataFim is null, "Vínculo já encerrado."); Operacao.ValidarPeriodo(vinculo.DataInicio, request.DataFim, relogio.Hoje);
            Operacao.ConferirVersao(vinculo, request.Versao); vinculo.DataFim = request.DataFim; await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.EditarPessoas);
        grupo.MapGet("/{id:guid}/foto", async (Guid id, AppDbContext db, CancellationToken ct) =>
        {
            var foto = await db.Set<FotoPessoa>().AsNoTracking().SingleOrDefaultAsync(f => f.PessoaId == id, ct);
            return foto is null ? Results.NotFound() : Results.File(foto.Conteudo, foto.TipoConteudo);
        }).RequireAuthorization(Permissoes.ConsultarPessoas);
        grupo.MapPost("/{id:guid}/foto", async (Guid id, HttpRequest request, AppDbContext db, TenantContext tenant, CancellationToken ct) =>
        {
            var pessoa = await db.Set<Pessoa>().SingleOrDefaultAsync(p => p.Id == id, ct);
            if (pessoa is null) return Results.NotFound();
            Exigir(request.HasFormContentType && request.ContentLength is > 0 and <= 2200000, "Envie uma foto PNG ou JPEG de até 2 MB.");
            var form = await request.ReadFormAsync(ct);
            Exigir(Guid.TryParse(form["versao"], out var versao), "Informe a versão do cadastro.");
            Operacao.ConferirVersao(pessoa, versao);
            var arquivo = form.Files.GetFile("foto");
            Exigir(arquivo is not null && arquivo.Length is > 0 and <= 2097152, "Foto inválida ou maior que 2 MB.");
            using var stream = new MemoryStream(); await arquivo!.CopyToAsync(stream, ct); var bytes = stream.ToArray();
            var tipo = bytes.AsSpan().StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) ? "image/png"
                : bytes.AsSpan().StartsWith(new byte[] { 255, 216, 255 }) ? "image/jpeg" : null;
            Exigir(tipo is not null, "Use uma imagem PNG ou JPEG.");
            var foto = await db.Set<FotoPessoa>().SingleOrDefaultAsync(f => f.PessoaId == id, ct);
            if (foto is null) { foto = new FotoPessoa { IgrejaId = tenant.IgrejaId, PessoaId = id }; db.Add(foto); }
            foto.Conteudo = bytes; foto.TipoConteudo = tipo!; await db.SaveChangesAsync(ct); return Results.NoContent();
        }).RequireAuthorization(Permissoes.EditarPessoas)
            .RequireRateLimiting("upload")
            .WithMetadata(new RequestSizeLimitAttribute(2_200_000));
    }

    private static void ValidarAlteracaoSituacao(Pessoa pessoa, AlterarSituacaoPessoaRequest request, DateOnly hoje)
    {
        Exigir(request.Data != default && request.Data <= hoje &&
            (pessoa.DataNascimento is null || request.Data >= pessoa.DataNascimento) &&
            !string.IsNullOrWhiteSpace(request.Motivo) && request.Motivo.Length <= 500,
            "Informe data e motivo válidos para a alteração da situação.");
    }

    private static void ValidarResponsavel(string relacao, string nome, string? telefoneWhatsApp) =>
        Exigir(!string.IsNullOrWhiteSpace(relacao) && relacao.Length <= 80 && !string.IsNullOrWhiteSpace(nome) && nome.Length <= 200 && (telefoneWhatsApp?.Length ?? 0) <= 40,
            "Informe relação, nome e telefone/WhatsApp válidos para o responsável.");

    private static void AplicarResponsavel(ResponsavelPessoa responsavel, string relacao, string nome, string? telefoneWhatsApp, bool? moraComOEmbaixador)
    {
        responsavel.Relacao = relacao.Trim(); responsavel.Nome = nome.Trim();
        responsavel.TelefoneWhatsApp = string.IsNullOrWhiteSpace(telefoneWhatsApp) ? null : telefoneWhatsApp.Trim();
        responsavel.MoraComOEmbaixador = moraComOEmbaixador;
    }
}

public sealed record DadosPessoa(
    [property: Required(ErrorMessage = "Informe o nome."), StringLength(200)] string Nome,
    DateOnly? DataNascimento, [property: StringLength(200)] string? Naturalidade, [property: StringLength(40)] string? WhatsApp,
    [property: StringLength(500)] string? Endereco, DateOnly? DataBatismo, [property: StringLength(200)] string? LocalBatismo,
    [property: StringLength(80)] string? NumeroCarteira, [property: StringLength(100)] string? SituacaoCarteira, bool? PossuiBiblia, [property: StringLength(4000)] string? Observacoes)
{
    public void Validar(DateOnly hoje)
    {
        Exigir(DataNascimento is null || DataNascimento != default(DateOnly) && DataNascimento <= hoje, "Data de nascimento inválida.");
        Exigir(DataBatismo is null || DataBatismo != default(DateOnly) && DataBatismo <= hoje && (DataNascimento is null || DataBatismo >= DataNascimento), "Data de batismo inválida.");
    }
    public void Aplicar(Pessoa p)
    {
        p.Nome = Nome.Trim(); p.DataNascimento = DataNascimento; p.Naturalidade = Naturalidade; p.WhatsApp = WhatsApp;
        p.Endereco = Endereco; p.DataBatismo = DataBatismo; p.LocalBatismo = LocalBatismo; p.NumeroCarteira = NumeroCarteira;
        p.SituacaoCarteira = SituacaoCarteira; p.PossuiBiblia = PossuiBiblia; p.Observacoes = Observacoes;
    }
    public static DadosPessoa De(Pessoa p) => new(p.Nome, p.DataNascimento, p.Naturalidade, p.WhatsApp, p.Endereco, p.DataBatismo, p.LocalBatismo, p.NumeroCarteira, p.SituacaoCarteira, p.PossuiBiblia, p.Observacoes);
}
public sealed record AlterarPessoaRequest(Guid Versao, [property: Required] DadosPessoa Dados);
public sealed record AlterarSituacaoPessoaRequest(Guid Versao, DateOnly Data, [property: Required, StringLength(500)] string Motivo);
public sealed record ResponsavelRequest(Guid VersaoPessoa, [property: Required, StringLength(80)] string Relacao, [property: Required, StringLength(200)] string Nome, [property: StringLength(40)] string? TelefoneWhatsApp, bool? MoraComOEmbaixador);
public sealed record AlterarResponsavelRequest(Guid Versao, [property: Required, StringLength(80)] string Relacao, [property: Required, StringLength(200)] string Nome, [property: StringLength(40)] string? TelefoneWhatsApp, bool? MoraComOEmbaixador);
public sealed record VinculoRequest(Guid Versao, [property: Required, StringLength(200)] string NomeIgreja, [property: Required] string Tipo, DateOnly DataInicio);
public sealed record PessoasResponse(int Total, List<PessoaResumo> Pessoas);
public sealed record PessoaResumo(Guid Id, Guid Versao, string Nome, DateOnly? DataNascimento, string? Situacao, bool Ativa);
public sealed record PessoaResponse(Guid Id, Guid Versao, DadosPessoa Dados, string? FaixaEtaria, bool PossuiFoto, List<ResponsavelResponse> Responsaveis, List<VinculoResponse> Vinculos, DateOnly? PrimeiraReuniao, bool Ativa, bool PossuiJornada, bool ConselheiroVigente, List<AlteracaoSituacaoPessoaResponse> AlteracoesSituacao);
public sealed record AlteracaoSituacaoPessoaResponse(TipoAlteracaoSituacaoPessoa Tipo, DateOnly Data, string Motivo, DateTimeOffset RegistradoEm);
public sealed record ResponsavelResponse(Guid Id, Guid Versao, string Relacao, string Nome, string? TelefoneWhatsApp, bool? MoraComOEmbaixador);
public sealed record VinculoResponse(Guid Id, Guid Versao, string NomeIgreja, string Tipo, DateOnly DataInicio, DateOnly? DataFim);
