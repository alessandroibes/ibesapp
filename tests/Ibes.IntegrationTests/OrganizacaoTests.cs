using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ibes.Api.Features.Dominio;
using Ibes.ConsuladosDiretoria;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Ibes.Pessoas;
using Ibes.Progressao;
using Microsoft.EntityFrameworkCore;

namespace Ibes.IntegrationTests;

public sealed class OrganizacaoTests(ApiFixture api) : IClassFixture<ApiFixture>
{
    private async Task<HttpResponseMessage> Enviar(string rota, object dados, Guid? igreja = null)
    {
        var csrf = await api.Adulto.GetFromJsonAsync<JsonElement>("/bff/csrf");
        using var request = new HttpRequestMessage(HttpMethod.Post, rota) { Content = JsonContent.Create(dados) };
        request.Headers.Add("X-Igreja-Id", (igreja ?? api.IgrejaA).ToString());
        request.Headers.Add("X-CSRF-TOKEN", csrf.GetProperty("token").GetString());
        return await api.Adulto.SendAsync(request);
    }

    private static async Task<T> Ler<T>(HttpResponseMessage response)
    {
        Assert.True(response.IsSuccessStatusCode, $"{response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    private async Task<Guid> CriarMenino(bool embaixador, string? nome = null)
    {
        var pessoaId = Guid.NewGuid();
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            var pessoa = new Pessoa { Id = pessoaId, IgrejaId = api.IgrejaA, Nome = nome ?? $"Menino {pessoaId:N}", DataNascimento = new DateOnly(2010, 1, 1) };
            var jornada = new JornadaEmbaixador { IgrejaId = api.IgrejaA, PessoaId = pessoaId };
            if (embaixador)
                jornada.Postos.Add(new JornadaPosto { IgrejaId = api.IgrejaA, JornadaEmbaixadorId = jornada.Id, Posto = Posto.Escudeiro, DataIngresso = new DateOnly(2024, 1, 1), RegistradoPor = api.UsuarioId });
            db.AddRange(pessoa, jornada);
            await db.SaveChangesAsync();
        });
        return pessoaId;
    }

    private async Task<OrganizacaoResponse> Consultar(Guid? igreja = null) =>
        await Ler<OrganizacaoResponse>(await api.GetTenant("/api/v1/organizacao", igreja ?? api.IgrejaA));

    [Fact]
    public async Task CandidatoIntegraConsuladoETransferenciaPreservaHistoricoELideranca()
    {
        var menino = await CriarMenino(false);
        var origem = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/consulados", new ConsuladoRequest("Davi", new DateOnly(2024, 1, 1))));
        var destino = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/consulados", new ConsuladoRequest("Emaús", new DateOnly(2024, 1, 1))));
        var membro = await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/consulados/{origem.Id}/membros", new MembroRequest(menino, new DateOnly(2024, 2, 1))));
        var consul = await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/consulados/{origem.Id}/consul", new ConsulRequest(membro.Id, new DateOnly(2024, 3, 1))));
        var novo = await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/membros/{membro.Id}/transferencia", new TransferenciaRequest(membro.Versao, destino.Id, new DateOnly(2025, 1, 1))));

        var dados = await Consultar();
        var anterior = dados.Consulados.Single(x => x.Id == origem.Id).Membros.Single(x => x.Id == membro.Id);
        var lideranca = dados.Consulados.Single(x => x.Id == origem.Id).Consules.Single(x => x.Id == consul.Id);
        var atual = dados.Consulados.Single(x => x.Id == destino.Id).Membros.Single(x => x.Id == novo.Id);
        Assert.Equal(new DateOnly(2025, 1, 1), anterior.DataFim);
        Assert.Equal("Transferência de Consulado", anterior.MotivoFim);
        Assert.Equal(anterior.DataFim, lideranca.DataFim);
        Assert.Equal(anterior.DataFim, atual.DataInicio);
        Assert.Single(dados.Consulados.SelectMany(x => x.Membros), x => x.PessoaId == menino && x.DataFim is null);
    }

    [Fact]
    public async Task ConsulDeveSerMembroEVigenteEUnico()
    {
        var membroUm = await CriarMenino(false);
        var membroDois = await CriarMenino(true);
        var consulado = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/consulados", new ConsuladoRequest($"Jerusalém {Guid.NewGuid():N}", new DateOnly(2024, 1, 1))));
        Assert.Equal(HttpStatusCode.NotFound, (await Enviar($"/api/v1/organizacao/consulados/{consulado.Id}/consul", new ConsulRequest(Guid.NewGuid(), new DateOnly(2024, 2, 1)))).StatusCode);
        var primeiro = await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/consulados/{consulado.Id}/membros", new MembroRequest(membroUm, new DateOnly(2024, 1, 1))));
        var segundo = await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/consulados/{consulado.Id}/membros", new MembroRequest(membroDois, new DateOnly(2024, 1, 1))));
        await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/consulados/{consulado.Id}/consul", new ConsulRequest(primeiro.Id, new DateOnly(2024, 2, 1))));
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/organizacao/consulados/{consulado.Id}/consul", new ConsulRequest(segundo.Id, new DateOnly(2024, 2, 1)))).StatusCode);
    }

    [Fact]
    public async Task DiretoriaAceitaSomenteEmbaixadorRespeitaVagasEPermiteMaisDeUmCargo()
    {
        var candidato = await CriarMenino(false);
        var embaixador = await CriarMenino(true);
        var cargoUm = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/cargos", new CargoRequest("Embaixador Chefe", 1)));
        var cargoDois = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/cargos", new CargoRequest("Secretário", 1)));
        var mandato = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/mandatos", new MandatoRequest($"Mandato {Guid.NewGuid():N}", new DateOnly(2025, 1, 1), new DateOnly(2026, 12, 31), null)));
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/organizacao/mandatos/{mandato.Id}/ocupacoes", new OcupacaoRequest(mandato.Versao, cargoUm.Id, candidato, new DateOnly(2025, 1, 1)))).StatusCode);

        await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/mandatos/{mandato.Id}/ocupacoes", new OcupacaoRequest(mandato.Versao, cargoUm.Id, embaixador, new DateOnly(2025, 1, 1))));
        Assert.Equal(HttpStatusCode.Conflict, (await Enviar($"/api/v1/organizacao/mandatos/{mandato.Id}/ocupacoes", new OcupacaoRequest(mandato.Versao, cargoDois.Id, embaixador, new DateOnly(2025, 2, 1)))).StatusCode);
        var atualizado = (await Consultar()).Mandatos.Single(x => x.Id == mandato.Id);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enviar($"/api/v1/organizacao/mandatos/{mandato.Id}/ocupacoes", new OcupacaoRequest(atualizado.Versao, cargoUm.Id, embaixador, new DateOnly(2025, 2, 1)))).StatusCode);
        atualizado = (await Consultar()).Mandatos.Single(x => x.Id == mandato.Id);
        await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/mandatos/{mandato.Id}/ocupacoes", new OcupacaoRequest(atualizado.Versao, cargoDois.Id, embaixador, new DateOnly(2025, 2, 1))));
        Assert.Equal(2, (await Consultar()).Mandatos.Single(x => x.Id == mandato.Id).Ocupacoes.Count(x => x.PessoaId == embaixador));
    }

    [Fact]
    public async Task EleicaoRegistraResultadoImutavelSemConcederPermissao()
    {
        var embaixador = await CriarMenino(true);
        var cargo = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/cargos", new CargoRequest($"Porta-Voz {Guid.NewGuid():N}", 1)));
        var mandato = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/mandatos", new MandatoRequest($"Mandato {Guid.NewGuid():N}", new DateOnly(2024, 1, 1), new DateOnly(2024, 12, 31), null)));
        var permissoesAntes = Array.Empty<string>();
        await api.NaIgreja(api.IgrejaA, async db => permissoesAntes = (await db.VinculosIgreja.SingleAsync()).Permissoes.ToArray());
        await Ler<IdResponse>(await Enviar($"/api/v1/organizacao/mandatos/{mandato.Id}/eleicoes", new EleicaoRequest(mandato.Versao, cargo.Id, embaixador, new DateOnly(2024, 2, 1), "Eleição extraordinária")));
        var dados = (await Consultar()).Mandatos.Single(x => x.Id == mandato.Id);
        Assert.Single(dados.Eleicoes);
        Assert.Single(dados.Ocupacoes);
        Assert.False(dados.Ocupacoes[0].MembroIgreja);
        await api.NaIgreja(api.IgrejaA, async db =>
        {
            Assert.Equal(permissoesAntes, (await db.VinculosIgreja.SingleAsync()).Permissoes);
            var eleicao = await db.Set<ResultadoEleicao>().SingleAsync(x => x.MandatoDiretoriaId == mandato.Id);
            eleicao.Motivo = "Alteração indevida";
            await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
        });
    }

    [Fact]
    public async Task OrganizacaoFicaIsoladaPorIgrejaInclusiveNasChavesEstrangeiras()
    {
        var menino = await CriarMenino(false);
        var consulado = await Ler<IdResponse>(await Enviar("/api/v1/organizacao/consulados", new ConsuladoRequest($"Belém {Guid.NewGuid():N}", new DateOnly(2024, 1, 1))));
        await api.NaIgreja(api.IgrejaB, async db =>
        {
            db.VinculosIgreja.Add(new VinculoIgreja { IgrejaId = api.IgrejaB, UsuarioId = api.UsuarioId, Permissoes = [Permissoes.ConsultarOrganizacao] });
            await db.SaveChangesAsync();
        });
        try
        {
            Assert.Empty((await Consultar(api.IgrejaB)).Consulados);
            await api.NaIgreja(api.IgrejaA, async db =>
            {
                db.Add(new MembroConsulado { IgrejaId = api.IgrejaA, ConsuladoId = consulado.Id, PessoaId = Guid.NewGuid(), DataInicio = new DateOnly(2024, 1, 1) });
                await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            });
            await api.NaIgreja(null, async db =>
            {
                Assert.Empty(await db.Set<Consulado>().ToListAsync());
                Assert.Empty(await db.Set<MandatoDiretoria>().ToListAsync());
                Assert.Empty(await db.Set<ResultadoEleicao>().ToListAsync());
            });
        }
        finally
        {
            await api.NaIgreja(api.IgrejaB, async db =>
            {
                db.VinculosIgreja.Remove(await db.VinculosIgreja.SingleAsync());
                await db.SaveChangesAsync();
            });
        }
    }
}
