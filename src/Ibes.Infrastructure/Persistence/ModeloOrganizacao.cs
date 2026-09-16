using Ibes.ConsuladosDiretoria;
using Ibes.Pessoas;
using Microsoft.EntityFrameworkCore;

namespace Ibes.Foundation.Persistence;

public sealed partial class AppDbContext
{
    private void ConfigurarOrganizacao(ModelBuilder b)
    {
        var consulado = Base<Consulado>(b, "consulados", "organizacao");
        consulado.Property(x => x.Nome).HasMaxLength(80);
        var membro = Base<MembroConsulado>(b, "membros_consulado", "organizacao");
        membro.Property(x => x.MotivoFim).HasMaxLength(500);
        membro.HasOne<Consulado>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ConsuladoId }).OnDelete(DeleteBehavior.Restrict);
        membro.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        membro.HasIndex(x => new { x.IgrejaId, x.PessoaId }).IsUnique().HasFilter("\"DataFim\" IS NULL");
        var lideranca = Base<LiderancaConsulado>(b, "liderancas_consulado", "organizacao");
        lideranca.Property(x => x.MotivoFim).HasMaxLength(500);
        lideranca.HasOne<Consulado>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.ConsuladoId }).OnDelete(DeleteBehavior.Restrict);
        lideranca.HasOne<MembroConsulado>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.MembroConsuladoId }).OnDelete(DeleteBehavior.Restrict);
        lideranca.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        lideranca.HasIndex(x => new { x.IgrejaId, x.ConsuladoId }).IsUnique().HasFilter("\"DataFim\" IS NULL");
        var mandato = Base<MandatoDiretoria>(b, "mandatos_diretoria", "organizacao");
        mandato.Property(x => x.Nome).HasMaxLength(150); mandato.Property(x => x.Observacoes).HasMaxLength(2000);
        var cargo = Base<CargoEmbaixada>(b, "cargos_embaixada", "organizacao");
        cargo.Property(x => x.Nome).HasMaxLength(100); cargo.HasIndex(x => new { x.IgrejaId, x.Nome }).IsUnique();
        var ocupacao = Base<OcupacaoCargo>(b, "ocupacoes_cargo", "organizacao");
        ocupacao.Property(x => x.MotivoFim).HasMaxLength(500);
        ocupacao.HasOne<MandatoDiretoria>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.MandatoDiretoriaId }).OnDelete(DeleteBehavior.Restrict);
        ocupacao.HasOne<CargoEmbaixada>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.CargoEmbaixadaId }).OnDelete(DeleteBehavior.Restrict);
        ocupacao.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaId }).OnDelete(DeleteBehavior.Restrict);
        var eleicao = Base<ResultadoEleicao>(b, "resultados_eleicoes", "organizacao");
        eleicao.Property(x => x.Motivo).HasMaxLength(500);
        eleicao.HasOne<MandatoDiretoria>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.MandatoDiretoriaId }).OnDelete(DeleteBehavior.Restrict);
        eleicao.HasOne<CargoEmbaixada>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.CargoEmbaixadaId }).OnDelete(DeleteBehavior.Restrict);
        eleicao.HasOne<Pessoa>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.PessoaEscolhidaId }).OnDelete(DeleteBehavior.Restrict);
        eleicao.HasOne<OcupacaoCargo>().WithMany().HasForeignKey(x => new { x.IgrejaId, x.OcupacaoCargoId }).OnDelete(DeleteBehavior.Restrict);
    }
}
