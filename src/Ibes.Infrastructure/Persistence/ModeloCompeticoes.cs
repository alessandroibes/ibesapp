using Ibes.Competicoes;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Foundation.Persistence;

public sealed partial class AppDbContext
{
    private void ConfigurarCompeticoes(ModelBuilder b)
    {
        var modalidade = Base<Modalidade>(b, "modalidades", "competicoes");
        modalidade.Property(x => x.Nome).HasMaxLength(100);
        modalidade.HasIndex(x => new { x.IgrejaId, x.Nome }).IsUnique();

        var prova = Base<Prova>(b, "provas", "competicoes");
        prova.Property(x => x.Nome).HasMaxLength(150);
        prova.Property(x => x.Natureza).HasConversion<string>().HasMaxLength(20);
        prova.Property(x => x.TipoReferencia).HasConversion<string>().HasMaxLength(30);
        prova.HasOne<Modalidade>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ModalidadeId }).OnDelete(DeleteBehavior.Restrict);
        prova.HasIndex(x => new { x.IgrejaId, x.ModalidadeId, x.Nome }).IsUnique();

        var aptidao = Base<AptidaoProva>(b, "aptidoes_prova", "competicoes");
        aptidao.Property(x => x.MotivoFim).HasMaxLength(500);
        aptidao.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        aptidao.HasOne<Prova>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ProvaId }).OnDelete(DeleteBehavior.Restrict);
        aptidao.HasIndex(x => new { x.IgrejaId, x.PessoaId, x.ProvaId }).IsUnique().HasFilter("\"DataFim\" IS NULL");

        var competicao = Base<Competicao>(b, "competicoes", "competicoes");
        competicao.Property(x => x.Nome).HasMaxLength(200);
        competicao.Property(x => x.Local).HasMaxLength(500);
        competicao.Property(x => x.Observacoes).HasMaxLength(4000);

        var provaCompeticao = Base<ProvaCompeticao>(b, "provas_competicao", "competicoes");
        provaCompeticao.Property(x => x.Referencia).HasMaxLength(500);
        provaCompeticao.HasOne<Competicao>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.CompeticaoId }).OnDelete(DeleteBehavior.Restrict);
        provaCompeticao.HasOne<Prova>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ProvaId }).OnDelete(DeleteBehavior.Restrict);
        provaCompeticao.HasIndex(x => new { x.IgrejaId, x.CompeticaoId, x.ProvaId }).IsUnique();

        var categoria = Base<CategoriaProvaCompeticao>(b, "categorias_prova_competicao", "competicoes");
        categoria.Property(x => x.Categoria).HasConversion<string>().HasMaxLength(20);
        categoria.HasOne<ProvaCompeticao>().WithMany(x => x.Categorias).HasForeignKey(x => new { x.IgrejaId, x.ProvaCompeticaoId }).OnDelete(DeleteBehavior.Cascade);
        categoria.HasIndex(x => new { x.IgrejaId, x.ProvaCompeticaoId, x.Categoria }).IsUnique();

        var escalacao = Base<EscalacaoProva>(b, "escalacoes_prova", "competicoes");
        escalacao.Property(x => x.Situacao).HasConversion<string>().HasMaxLength(20);
        escalacao.HasOne<ProvaCompeticao>().WithOne().HasForeignKey<EscalacaoProva>(x => new { x.IgrejaId, x.ProvaCompeticaoId }).OnDelete(DeleteBehavior.Restrict);
        escalacao.HasIndex(x => new { x.IgrejaId, x.ProvaCompeticaoId }).IsUnique();

        var participante = Base<ParticipanteEscalacao>(b, "participantes_escalacao", "competicoes");
        participante.Property(x => x.Funcao).HasConversion<string>().HasMaxLength(20);
        participante.HasOne<EscalacaoProva>().WithMany(x => x.Participantes).HasForeignKey(x => new { x.IgrejaId, x.EscalacaoProvaId }).OnDelete(DeleteBehavior.Cascade);
        participante.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        participante.HasIndex(x => new { x.IgrejaId, x.EscalacaoProvaId, x.PessoaId }).IsUnique();

        var alteracao = Base<AlteracaoEscalacao>(b, "alteracoes_escalacao", "competicoes");
        alteracao.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(20);
        alteracao.Property(x => x.Motivo).HasMaxLength(500);
        alteracao.HasOne<EscalacaoProva>().WithMany(x => x.Alteracoes).HasForeignKey(x => new { x.IgrejaId, x.EscalacaoProvaId }).OnDelete(DeleteBehavior.Cascade);
    }
}
