using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ibes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OrganizacaoInterna : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "organizacao");

            migrationBuilder.CreateTable(
                name: "cargos_embaixada",
                schema: "organizacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    QuantidadeVagas = table.Column<int>(type: "integer", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cargos_embaixada", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_cargos_embaixada_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "consulados",
                schema: "organizacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_consulados", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_consulados_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "mandatos_diretoria",
                schema: "organizacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: false),
                    Observacoes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mandatos_diretoria", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_mandatos_diretoria_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "membros_consulado",
                schema: "organizacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsuladoId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    MotivoFim = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_membros_consulado", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_membros_consulado_consulados_IgrejaId_ConsuladoId",
                        columns: x => new { x.IgrejaId, x.ConsuladoId },
                        principalSchema: "organizacao",
                        principalTable: "consulados",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_membros_consulado_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_membros_consulado_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ocupacoes_cargo",
                schema: "organizacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MandatoDiretoriaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CargoEmbaixadaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    MotivoFim = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ocupacoes_cargo", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_ocupacoes_cargo_cargos_embaixada_IgrejaId_CargoEmbaixadaId",
                        columns: x => new { x.IgrejaId, x.CargoEmbaixadaId },
                        principalSchema: "organizacao",
                        principalTable: "cargos_embaixada",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ocupacoes_cargo_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ocupacoes_cargo_mandatos_diretoria_IgrejaId_MandatoDiretori~",
                        columns: x => new { x.IgrejaId, x.MandatoDiretoriaId },
                        principalSchema: "organizacao",
                        principalTable: "mandatos_diretoria",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ocupacoes_cargo_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "liderancas_consulado",
                schema: "organizacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsuladoId = table.Column<Guid>(type: "uuid", nullable: false),
                    MembroConsuladoId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    MotivoFim = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_liderancas_consulado", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_liderancas_consulado_consulados_IgrejaId_ConsuladoId",
                        columns: x => new { x.IgrejaId, x.ConsuladoId },
                        principalSchema: "organizacao",
                        principalTable: "consulados",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_liderancas_consulado_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_liderancas_consulado_membros_consulado_IgrejaId_MembroConsu~",
                        columns: x => new { x.IgrejaId, x.MembroConsuladoId },
                        principalSchema: "organizacao",
                        principalTable: "membros_consulado",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_liderancas_consulado_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "resultados_eleicoes",
                schema: "organizacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MandatoDiretoriaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CargoEmbaixadaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaEscolhidaId = table.Column<Guid>(type: "uuid", nullable: false),
                    OcupacaoCargoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Data = table.Column<DateOnly>(type: "date", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resultados_eleicoes", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_resultados_eleicoes_cargos_embaixada_IgrejaId_CargoEmbaixad~",
                        columns: x => new { x.IgrejaId, x.CargoEmbaixadaId },
                        principalSchema: "organizacao",
                        principalTable: "cargos_embaixada",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_resultados_eleicoes_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_resultados_eleicoes_mandatos_diretoria_IgrejaId_MandatoDire~",
                        columns: x => new { x.IgrejaId, x.MandatoDiretoriaId },
                        principalSchema: "organizacao",
                        principalTable: "mandatos_diretoria",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_resultados_eleicoes_ocupacoes_cargo_IgrejaId_OcupacaoCargoId",
                        columns: x => new { x.IgrejaId, x.OcupacaoCargoId },
                        principalSchema: "organizacao",
                        principalTable: "ocupacoes_cargo",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_resultados_eleicoes_pessoas_IgrejaId_PessoaEscolhidaId",
                        columns: x => new { x.IgrejaId, x.PessoaEscolhidaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cargos_embaixada_IgrejaId_Nome",
                schema: "organizacao",
                table: "cargos_embaixada",
                columns: new[] { "IgrejaId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_liderancas_consulado_IgrejaId_ConsuladoId",
                schema: "organizacao",
                table: "liderancas_consulado",
                columns: new[] { "IgrejaId", "ConsuladoId" },
                unique: true,
                filter: "\"DataFim\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_liderancas_consulado_IgrejaId_MembroConsuladoId",
                schema: "organizacao",
                table: "liderancas_consulado",
                columns: new[] { "IgrejaId", "MembroConsuladoId" });

            migrationBuilder.CreateIndex(
                name: "IX_liderancas_consulado_IgrejaId_PessoaId",
                schema: "organizacao",
                table: "liderancas_consulado",
                columns: new[] { "IgrejaId", "PessoaId" });

            migrationBuilder.CreateIndex(
                name: "IX_membros_consulado_IgrejaId_ConsuladoId",
                schema: "organizacao",
                table: "membros_consulado",
                columns: new[] { "IgrejaId", "ConsuladoId" });

            migrationBuilder.CreateIndex(
                name: "IX_membros_consulado_IgrejaId_PessoaId",
                schema: "organizacao",
                table: "membros_consulado",
                columns: new[] { "IgrejaId", "PessoaId" },
                unique: true,
                filter: "\"DataFim\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ocupacoes_cargo_IgrejaId_CargoEmbaixadaId",
                schema: "organizacao",
                table: "ocupacoes_cargo",
                columns: new[] { "IgrejaId", "CargoEmbaixadaId" });

            migrationBuilder.CreateIndex(
                name: "IX_ocupacoes_cargo_IgrejaId_MandatoDiretoriaId",
                schema: "organizacao",
                table: "ocupacoes_cargo",
                columns: new[] { "IgrejaId", "MandatoDiretoriaId" });

            migrationBuilder.CreateIndex(
                name: "IX_ocupacoes_cargo_IgrejaId_PessoaId",
                schema: "organizacao",
                table: "ocupacoes_cargo",
                columns: new[] { "IgrejaId", "PessoaId" });

            migrationBuilder.CreateIndex(
                name: "IX_resultados_eleicoes_IgrejaId_CargoEmbaixadaId",
                schema: "organizacao",
                table: "resultados_eleicoes",
                columns: new[] { "IgrejaId", "CargoEmbaixadaId" });

            migrationBuilder.CreateIndex(
                name: "IX_resultados_eleicoes_IgrejaId_MandatoDiretoriaId",
                schema: "organizacao",
                table: "resultados_eleicoes",
                columns: new[] { "IgrejaId", "MandatoDiretoriaId" });

            migrationBuilder.CreateIndex(
                name: "IX_resultados_eleicoes_IgrejaId_OcupacaoCargoId",
                schema: "organizacao",
                table: "resultados_eleicoes",
                columns: new[] { "IgrejaId", "OcupacaoCargoId" });

            migrationBuilder.CreateIndex(
                name: "IX_resultados_eleicoes_IgrejaId_PessoaEscolhidaId",
                schema: "organizacao",
                table: "resultados_eleicoes",
                columns: new[] { "IgrejaId", "PessoaEscolhidaId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "liderancas_consulado",
                schema: "organizacao");

            migrationBuilder.DropTable(
                name: "resultados_eleicoes",
                schema: "organizacao");

            migrationBuilder.DropTable(
                name: "membros_consulado",
                schema: "organizacao");

            migrationBuilder.DropTable(
                name: "ocupacoes_cargo",
                schema: "organizacao");

            migrationBuilder.DropTable(
                name: "consulados",
                schema: "organizacao");

            migrationBuilder.DropTable(
                name: "cargos_embaixada",
                schema: "organizacao");

            migrationBuilder.DropTable(
                name: "mandatos_diretoria",
                schema: "organizacao");
        }
    }
}
