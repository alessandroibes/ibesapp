using Ibes.AgendaAtividades;
using Ibes.Frequencia;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Foundation.Persistence;

public sealed partial class AppDbContext
{
    private void ConfigurarOperacao(ModelBuilder b)
    {
        var promotora = Base<EntidadePromotora>(b, "entidades_promotoras", "agenda");
        promotora.Property(x => x.Nome).HasMaxLength(200);
        var tipo = Base<TipoAtividade>(b, "tipos_atividade", "agenda"); tipo.Property(x => x.Nome).HasMaxLength(100);
        var modelo = Base<ModeloReuniao>(b, "modelos_reuniao", "agenda"); modelo.Property(x => x.Nome).HasMaxLength(200);
        modelo.Property(x => x.ItensJson).HasColumnType("jsonb");
        var atividade = Base<AtividadeAgenda>(b, "atividades_agenda", "agenda");
        atividade.Property(x => x.Titulo).HasMaxLength(200); atividade.Property(x => x.Local).HasMaxLength(500);
        atividade.Property(x => x.Observacoes).HasMaxLength(4000); atividade.Property(x => x.Link).HasMaxLength(2000);
        atividade.Property(x => x.Moeda).HasMaxLength(10); atividade.Property(x => x.Valor).HasPrecision(14, 2);
        atividade.Property(x => x.FusoHorario).HasMaxLength(100);
        atividade.Property(x => x.Periodicidade).HasConversion<string>().HasMaxLength(20);
        atividade.Property(x => x.Situacao).HasConversion<string>().HasMaxLength(20);
        atividade.HasIndex(x => new { x.IgrejaId, x.DataInicio });
        atividade.HasOne<EntidadePromotora>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.EntidadePromotoraId }).OnDelete(DeleteBehavior.Restrict);
        atividade.HasOne<TipoAtividade>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.TipoAtividadeId }).OnDelete(DeleteBehavior.Restrict);
        atividade.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ResponsavelId }).OnDelete(DeleteBehavior.Restrict);
        atividade.HasOne<AtividadeAgenda>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.AtividadeRelacionadaId }).OnDelete(DeleteBehavior.Restrict);
        var excecao = Base<ExcecaoAgenda>(b, "excecoes_agenda", "agenda");
        excecao.Property(x => x.Situacao).HasConversion<string>().HasMaxLength(20); excecao.Property(x => x.Observacoes).HasMaxLength(4000);
        excecao.HasOne<AtividadeAgenda>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.AtividadeAgendaId }).OnDelete(DeleteBehavior.Restrict);
        excecao.HasIndex(x => new { x.IgrejaId, x.AtividadeAgendaId, x.DataOriginal }).IsUnique();
        var reuniao = Base<Reuniao>(b, "reunioes", "frequencia"); reuniao.Property(x => x.Titulo).HasMaxLength(200); reuniao.Property(x => x.RoteiroJson).HasColumnType("jsonb");
        reuniao.HasOne<AtividadeAgenda>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.AtividadeAgendaId }).OnDelete(DeleteBehavior.Restrict);
        reuniao.HasOne<ModeloReuniao>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ModeloReuniaoId }).OnDelete(DeleteBehavior.Restrict);
        reuniao.HasIndex(x => new { x.IgrejaId, x.AtividadeAgendaId, x.DataOriginal }).IsUnique();
        var frequencia = Base<RegistroFrequencia>(b, "registros_frequencia", "frequencia");
        frequencia.Property(x => x.Situacao).HasConversion<string>().HasMaxLength(40); frequencia.Property(x => x.Observacoes).HasMaxLength(1000);
        frequencia.HasOne<Reuniao>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ReuniaoId }).OnDelete(DeleteBehavior.Restrict);
        frequencia.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        frequencia.HasIndex(x => new { x.IgrejaId, x.ReuniaoId, x.PessoaId }).IsUnique();
        var alteracao = Base<AlteracaoFrequencia>(b, "alteracoes_frequencia", "frequencia");
        alteracao.Property(x => x.Situacao).HasConversion<string>().HasMaxLength(40); alteracao.Property(x => x.SituacaoAnterior).HasConversion<string>().HasMaxLength(40);
        alteracao.Property(x => x.Observacoes).HasMaxLength(1000);
        alteracao.HasOne<RegistroFrequencia>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.RegistroFrequenciaId }).OnDelete(DeleteBehavior.Restrict);
    }
}
