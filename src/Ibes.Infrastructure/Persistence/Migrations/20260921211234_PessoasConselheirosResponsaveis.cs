using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ibes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PessoasConselheirosResponsaveis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE pessoas.responsaveis_pessoa
                    ADD COLUMN IF NOT EXISTS "MoraComOEmbaixador" boolean NULL,
                    ADD COLUMN IF NOT EXISTS "Nome" character varying(200) NOT NULL DEFAULT '',
                    ADD COLUMN IF NOT EXISTS "TelefoneWhatsApp" character varying(40) NULL;

                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'pessoas' AND table_name = 'responsaveis_pessoa' AND column_name = 'ResponsavelId'
                    ) THEN
                        EXECUTE 'UPDATE pessoas.responsaveis_pessoa AS r
                                   SET "Nome" = p."Nome", "TelefoneWhatsApp" = p."WhatsApp"
                                  FROM pessoas.pessoas AS p
                                 WHERE p."IgrejaId" = r."IgrejaId" AND p."Id" = r."ResponsavelId"';
                    END IF;
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'pessoas' AND table_name = 'responsaveis_pessoa' AND column_name = 'Parentesco'
                    ) THEN
                        EXECUTE 'ALTER TABLE pessoas.responsaveis_pessoa RENAME COLUMN "Parentesco" TO "Relacao"';
                    END IF;
                END $$;

                ALTER TABLE pessoas.responsaveis_pessoa
                    DROP CONSTRAINT IF EXISTS "FK_responsaveis_pessoa_pessoas_IgrejaId_ResponsavelId",
                    DROP COLUMN IF EXISTS "DataFim",
                    DROP COLUMN IF EXISTS "DataInicio",
                    DROP COLUMN IF EXISTS "ResponsavelId";
                DROP INDEX IF EXISTS pessoas."IX_responsaveis_pessoa_IgrejaId_PessoaId_ResponsavelId_DataIni~";
                DROP INDEX IF EXISTS pessoas."IX_responsaveis_pessoa_IgrejaId_ResponsavelId";
                CREATE INDEX IF NOT EXISTS "IX_responsaveis_pessoa_IgrejaId_PessoaId"
                    ON pessoas.responsaveis_pessoa ("IgrejaId", "PessoaId");

                DROP TABLE IF EXISTS embaixadas.liderancas_embaixada;
                ALTER TABLE embaixadas.conselheiros DROP COLUMN IF EXISTS "Funcao";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_responsaveis_pessoa_IgrejaId_PessoaId",
                schema: "pessoas",
                table: "responsaveis_pessoa");

            migrationBuilder.DropColumn(
                name: "MoraComOEmbaixador",
                schema: "pessoas",
                table: "responsaveis_pessoa");

            migrationBuilder.DropColumn(
                name: "Nome",
                schema: "pessoas",
                table: "responsaveis_pessoa");

            migrationBuilder.DropColumn(
                name: "TelefoneWhatsApp",
                schema: "pessoas",
                table: "responsaveis_pessoa");

            migrationBuilder.RenameColumn(
                name: "Relacao",
                schema: "pessoas",
                table: "responsaveis_pessoa",
                newName: "Parentesco");

            migrationBuilder.AddColumn<DateOnly>(
                name: "DataFim",
                schema: "pessoas",
                table: "responsaveis_pessoa",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DataInicio",
                schema: "pessoas",
                table: "responsaveis_pessoa",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<Guid>(
                name: "ResponsavelId",
                schema: "pessoas",
                table: "responsaveis_pessoa",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Funcao",
                schema: "embaixadas",
                table: "conselheiros",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "liderancas_embaixada",
                schema: "embaixadas",
                columns: table => new
                {
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConselheiroId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    Funcao = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_liderancas_embaixada", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_liderancas_embaixada_conselheiros_IgrejaId_ConselheiroId",
                        columns: x => new { x.IgrejaId, x.ConselheiroId },
                        principalSchema: "embaixadas",
                        principalTable: "conselheiros",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_liderancas_embaixada_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_responsaveis_pessoa_IgrejaId_PessoaId_ResponsavelId_DataIni~",
                schema: "pessoas",
                table: "responsaveis_pessoa",
                columns: new[] { "IgrejaId", "PessoaId", "ResponsavelId", "DataInicio" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_responsaveis_pessoa_IgrejaId_ResponsavelId",
                schema: "pessoas",
                table: "responsaveis_pessoa",
                columns: new[] { "IgrejaId", "ResponsavelId" });

            migrationBuilder.CreateIndex(
                name: "IX_liderancas_embaixada_IgrejaId_ConselheiroId",
                schema: "embaixadas",
                table: "liderancas_embaixada",
                columns: new[] { "IgrejaId", "ConselheiroId" });

            migrationBuilder.AddForeignKey(
                name: "FK_responsaveis_pessoa_pessoas_IgrejaId_ResponsavelId",
                schema: "pessoas",
                table: "responsaveis_pessoa",
                columns: new[] { "IgrejaId", "ResponsavelId" },
                principalSchema: "pessoas",
                principalTable: "pessoas",
                principalColumns: new[] { "IgrejaId", "Id" },
                onDelete: ReferentialAction.Restrict);
        }
    }
}
