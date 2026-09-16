using Ibes.Foundation.Domain;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Identidade;
using Ibes.Pessoas;
using Ibes.Embaixadas;
using Ibes.Progressao;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ibes.Foundation.Persistence;

public sealed partial class AppDbContext
{
    private Guid IgrejaAtual => tenant.IgrejaId;
    private EntityTypeBuilder<T> Base<T>(ModelBuilder b, string tabela, string esquema) where T : Entidade
    {
        var e = b.Entity<T>();
        e.HasBaseType((Type?)null);
        e.ToTable(tabela, esquema);
        e.HasKey(x => new { x.IgrejaId, x.Id });
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Versao).IsConcurrencyToken();
        e.HasOne<Igreja>().WithMany().HasForeignKey(x => x.IgrejaId).OnDelete(DeleteBehavior.Restrict);
        e.HasQueryFilter(x => IgrejaAtual != Guid.Empty && x.IgrejaId == IgrejaAtual);
        return e;
    }

    private void ConfigurarDominio(ModelBuilder b)
    {
        var pessoa = Base<Pessoa>(b, "pessoas", "pessoas");
        pessoa.Property(x => x.Nome).HasMaxLength(200);
        pessoa.Property(x => x.Naturalidade).HasMaxLength(200);
        pessoa.Property(x => x.WhatsApp).HasMaxLength(40);
        pessoa.Property(x => x.Endereco).HasMaxLength(500);
        pessoa.Property(x => x.LocalBatismo).HasMaxLength(200);
        pessoa.Property(x => x.NumeroCarteira).HasMaxLength(80);
        pessoa.Property(x => x.SituacaoCarteira).HasMaxLength(100);
        pessoa.Property(x => x.Observacoes).HasMaxLength(4000);
        pessoa.Property(x => x.Ativa).HasDefaultValue(true);
        var alteracaoPessoa = Base<AlteracaoSituacaoPessoa>(b, "alteracoes_situacao", "pessoas");
        alteracaoPessoa.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(20);
        alteracaoPessoa.Property(x => x.Motivo).HasMaxLength(500);
        alteracaoPessoa.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        alteracaoPessoa.HasIndex(x => new { x.IgrejaId, x.PessoaId, x.Data });
        var responsavel = Base<ResponsavelPessoa>(b, "responsaveis_pessoa", "pessoas");
        responsavel.Property(x => x.Parentesco).HasMaxLength(80);
        responsavel.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        responsavel.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ResponsavelId }).OnDelete(DeleteBehavior.Restrict);
        responsavel.HasIndex(x => new { x.IgrejaId, x.PessoaId, x.ResponsavelId, x.DataInicio }).IsUnique();
        var vinculo = Base<VinculoEclesiastico>(b, "vinculos_eclesiasticos", "pessoas");
        vinculo.Property(x => x.NomeIgreja).HasMaxLength(200);
        vinculo.Property(x => x.Tipo).HasMaxLength(30);
        vinculo.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        var foto = Base<FotoPessoa>(b, "fotos_pessoa", "pessoas");
        foto.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        foto.HasIndex(x => new { x.IgrejaId, x.PessoaId }).IsUnique();
        foto.Property(x => x.TipoConteudo).HasMaxLength(40);
        var conselheiro = Base<Conselheiro>(b, "conselheiros", "embaixadas");
        conselheiro.Property(x => x.Funcao).HasMaxLength(100);
        conselheiro.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        conselheiro.HasOne<Usuario>().WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        var lideranca = Base<LiderancaEmbaixada>(b, "liderancas_embaixada", "embaixadas");
        lideranca.Property(x => x.Funcao).HasMaxLength(100);
        lideranca.HasOne<Conselheiro>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ConselheiroId }).OnDelete(DeleteBehavior.Restrict);
        var manual = Base<Manual>(b, "manuais", "progressao");
        manual.HasIndex(x => new { x.IgrejaId, x.Posto }).IsUnique();
        manual.Property(x => x.Posto).HasConversion<string>().HasMaxLength(30);
        var versao = Base<VersaoManual>(b, "versoes_manuais", "progressao");
        versao.Property(x => x.Identificacao).HasMaxLength(150);
        versao.HasIndex(x => new { x.IgrejaId, x.ManualId, x.Identificacao }).IsUnique();
        versao.HasOne<Manual>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ManualId }).OnDelete(DeleteBehavior.Restrict);
        var tarefa = Base<TarefaManual>(b, "tarefas_manual", "progressao");
        tarefa.Property(x => x.Nome).HasMaxLength(500);
        tarefa.HasOne<VersaoManual>().WithMany(x => x.Tarefas).HasForeignKey(x => new { x.IgrejaId, x.VersaoManualId }).OnDelete(DeleteBehavior.Restrict);
        tarefa.HasIndex(x => new { x.IgrejaId, x.VersaoManualId, x.OrdemExibicao }).IsUnique();
        var jornada = Base<JornadaEmbaixador>(b, "jornadas_embaixador", "progressao");
        jornada.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        jornada.HasIndex(x => new { x.IgrejaId, x.PessoaId }).IsUnique();
        var requisito = Base<ConclusaoRequisito>(b, "conclusoes_requisitos", "progressao");
        requisito.Property(x => x.Requisito).HasConversion<string>().HasMaxLength(40);
        requisito.HasOne<JornadaEmbaixador>().WithMany(x => x.Requisitos).HasForeignKey(x => new { x.IgrejaId, x.JornadaEmbaixadorId }).OnDelete(DeleteBehavior.Restrict);
        requisito.HasIndex(x => new { x.IgrejaId, x.JornadaEmbaixadorId, x.Requisito }).IsUnique();
        var posto = Base<JornadaPosto>(b, "jornadas_posto", "progressao");
        posto.Property(x => x.Posto).HasConversion<string>().HasMaxLength(30);
        posto.HasOne<JornadaEmbaixador>().WithMany(x => x.Postos).HasForeignKey(x => new { x.IgrejaId, x.JornadaEmbaixadorId }).OnDelete(DeleteBehavior.Restrict);
        posto.HasOne<VersaoManual>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.VersaoManualId }).OnDelete(DeleteBehavior.Restrict);
        posto.HasIndex(x => new { x.IgrejaId, x.JornadaEmbaixadorId, x.Posto }).IsUnique();
        var conclusao = Base<ConclusaoTarefa>(b, "conclusoes_tarefas", "progressao");
        conclusao.HasOne<JornadaPosto>().WithMany(x => x.Tarefas).HasForeignKey(x => new { x.IgrejaId, x.JornadaPostoId }).OnDelete(DeleteBehavior.Restrict);
        conclusao.HasOne<TarefaManual>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.TarefaManualId }).OnDelete(DeleteBehavior.Restrict);
        conclusao.HasIndex(x => new { x.IgrejaId, x.JornadaPostoId, x.TarefaManualId }).IsUnique();
        var cerimonia = Base<CerimoniaReconhecimento>(b, "cerimonias_reconhecimento", "progressao");
        cerimonia.Property(x => x.Descricao).HasMaxLength(1000);
        cerimonia.HasOne<JornadaEmbaixador>().WithMany(x => x.Cerimonias).HasForeignKey(x => new { x.IgrejaId, x.JornadaEmbaixadorId }).OnDelete(DeleteBehavior.Restrict);
        cerimonia.HasOne<JornadaPosto>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.JornadaPostoId }).OnDelete(DeleteBehavior.Restrict);
    }
}
