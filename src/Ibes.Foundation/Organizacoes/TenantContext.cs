namespace Ibes.Foundation.Organizacoes;

public sealed class TenantContext
{
    public Guid IgrejaId { get; private set; }
    public Guid? UsuarioId { get; private set; }
    public string TraceId { get; private set; } = "bootstrap";

    public void Definir(Guid igrejaId, Guid? usuarioId, string traceId)
    {
        if (igrejaId == Guid.Empty || (IgrejaId != Guid.Empty && IgrejaId != igrejaId))
            throw new InvalidOperationException("Contexto de Igreja inválido ou já definido.");
        IgrejaId = igrejaId;
        UsuarioId = usuarioId;
        TraceId = traceId;
    }
}

public interface ITenantEntity
{
    Guid IgrejaId { get; }
}
