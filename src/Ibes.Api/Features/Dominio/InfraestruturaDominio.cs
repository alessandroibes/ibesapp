using System.ComponentModel.DataAnnotations;
using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Embaixadas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Api.Features.Dominio;

public sealed class Relogio(TimeProvider time, IConfiguration config)
{
    public DateOnly Hoje => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(time.GetUtcNow(),
        TimeZoneInfo.FindSystemTimeZoneById(config["Calendario:FusoHorario"] ?? "America/Sao_Paulo")).DateTime);
}

public sealed class ValidacaoFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var erros = new Dictionary<string, string[]>();
        void Validar(object? argument)
        {
            if (argument is null || argument.GetType().Namespace != typeof(ValidacaoFilter).Namespace) return;
            var resultados = new List<ValidationResult>();
            if (!Validator.TryValidateObject(argument!, new ValidationContext(argument!), resultados, true))
                foreach (var resultado in resultados)
                {
                    var campo = resultado.MemberNames.FirstOrDefault() ?? "dados";
                    erros[campo] = [$"Valor inválido para {campo}."];
                }
            foreach (var propriedade in argument.GetType().GetProperties()) Validar(propriedade.GetValue(argument));
        }
        foreach (var argument in context.Arguments) Validar(argument);
        return erros.Count > 0 ? Results.ValidationProblem(erros) : await next(context);
    }
}

public static class Operacao
{
    public static void ConferirVersao(Entidade entidade, Guid versao)
    {
        if (entidade.Versao != versao) throw new DbUpdateConcurrencyException();
        entidade.Versao = Guid.NewGuid();
    }
    public static void ValidarPeriodo(DateOnly inicio, DateOnly? fim, DateOnly hoje)
    {
        Datas.Exigir(inicio != default && inicio <= hoje && (fim is null || fim >= inicio && fim <= hoje), "Período inválido.");
    }
    public static async Task ExigirConselheiro(AppDbContext db, TenantContext tenant, DateOnly hoje, CancellationToken ct)
    {
        if (!await db.Set<Conselheiro>().AnyAsync(c => c.UsuarioId == tenant.UsuarioId && c.DataInicio <= hoje && (c.DataFim == null || c.DataFim >= hoje), ct))
            throw new AcessoConselheiroException();
    }
}

public sealed class AcessoConselheiroException : Exception;
public sealed record VersaoRequest(Guid Versao);
public sealed record EncerrarVinculoRequest(Guid Versao, DateOnly DataFim);
public sealed record IdResponse(Guid Id, Guid Versao);
