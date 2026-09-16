using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ibes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CompeticoesEProvas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "competicoes");

            migrationBuilder.CreateTable(
                name: "competicoes",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: false),
                    DataBaseCategoria = table.Column<DateOnly>(type: "date", nullable: false),
                    Local = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Observacoes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_competicoes", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_competicoes_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "modalidades",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ativa = table.Column<bool>(type: "boolean", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_modalidades", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_modalidades_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "provas",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ModalidadeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Natureza = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TipoReferencia = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Ativa = table.Column<bool>(type: "boolean", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provas", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_provas_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_provas_modalidades_IgrejaId_ModalidadeId",
                        columns: x => new { x.IgrejaId, x.ModalidadeId },
                        principalSchema: "competicoes",
                        principalTable: "modalidades",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "aptidoes_prova",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    EncerradoPor = table.Column<Guid>(type: "uuid", nullable: true),
                    MotivoFim = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aptidoes_prova", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_aptidoes_prova_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_aptidoes_prova_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_aptidoes_prova_provas_IgrejaId_ProvaId",
                        columns: x => new { x.IgrejaId, x.ProvaId },
                        principalSchema: "competicoes",
                        principalTable: "provas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "provas_competicao",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompeticaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MinimoTitulares = table.Column<int>(type: "integer", nullable: false),
                    MaximoParticipantes = table.Column<int>(type: "integer", nullable: false),
                    MaximoReservas = table.Column<int>(type: "integer", nullable: false),
                    QuantidadeExataTitulares = table.Column<int>(type: "integer", nullable: true),
                    Referencia = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Data = table.Column<DateOnly>(type: "date", nullable: true),
                    HoraInicio = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    HoraFim = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provas_competicao", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_provas_competicao_competicoes_IgrejaId_CompeticaoId",
                        columns: x => new { x.IgrejaId, x.CompeticaoId },
                        principalSchema: "competicoes",
                        principalTable: "competicoes",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_provas_competicao_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_provas_competicao_provas_IgrejaId_ProvaId",
                        columns: x => new { x.IgrejaId, x.ProvaId },
                        principalSchema: "competicoes",
                        principalTable: "provas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "categorias_prova_competicao",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvaCompeticaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Categoria = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categorias_prova_competicao", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_categorias_prova_competicao_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_categorias_prova_competicao_provas_competicao_IgrejaId_Prov~",
                        columns: x => new { x.IgrejaId, x.ProvaCompeticaoId },
                        principalSchema: "competicoes",
                        principalTable: "provas_competicao",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "escalacoes_prova",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvaCompeticaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Situacao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escalacoes_prova", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_escalacoes_prova_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_escalacoes_prova_provas_competicao_IgrejaId_ProvaCompeticao~",
                        columns: x => new { x.IgrejaId, x.ProvaCompeticaoId },
                        principalSchema: "competicoes",
                        principalTable: "provas_competicao",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "alteracoes_escalacao",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    EscalacaoProvaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alteracoes_escalacao", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_alteracoes_escalacao_escalacoes_prova_IgrejaId_EscalacaoPro~",
                        columns: x => new { x.IgrejaId, x.EscalacaoProvaId },
                        principalSchema: "competicoes",
                        principalTable: "escalacoes_prova",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_alteracoes_escalacao_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "participantes_escalacao",
                schema: "competicoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    EscalacaoProvaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Funcao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_participantes_escalacao", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_participantes_escalacao_escalacoes_prova_IgrejaId_Escalacao~",
                        columns: x => new { x.IgrejaId, x.EscalacaoProvaId },
                        principalSchema: "competicoes",
                        principalTable: "escalacoes_prova",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_participantes_escalacao_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_participantes_escalacao_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_alteracoes_escalacao_IgrejaId_EscalacaoProvaId",
                schema: "competicoes",
                table: "alteracoes_escalacao",
                columns: new[] { "IgrejaId", "EscalacaoProvaId" });

            migrationBuilder.CreateIndex(
                name: "IX_aptidoes_prova_IgrejaId_PessoaId_ProvaId",
                schema: "competicoes",
                table: "aptidoes_prova",
                columns: new[] { "IgrejaId", "PessoaId", "ProvaId" },
                unique: true,
                filter: "\"DataFim\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_aptidoes_prova_IgrejaId_ProvaId",
                schema: "competicoes",
                table: "aptidoes_prova",
                columns: new[] { "IgrejaId", "ProvaId" });

            migrationBuilder.CreateIndex(
                name: "IX_categorias_prova_competicao_IgrejaId_ProvaCompeticaoId_Cate~",
                schema: "competicoes",
                table: "categorias_prova_competicao",
                columns: new[] { "IgrejaId", "ProvaCompeticaoId", "Categoria" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_escalacoes_prova_IgrejaId_ProvaCompeticaoId",
                schema: "competicoes",
                table: "escalacoes_prova",
                columns: new[] { "IgrejaId", "ProvaCompeticaoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_modalidades_IgrejaId_Nome",
                schema: "competicoes",
                table: "modalidades",
                columns: new[] { "IgrejaId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_participantes_escalacao_IgrejaId_EscalacaoProvaId_PessoaId",
                schema: "competicoes",
                table: "participantes_escalacao",
                columns: new[] { "IgrejaId", "EscalacaoProvaId", "PessoaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_participantes_escalacao_IgrejaId_PessoaId",
                schema: "competicoes",
                table: "participantes_escalacao",
                columns: new[] { "IgrejaId", "PessoaId" });

            migrationBuilder.CreateIndex(
                name: "IX_provas_IgrejaId_ModalidadeId_Nome",
                schema: "competicoes",
                table: "provas",
                columns: new[] { "IgrejaId", "ModalidadeId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_provas_competicao_IgrejaId_CompeticaoId_ProvaId",
                schema: "competicoes",
                table: "provas_competicao",
                columns: new[] { "IgrejaId", "CompeticaoId", "ProvaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_provas_competicao_IgrejaId_ProvaId",
                schema: "competicoes",
                table: "provas_competicao",
                columns: new[] { "IgrejaId", "ProvaId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alteracoes_escalacao",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "aptidoes_prova",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "categorias_prova_competicao",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "participantes_escalacao",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "escalacoes_prova",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "provas_competicao",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "competicoes",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "provas",
                schema: "competicoes");

            migrationBuilder.DropTable(
                name: "modalidades",
                schema: "competicoes");
        }
    }
}
