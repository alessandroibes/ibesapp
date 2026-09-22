using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ibes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GestaoManuais : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Ativa",
                schema: "progressao",
                table: "tarefas_manual",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "tarefas_aplicaveis_posto",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    JornadaPostoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TarefaManualId = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tarefas_aplicaveis_posto", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_tarefas_aplicaveis_posto_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tarefas_aplicaveis_posto_jornadas_posto_IgrejaId_JornadaPos~",
                        columns: x => new { x.IgrejaId, x.JornadaPostoId },
                        principalSchema: "progressao",
                        principalTable: "jornadas_posto",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tarefas_aplicaveis_posto_tarefas_manual_IgrejaId_TarefaManu~",
                        columns: x => new { x.IgrejaId, x.TarefaManualId },
                        principalSchema: "progressao",
                        principalTable: "tarefas_manual",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tarefas_aplicaveis_posto_IgrejaId_JornadaPostoId_TarefaManu~",
                schema: "progressao",
                table: "tarefas_aplicaveis_posto",
                columns: new[] { "IgrejaId", "JornadaPostoId", "TarefaManualId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tarefas_aplicaveis_posto_IgrejaId_TarefaManualId",
                schema: "progressao",
                table: "tarefas_aplicaveis_posto",
                columns: new[] { "IgrejaId", "TarefaManualId" });

            migrationBuilder.Sql("""
                INSERT INTO progressao.tarefas_aplicaveis_posto ("Id", "IgrejaId", "JornadaPostoId", "TarefaManualId", "Versao", "CreatedAt", "UpdatedAt")
                SELECT gen_random_uuid(), posto."IgrejaId", posto."Id", tarefa."Id", gen_random_uuid(), NOW(), NOW()
                FROM progressao.jornadas_posto AS posto
                INNER JOIN progressao.tarefas_manual AS tarefa
                    ON tarefa."IgrejaId" = posto."IgrejaId" AND tarefa."VersaoManualId" = posto."VersaoManualId";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tarefas_aplicaveis_posto",
                schema: "progressao");

            migrationBuilder.DropColumn(
                name: "Ativa",
                schema: "progressao",
                table: "tarefas_manual");
        }
    }
}
