using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ibes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OperacaoEAgenda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "frequencia");

            migrationBuilder.EnsureSchema(
                name: "agenda");

            migrationBuilder.CreateTable(
                name: "entidades_promotoras",
                schema: "agenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entidades_promotoras", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_entidades_promotoras_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "modelos_reuniao",
                schema: "agenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ItensJson = table.Column<string>(type: "jsonb", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_modelos_reuniao", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_modelos_reuniao_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tipos_atividade",
                schema: "agenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tipos_atividade", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_tipos_atividade_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "atividades_agenda",
                schema: "agenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TipoAtividadeId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntidadePromotoraId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResponsavelId = table.Column<Guid>(type: "uuid", nullable: true),
                    AtividadeRelacionadaId = table.Column<Guid>(type: "uuid", nullable: true),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: false),
                    HoraInicio = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    HoraFim = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    DiaInteiro = table.Column<bool>(type: "boolean", nullable: false),
                    Prazo = table.Column<bool>(type: "boolean", nullable: false),
                    Destaque = table.Column<bool>(type: "boolean", nullable: false),
                    FusoHorario = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Local = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Observacoes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Valor = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    Moeda = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Link = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Situacao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Periodicidade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Intervalo = table.Column<int>(type: "integer", nullable: false),
                    DiasSemana = table.Column<int[]>(type: "integer[]", nullable: false),
                    RecorrenciaAte = table.Column<DateOnly>(type: "date", nullable: true),
                    SerieEncerradaEm = table.Column<DateOnly>(type: "date", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_atividades_agenda", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_atividades_agenda_atividades_agenda_IgrejaId_AtividadeRelac~",
                        columns: x => new { x.IgrejaId, x.AtividadeRelacionadaId },
                        principalSchema: "agenda",
                        principalTable: "atividades_agenda",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_atividades_agenda_entidades_promotoras_IgrejaId_EntidadePro~",
                        columns: x => new { x.IgrejaId, x.EntidadePromotoraId },
                        principalSchema: "agenda",
                        principalTable: "entidades_promotoras",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_atividades_agenda_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_atividades_agenda_pessoas_IgrejaId_ResponsavelId",
                        columns: x => new { x.IgrejaId, x.ResponsavelId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_atividades_agenda_tipos_atividade_IgrejaId_TipoAtividadeId",
                        columns: x => new { x.IgrejaId, x.TipoAtividadeId },
                        principalSchema: "agenda",
                        principalTable: "tipos_atividade",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "excecoes_agenda",
                schema: "agenda",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    AtividadeAgendaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataOriginal = table.Column<DateOnly>(type: "date", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: false),
                    HoraInicio = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    HoraFim = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    Situacao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Observacoes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_excecoes_agenda", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_excecoes_agenda_atividades_agenda_IgrejaId_AtividadeAgendaId",
                        columns: x => new { x.IgrejaId, x.AtividadeAgendaId },
                        principalSchema: "agenda",
                        principalTable: "atividades_agenda",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_excecoes_agenda_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "reunioes",
                schema: "frequencia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    AtividadeAgendaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataOriginal = table.Column<DateOnly>(type: "date", nullable: false),
                    Data = table.Column<DateOnly>(type: "date", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ModeloReuniaoId = table.Column<Guid>(type: "uuid", nullable: true),
                    VersaoModelo = table.Column<Guid>(type: "uuid", nullable: true),
                    RoteiroJson = table.Column<string>(type: "jsonb", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reunioes", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_reunioes_atividades_agenda_IgrejaId_AtividadeAgendaId",
                        columns: x => new { x.IgrejaId, x.AtividadeAgendaId },
                        principalSchema: "agenda",
                        principalTable: "atividades_agenda",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reunioes_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reunioes_modelos_reuniao_IgrejaId_ModeloReuniaoId",
                        columns: x => new { x.IgrejaId, x.ModeloReuniaoId },
                        principalSchema: "agenda",
                        principalTable: "modelos_reuniao",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "registros_frequencia",
                schema: "frequencia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReuniaoId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Situacao = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Observacoes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_registros_frequencia", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_registros_frequencia_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_registros_frequencia_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_registros_frequencia_reunioes_IgrejaId_ReuniaoId",
                        columns: x => new { x.IgrejaId, x.ReuniaoId },
                        principalSchema: "frequencia",
                        principalTable: "reunioes",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "alteracoes_frequencia",
                schema: "frequencia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegistroFrequenciaId = table.Column<Guid>(type: "uuid", nullable: false),
                    SituacaoAnterior = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Situacao = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Observacoes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alteracoes_frequencia", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_alteracoes_frequencia_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_alteracoes_frequencia_registros_frequencia_IgrejaId_Registr~",
                        columns: x => new { x.IgrejaId, x.RegistroFrequenciaId },
                        principalSchema: "frequencia",
                        principalTable: "registros_frequencia",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_alteracoes_frequencia_IgrejaId_RegistroFrequenciaId",
                schema: "frequencia",
                table: "alteracoes_frequencia",
                columns: new[] { "IgrejaId", "RegistroFrequenciaId" });

            migrationBuilder.CreateIndex(
                name: "IX_atividades_agenda_IgrejaId_AtividadeRelacionadaId",
                schema: "agenda",
                table: "atividades_agenda",
                columns: new[] { "IgrejaId", "AtividadeRelacionadaId" });

            migrationBuilder.CreateIndex(
                name: "IX_atividades_agenda_IgrejaId_DataInicio",
                schema: "agenda",
                table: "atividades_agenda",
                columns: new[] { "IgrejaId", "DataInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_atividades_agenda_IgrejaId_EntidadePromotoraId",
                schema: "agenda",
                table: "atividades_agenda",
                columns: new[] { "IgrejaId", "EntidadePromotoraId" });

            migrationBuilder.CreateIndex(
                name: "IX_atividades_agenda_IgrejaId_ResponsavelId",
                schema: "agenda",
                table: "atividades_agenda",
                columns: new[] { "IgrejaId", "ResponsavelId" });

            migrationBuilder.CreateIndex(
                name: "IX_atividades_agenda_IgrejaId_TipoAtividadeId",
                schema: "agenda",
                table: "atividades_agenda",
                columns: new[] { "IgrejaId", "TipoAtividadeId" });

            migrationBuilder.CreateIndex(
                name: "IX_excecoes_agenda_IgrejaId_AtividadeAgendaId_DataOriginal",
                schema: "agenda",
                table: "excecoes_agenda",
                columns: new[] { "IgrejaId", "AtividadeAgendaId", "DataOriginal" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_registros_frequencia_IgrejaId_PessoaId",
                schema: "frequencia",
                table: "registros_frequencia",
                columns: new[] { "IgrejaId", "PessoaId" });

            migrationBuilder.CreateIndex(
                name: "IX_registros_frequencia_IgrejaId_ReuniaoId_PessoaId",
                schema: "frequencia",
                table: "registros_frequencia",
                columns: new[] { "IgrejaId", "ReuniaoId", "PessoaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reunioes_IgrejaId_AtividadeAgendaId_DataOriginal",
                schema: "frequencia",
                table: "reunioes",
                columns: new[] { "IgrejaId", "AtividadeAgendaId", "DataOriginal" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reunioes_IgrejaId_ModeloReuniaoId",
                schema: "frequencia",
                table: "reunioes",
                columns: new[] { "IgrejaId", "ModeloReuniaoId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alteracoes_frequencia",
                schema: "frequencia");

            migrationBuilder.DropTable(
                name: "excecoes_agenda",
                schema: "agenda");

            migrationBuilder.DropTable(
                name: "registros_frequencia",
                schema: "frequencia");

            migrationBuilder.DropTable(
                name: "reunioes",
                schema: "frequencia");

            migrationBuilder.DropTable(
                name: "atividades_agenda",
                schema: "agenda");

            migrationBuilder.DropTable(
                name: "modelos_reuniao",
                schema: "agenda");

            migrationBuilder.DropTable(
                name: "entidades_promotoras",
                schema: "agenda");

            migrationBuilder.DropTable(
                name: "tipos_atividade",
                schema: "agenda");
        }
    }
}
