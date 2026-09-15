using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ibes.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PessoasEJornada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "progressao");

            migrationBuilder.EnsureSchema(
                name: "embaixadas");

            migrationBuilder.EnsureSchema(
                name: "pessoas");

            migrationBuilder.AddColumn<string>(
                name: "Endereco",
                schema: "organizacoes",
                table: "igrejas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pastor",
                schema: "organizacoes",
                table: "igrejas",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Versao",
                schema: "organizacoes",
                table: "igrejas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateOnly>(
                name: "DataFundacao",
                schema: "organizacoes",
                table: "embaixadas",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Endereco",
                schema: "organizacoes",
                table: "embaixadas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Historia",
                schema: "organizacoes",
                table: "embaixadas",
                type: "character varying(10000)",
                maxLength: 10000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeUsual",
                schema: "organizacoes",
                table: "embaixadas",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Versao",
                schema: "organizacoes",
                table: "embaixadas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Chave",
                schema: "auditoria",
                table: "auditoria",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "manuais",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Posto = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_manuais", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_manuais_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "pessoas",
                schema: "pessoas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DataNascimento = table.Column<DateOnly>(type: "date", nullable: true),
                    Naturalidade = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    WhatsApp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Endereco = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataBatismo = table.Column<DateOnly>(type: "date", nullable: true),
                    LocalBatismo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    NumeroCarteira = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    SituacaoCarteira = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PossuiBiblia = table.Column<bool>(type: "boolean", nullable: true),
                    Observacoes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pessoas", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_pessoas_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "versoes_manuais",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManualId = table.Column<Guid>(type: "uuid", nullable: false),
                    Identificacao = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_versoes_manuais", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_versoes_manuais_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_versoes_manuais_manuais_IgrejaId_ManualId",
                        columns: x => new { x.IgrejaId, x.ManualId },
                        principalSchema: "progressao",
                        principalTable: "manuais",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "conselheiros",
                schema: "embaixadas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Funcao = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conselheiros", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_conselheiros_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conselheiros_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conselheiros_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalSchema: "identidade",
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "fotos_pessoa",
                schema: "pessoas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Conteudo = table.Column<byte[]>(type: "bytea", nullable: false),
                    TipoConteudo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fotos_pessoa", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_fotos_pessoa_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_fotos_pessoa_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "jornadas_embaixador",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MesesPermanencia = table.Column<int>(type: "integer", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_jornadas_embaixador", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_jornadas_embaixador_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_jornadas_embaixador_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "responsaveis_pessoa",
                schema: "pessoas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResponsavelId = table.Column<Guid>(type: "uuid", nullable: false),
                    Parentesco = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_responsaveis_pessoa", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_responsaveis_pessoa_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_responsaveis_pessoa_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_responsaveis_pessoa_pessoas_IgrejaId_ResponsavelId",
                        columns: x => new { x.IgrejaId, x.ResponsavelId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vinculos_eclesiasticos",
                schema: "pessoas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    PessoaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeIgreja = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vinculos_eclesiasticos", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_vinculos_eclesiasticos_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_vinculos_eclesiasticos_pessoas_IgrejaId_PessoaId",
                        columns: x => new { x.IgrejaId, x.PessoaId },
                        principalSchema: "pessoas",
                        principalTable: "pessoas",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tarefas_manual",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersaoManualId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OrdemExibicao = table.Column<int>(type: "integer", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tarefas_manual", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_tarefas_manual_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tarefas_manual_versoes_manuais_IgrejaId_VersaoManualId",
                        columns: x => new { x.IgrejaId, x.VersaoManualId },
                        principalSchema: "progressao",
                        principalTable: "versoes_manuais",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "liderancas_embaixada",
                schema: "embaixadas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConselheiroId = table.Column<Guid>(type: "uuid", nullable: false),
                    Funcao = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataFim = table.Column<DateOnly>(type: "date", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "conclusoes_requisitos",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    JornadaEmbaixadorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Requisito = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    DataConclusao = table.Column<DateOnly>(type: "date", nullable: false),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conclusoes_requisitos", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_conclusoes_requisitos_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conclusoes_requisitos_jornadas_embaixador_IgrejaId_JornadaE~",
                        columns: x => new { x.IgrejaId, x.JornadaEmbaixadorId },
                        principalSchema: "progressao",
                        principalTable: "jornadas_embaixador",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "jornadas_posto",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    JornadaEmbaixadorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Posto = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    VersaoManualId = table.Column<Guid>(type: "uuid", nullable: true),
                    DataIngresso = table.Column<DateOnly>(type: "date", nullable: false),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    DataConclusao = table.Column<DateOnly>(type: "date", nullable: true),
                    ConcluidoPor = table.Column<Guid>(type: "uuid", nullable: true),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_jornadas_posto", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_jornadas_posto_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_jornadas_posto_jornadas_embaixador_IgrejaId_JornadaEmbaixad~",
                        columns: x => new { x.IgrejaId, x.JornadaEmbaixadorId },
                        principalSchema: "progressao",
                        principalTable: "jornadas_embaixador",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_jornadas_posto_versoes_manuais_IgrejaId_VersaoManualId",
                        columns: x => new { x.IgrejaId, x.VersaoManualId },
                        principalSchema: "progressao",
                        principalTable: "versoes_manuais",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cerimonias_reconhecimento",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    JornadaEmbaixadorId = table.Column<Guid>(type: "uuid", nullable: false),
                    JornadaPostoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Data = table.Column<DateOnly>(type: "date", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cerimonias_reconhecimento", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_cerimonias_reconhecimento_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cerimonias_reconhecimento_jornadas_embaixador_IgrejaId_Jorn~",
                        columns: x => new { x.IgrejaId, x.JornadaEmbaixadorId },
                        principalSchema: "progressao",
                        principalTable: "jornadas_embaixador",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cerimonias_reconhecimento_jornadas_posto_IgrejaId_JornadaPo~",
                        columns: x => new { x.IgrejaId, x.JornadaPostoId },
                        principalSchema: "progressao",
                        principalTable: "jornadas_posto",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "conclusoes_tarefas",
                schema: "progressao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IgrejaId = table.Column<Guid>(type: "uuid", nullable: false),
                    JornadaPostoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TarefaManualId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataConclusao = table.Column<DateOnly>(type: "date", nullable: false),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: false),
                    Versao = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conclusoes_tarefas", x => new { x.IgrejaId, x.Id });
                    table.ForeignKey(
                        name: "FK_conclusoes_tarefas_igrejas_IgrejaId",
                        column: x => x.IgrejaId,
                        principalSchema: "organizacoes",
                        principalTable: "igrejas",
                        principalColumn: "IgrejaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conclusoes_tarefas_jornadas_posto_IgrejaId_JornadaPostoId",
                        columns: x => new { x.IgrejaId, x.JornadaPostoId },
                        principalSchema: "progressao",
                        principalTable: "jornadas_posto",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conclusoes_tarefas_tarefas_manual_IgrejaId_TarefaManualId",
                        columns: x => new { x.IgrejaId, x.TarefaManualId },
                        principalSchema: "progressao",
                        principalTable: "tarefas_manual",
                        principalColumns: new[] { "IgrejaId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cerimonias_reconhecimento_IgrejaId_JornadaEmbaixadorId",
                schema: "progressao",
                table: "cerimonias_reconhecimento",
                columns: new[] { "IgrejaId", "JornadaEmbaixadorId" });

            migrationBuilder.CreateIndex(
                name: "IX_cerimonias_reconhecimento_IgrejaId_JornadaPostoId",
                schema: "progressao",
                table: "cerimonias_reconhecimento",
                columns: new[] { "IgrejaId", "JornadaPostoId" });

            migrationBuilder.CreateIndex(
                name: "IX_conclusoes_requisitos_IgrejaId_JornadaEmbaixadorId_Requisito",
                schema: "progressao",
                table: "conclusoes_requisitos",
                columns: new[] { "IgrejaId", "JornadaEmbaixadorId", "Requisito" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_conclusoes_tarefas_IgrejaId_JornadaPostoId_TarefaManualId",
                schema: "progressao",
                table: "conclusoes_tarefas",
                columns: new[] { "IgrejaId", "JornadaPostoId", "TarefaManualId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_conclusoes_tarefas_IgrejaId_TarefaManualId",
                schema: "progressao",
                table: "conclusoes_tarefas",
                columns: new[] { "IgrejaId", "TarefaManualId" });

            migrationBuilder.CreateIndex(
                name: "IX_conselheiros_IgrejaId_PessoaId",
                schema: "embaixadas",
                table: "conselheiros",
                columns: new[] { "IgrejaId", "PessoaId" });

            migrationBuilder.CreateIndex(
                name: "IX_conselheiros_UsuarioId",
                schema: "embaixadas",
                table: "conselheiros",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_fotos_pessoa_IgrejaId_PessoaId",
                schema: "pessoas",
                table: "fotos_pessoa",
                columns: new[] { "IgrejaId", "PessoaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_jornadas_embaixador_IgrejaId_PessoaId",
                schema: "progressao",
                table: "jornadas_embaixador",
                columns: new[] { "IgrejaId", "PessoaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_jornadas_posto_IgrejaId_JornadaEmbaixadorId_Posto",
                schema: "progressao",
                table: "jornadas_posto",
                columns: new[] { "IgrejaId", "JornadaEmbaixadorId", "Posto" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_jornadas_posto_IgrejaId_VersaoManualId",
                schema: "progressao",
                table: "jornadas_posto",
                columns: new[] { "IgrejaId", "VersaoManualId" });

            migrationBuilder.CreateIndex(
                name: "IX_liderancas_embaixada_IgrejaId_ConselheiroId",
                schema: "embaixadas",
                table: "liderancas_embaixada",
                columns: new[] { "IgrejaId", "ConselheiroId" });

            migrationBuilder.CreateIndex(
                name: "IX_manuais_IgrejaId_Posto",
                schema: "progressao",
                table: "manuais",
                columns: new[] { "IgrejaId", "Posto" },
                unique: true);

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
                name: "IX_tarefas_manual_IgrejaId_VersaoManualId_OrdemExibicao",
                schema: "progressao",
                table: "tarefas_manual",
                columns: new[] { "IgrejaId", "VersaoManualId", "OrdemExibicao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_versoes_manuais_IgrejaId_ManualId_Identificacao",
                schema: "progressao",
                table: "versoes_manuais",
                columns: new[] { "IgrejaId", "ManualId", "Identificacao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vinculos_eclesiasticos_IgrejaId_PessoaId",
                schema: "pessoas",
                table: "vinculos_eclesiasticos",
                columns: new[] { "IgrejaId", "PessoaId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cerimonias_reconhecimento",
                schema: "progressao");

            migrationBuilder.DropTable(
                name: "conclusoes_requisitos",
                schema: "progressao");

            migrationBuilder.DropTable(
                name: "conclusoes_tarefas",
                schema: "progressao");

            migrationBuilder.DropTable(
                name: "fotos_pessoa",
                schema: "pessoas");

            migrationBuilder.DropTable(
                name: "liderancas_embaixada",
                schema: "embaixadas");

            migrationBuilder.DropTable(
                name: "responsaveis_pessoa",
                schema: "pessoas");

            migrationBuilder.DropTable(
                name: "vinculos_eclesiasticos",
                schema: "pessoas");

            migrationBuilder.DropTable(
                name: "jornadas_posto",
                schema: "progressao");

            migrationBuilder.DropTable(
                name: "tarefas_manual",
                schema: "progressao");

            migrationBuilder.DropTable(
                name: "conselheiros",
                schema: "embaixadas");

            migrationBuilder.DropTable(
                name: "jornadas_embaixador",
                schema: "progressao");

            migrationBuilder.DropTable(
                name: "versoes_manuais",
                schema: "progressao");

            migrationBuilder.DropTable(
                name: "pessoas",
                schema: "pessoas");

            migrationBuilder.DropTable(
                name: "manuais",
                schema: "progressao");

            migrationBuilder.DropColumn(
                name: "Endereco",
                schema: "organizacoes",
                table: "igrejas");

            migrationBuilder.DropColumn(
                name: "Pastor",
                schema: "organizacoes",
                table: "igrejas");

            migrationBuilder.DropColumn(
                name: "Versao",
                schema: "organizacoes",
                table: "igrejas");

            migrationBuilder.DropColumn(
                name: "DataFundacao",
                schema: "organizacoes",
                table: "embaixadas");

            migrationBuilder.DropColumn(
                name: "Endereco",
                schema: "organizacoes",
                table: "embaixadas");

            migrationBuilder.DropColumn(
                name: "Historia",
                schema: "organizacoes",
                table: "embaixadas");

            migrationBuilder.DropColumn(
                name: "NomeUsual",
                schema: "organizacoes",
                table: "embaixadas");

            migrationBuilder.DropColumn(
                name: "Versao",
                schema: "organizacoes",
                table: "embaixadas");

            migrationBuilder.DropColumn(
                name: "Chave",
                schema: "auditoria",
                table: "auditoria");
        }
    }
}
