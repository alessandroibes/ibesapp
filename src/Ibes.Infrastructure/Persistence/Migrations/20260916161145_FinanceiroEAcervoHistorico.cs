using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ibes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FinanceiroEAcervoHistorico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "acervo");

            migrationBuilder.EnsureSchema(
                name: "financeiro");

            migrationBuilder.CreateTable(
                name: "iniciativas_financeiras",
                schema: "financeiro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_iniciativas_financeiras", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_iniciativas_financeiras_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "marcos_historicos",
                schema: "acervo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    Categoria = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AtividadeAgendaId = table.Column<Guid>(type: "uuid", nullable: true),
                    AutorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_marcos_historicos", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_marcos_historicos_atividades_agenda_IgrejaId_AtividadeAgend~",
                        columns: x => new { x.IgrejaId, x.AtividadeAgendaId },
                        principalSchema: "agenda",
                        principalTable: "atividades_agenda",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_marcos_historicos_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_marcos_historicos_vinculos_igreja_IgrejaId_AutorId",
                        columns: x => new { x.IgrejaId, x.AutorId },
                        principalSchema: "identidade",
                        principalTable: "vinculos_igreja",
                        principalColumns: new[] { "IgrejaId", "UsuarioId" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "lancamentos_financeiros",
                schema: "financeiro",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Data = table.Column<DateOnly>(type: "date", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Motivo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: true),
                    AtividadeAgendaId = table.Column<Guid>(type: "uuid", nullable: true),
                    IniciativaFinanceiraId = table.Column<Guid>(type: "uuid", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lancamentos_financeiros", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_lancamentos_financeiros_atividades_agenda_IgrejaId_Atividad~",
                        columns: x => new { x.IgrejaId, x.AtividadeAgendaId },
                        principalSchema: "agenda",
                        principalTable: "atividades_agenda",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_lancamentos_financeiros_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_lancamentos_financeiros_iniciativas_financeiras_IgrejaId_In~",
                        columns: x => new { x.IgrejaId, x.IniciativaFinanceiraId },
                        principalSchema: "financeiro",
                        principalTable: "iniciativas_financeiras",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_lancamentos_financeiros_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "anexos_marcos_historicos",
                schema: "acervo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MarcoHistoricoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeArquivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    TipoConteudo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Conteudo = table.Column<byte[]>(type: "bytea", nullable: false),
                    Tamanho = table.Column<long>(type: "bigint", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_anexos_marcos_historicos", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_anexos_marcos_historicos_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_anexos_marcos_historicos_marcos_historicos_IgrejaId_MarcoHi~",
                        columns: x => new { x.IgrejaId, x.MarcoHistoricoId },
                        principalSchema: "acervo",
                        principalTable: "marcos_historicos",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pessoas_marcos_historicos",
                schema: "acervo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MarcoHistoricoId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pessoas_marcos_historicos", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_pessoas_marcos_historicos_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pessoas_marcos_historicos_marcos_historicos_IgrejaId_MarcoH~",
                        columns: x => new { x.IgrejaId, x.MarcoHistoricoId },
                        principalSchema: "acervo",
                        principalTable: "marcos_historicos",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_pessoas_marcos_historicos_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_anexos_marcos_historicos_IgrejaId_MarcoHistoricoId",
                schema: "acervo",
                table: "anexos_marcos_historicos",
                columns: new[] { "IgrejaId", "MarcoHistoricoId" });

            migrationBuilder.CreateIndex(
                name: "IX_iniciativas_financeiras_IgrejaId_Nome",
                schema: "financeiro",
                table: "iniciativas_financeiras",
                columns: new[] { "IgrejaId", "Nome" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_lancamentos_financeiros_IgrejaId_AtividadeAgendaId",
                schema: "financeiro",
                table: "lancamentos_financeiros",
                columns: new[] { "IgrejaId", "AtividadeAgendaId" });

            migrationBuilder.CreateIndex(
                name: "IX_lancamentos_financeiros_IgrejaId_Data",
                schema: "financeiro",
                table: "lancamentos_financeiros",
                columns: new[] { "IgrejaId", "Data" });

            migrationBuilder.CreateIndex(
                name: "IX_lancamentos_financeiros_IgrejaId_IniciativaFinanceiraId",
                schema: "financeiro",
                table: "lancamentos_financeiros",
                columns: new[] { "IgrejaId", "IniciativaFinanceiraId" });

            migrationBuilder.CreateIndex(
                name: "IX_lancamentos_financeiros_IgrejaId_PessoaId",
                schema: "financeiro",
                table: "lancamentos_financeiros",
                columns: new[] { "IgrejaId", "PessoaId" });

            migrationBuilder.CreateIndex(
                name: "IX_marcos_historicos_IgrejaId_AtividadeAgendaId",
                schema: "acervo",
                table: "marcos_historicos",
                columns: new[] { "IgrejaId", "AtividadeAgendaId" });

            migrationBuilder.CreateIndex(
                name: "IX_marcos_historicos_IgrejaId_AutorId",
                schema: "acervo",
                table: "marcos_historicos",
                columns: new[] { "IgrejaId", "AutorId" });

            migrationBuilder.CreateIndex(
                name: "IX_marcos_historicos_IgrejaId_DataInicio",
                schema: "acervo",
                table: "marcos_historicos",
                columns: new[] { "IgrejaId", "DataInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_pessoas_marcos_historicos_IgrejaId_MarcoHistoricoId_PessoaId",
                schema: "acervo",
                table: "pessoas_marcos_historicos",
                columns: new[] { "IgrejaId", "MarcoHistoricoId", "PessoaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pessoas_marcos_historicos_IgrejaId_PessoaId",
                schema: "acervo",
                table: "pessoas_marcos_historicos",
                columns: new[] { "IgrejaId", "PessoaId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "anexos_marcos_historicos",
                schema: "acervo");

            migrationBuilder.DropTable(
                name: "lancamentos_financeiros",
                schema: "financeiro");

            migrationBuilder.DropTable(
                name: "pessoas_marcos_historicos",
                schema: "acervo");

            migrationBuilder.DropTable(
                name: "iniciativas_financeiras",
                schema: "financeiro");

            migrationBuilder.DropTable(
                name: "marcos_historicos",
                schema: "acervo");
        }
    }
}
