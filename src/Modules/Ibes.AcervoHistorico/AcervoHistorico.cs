using Ibes.Foundation.Domain;
using static Ibes.Foundation.Domain.Datas;

namespace Ibes.AcervoHistorico;

public sealed class MarcoHistorico : Entidade
{
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public string Titulo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public string Categoria { get; set; } = "";
    public Guid? AtividadeAgendaId { get; set; }
    public Guid AutorId { get; set; }
    public List<PessoaMarcoHistorico> Pessoas { get; set; } = [];
    public List<AnexoMarcoHistorico> Anexos { get; set; } = [];

    public void Validar()
    {
        Exigir(DataInicio != default && (DataFim is null || DataFim >= DataInicio), "Informe um período válido.");
        Exigir(!string.IsNullOrWhiteSpace(Titulo) && Titulo.Length <= 200, "Informe o título com até 200 caracteres.");
        Exigir(!string.IsNullOrWhiteSpace(Descricao) && Descricao.Length <= 10000, "Informe a descrição com até 10.000 caracteres.");
        Exigir(!string.IsNullOrWhiteSpace(Categoria) && Categoria.Length <= 100, "Informe a categoria com até 100 caracteres.");
    }
}

public sealed class PessoaMarcoHistorico : Entidade
{
    public Guid MarcoHistoricoId { get; set; }
    public Guid PessoaId { get; set; }
}

public sealed class AnexoMarcoHistorico : Entidade
{
    public Guid MarcoHistoricoId { get; set; }
    public string NomeArquivo { get; set; } = "";
    public string TipoConteudo { get; set; } = "";
    public byte[] Conteudo { get; set; } = [];
    public long Tamanho { get; set; }
    public string? Descricao { get; set; }

    public void Validar()
    {
        Exigir(!string.IsNullOrWhiteSpace(NomeArquivo) && NomeArquivo.Length <= 255, "Informe o nome do arquivo.");
        Exigir(TipoConteudo is "image/png" or "image/jpeg" or "application/pdf", "Envie uma foto PNG/JPEG ou um documento PDF.");
        Exigir(Conteudo.Length is > 0 and <= 10 * 1024 * 1024 && Tamanho == Conteudo.LongLength, "O arquivo deve ter até 10 MB.");
        Exigir(Descricao is null || Descricao.Length <= 500, "A descrição do anexo deve ter até 500 caracteres.");
    }
}
