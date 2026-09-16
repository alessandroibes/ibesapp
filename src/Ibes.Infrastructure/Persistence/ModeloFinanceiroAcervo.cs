using Ibes.AcervoHistorico;
using Ibes.AgendaAtividades;
using Ibes.Financeiro;
using Ibes.Foundation.Organizacoes;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Foundation.Persistence;

public sealed partial class AppDbContext
{
    private void ConfigurarFinanceiroEAcervo(ModelBuilder b)
    {
        var iniciativa = Base<IniciativaFinanceira>(b, "iniciativas_financeiras", "financeiro");
        iniciativa.Property(x => x.Nome).HasMaxLength(200);
        iniciativa.Property(x => x.Descricao).HasMaxLength(2000);
        iniciativa.HasIndex(x => new { x.IgrejaId, x.Nome }).IsUnique();

        var lancamento = Base<LancamentoFinanceiro>(b, "lancamentos_financeiros", "financeiro");
        lancamento.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(20);
        lancamento.Property(x => x.Valor).HasPrecision(14, 2);
        lancamento.Property(x => x.Motivo).HasMaxLength(200);
        lancamento.Property(x => x.Descricao).HasMaxLength(2000);
        lancamento.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        lancamento.HasOne<AtividadeAgenda>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.AtividadeAgendaId }).OnDelete(DeleteBehavior.Restrict);
        lancamento.HasOne<IniciativaFinanceira>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.IniciativaFinanceiraId }).OnDelete(DeleteBehavior.Restrict);
        lancamento.HasIndex(x => new { x.IgrejaId, x.Data });

        var marco = Base<MarcoHistorico>(b, "marcos_historicos", "acervo");
        marco.Property(x => x.Titulo).HasMaxLength(200);
        marco.Property(x => x.Descricao).HasMaxLength(10000);
        marco.Property(x => x.Categoria).HasMaxLength(100);
        marco.HasOne<AtividadeAgenda>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.AtividadeAgendaId }).OnDelete(DeleteBehavior.Restrict);
        marco.HasOne<VinculoIgreja>().WithMany().HasForeignKey(x => new { x.IgrejaId, UsuarioId = x.AutorId }).OnDelete(DeleteBehavior.Restrict);
        marco.HasIndex(x => new { x.IgrejaId, x.DataInicio });

        var pessoaMarco = Base<PessoaMarcoHistorico>(b, "pessoas_marcos_historicos", "acervo");
        pessoaMarco.HasOne<MarcoHistorico>().WithMany(x => x.Pessoas).HasForeignKey(x => new { x.IgrejaId, x.MarcoHistoricoId }).OnDelete(DeleteBehavior.Cascade);
        pessoaMarco.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        pessoaMarco.HasIndex(x => new { x.IgrejaId, x.MarcoHistoricoId, x.PessoaId }).IsUnique();

        var anexo = Base<AnexoMarcoHistorico>(b, "anexos_marcos_historicos", "acervo");
        anexo.Property(x => x.NomeArquivo).HasMaxLength(255);
        anexo.Property(x => x.TipoConteudo).HasMaxLength(100);
        anexo.Property(x => x.Descricao).HasMaxLength(500);
        anexo.HasOne<MarcoHistorico>().WithMany(x => x.Anexos).HasForeignKey(x => new { x.IgrejaId, x.MarcoHistoricoId }).OnDelete(DeleteBehavior.Cascade);
    }
}
