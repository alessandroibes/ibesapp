import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import type { components } from "../../../packages/contracts/api";
import { Dominio } from "./dominio/Dominio";

type Igreja = components["schemas"]["IgrejaResponse"];
type Contexto = components["schemas"]["ContextoResponse"];
type Estado = "loading" | "anonimo" | "pronto" | "erro";

function Marca() {
  return (
    <a href="/" className="marca" aria-label="Embaixadores do Rei — início">
      <span className="simbolo" aria-hidden="true">
        ER
      </span>
      <span className="marca-texto">
        <strong>Embaixadores</strong>
        <small>do Rei</small>
      </span>
    </a>
  );
}

export function App() {
  const [estado, setEstado] = useState<Estado>("loading");
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [igrejaId, setIgrejaId] = useState("");
  const [contexto, setContexto] = useState<Contexto>();
  const [erroContexto, setErroContexto] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/bff/sessao", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setEstado("anonimo");
          return;
        }
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { igrejas: Igreja[] };
        setIgrejas(data.igrejas);
        setIgrejaId(data.igrejas[0]?.igrejaId ?? "");
        setEstado("pronto");
      })
      .catch(() => {
        if (!controller.signal.aborted) setEstado("erro");
      });
    return () => controller.abort();
  }, [tentativa]);

  useEffect(() => {
    if (!igrejaId) return;
    const controller = new AbortController();
    fetch("/api/v1/contexto", {
      headers: { "X-Igreja-Id": igrejaId },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          setEstado("anonimo");
          return;
        }
        if (!response.ok) throw new Error();
        setContexto(await response.json());
      })
      .catch(() => {
        if (!controller.signal.aborted) setErroContexto(true);
      });
    return () => controller.abort();
  }, [igrejaId, tentativa]);

  function tentarNovamente() {
    setEstado("loading");
    setContexto(undefined);
    setErroContexto(false);
    setTentativa((t) => t + 1);
  }

  async function sair() {
    setSaindo(true);
    try {
      const csrf = await fetch("/bff/csrf");
      if (!csrf.ok) throw new Error();
      const { token } = (await csrf.json()) as { token: string };
      const response = await fetch("/bff/sair", {
        method: "POST",
        headers: { "X-CSRF-TOKEN": token },
      });
      if (!response.ok) throw new Error();
      setContexto(undefined);
      setIgrejas([]);
      setIgrejaId("");
      setEstado("anonimo");
    } catch {
      setEstado("erro");
    } finally {
      setSaindo(false);
    }
  }

  const areaAtiva = estado === "pronto" && !!contexto && !erroContexto;

  if (!areaAtiva) {
    return (
      <div className="pagina-acesso">
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="cabecalho-acesso">
          <Marca />
        </header>
        <main id="conteudo" className="conteudo-acesso">
          <section className="apresentacao-acesso">
            <span className="selo-acesso">Gestão da Embaixada</span>
            <h1>Servir, aprender e crescer juntos.</h1>
            <p>
              Um espaço seguro para Conselheiros cuidarem de cada jornada dos
              Embaixadores do Rei.
            </p>
            <div className="frase-acesso">
              <span aria-hidden="true">✦</span>
              <p>
                “Somos embaixadores por Cristo.” <small>2 Coríntios 5:20</small>
              </p>
            </div>
          </section>
          <section
            className="cartao-acesso"
            aria-labelledby="titulo-acesso"
            aria-busy={estado === "loading"}
          >
            <div className="icone-acesso" aria-hidden="true">
              ER
            </div>
            <p className="rotulo-secao">Acesso restrito</p>
            <h2 id="titulo-acesso">Entre na sua Embaixada</h2>
            <p className="texto-secundario">
              Use sua conta de liderança para continuar.
            </p>
            {estado === "loading" && (
              <p role="status" className="estado-carregando">
                Verificando seu acesso…
              </p>
            )}
            {estado === "pronto" && igrejas.length > 0 && !contexto && (
              <p role="status" className="estado-carregando">
                Carregando sua Embaixada…
              </p>
            )}
            {estado === "anonimo" && (
              <Button asChild className="botao-acesso">
                <a href="/conta/entrar">
                  Entrar na minha conta <span aria-hidden="true">→</span>
                </a>
              </Button>
            )}
            {estado === "pronto" && igrejas.length === 0 && (
              <div className="estado-vazio">
                <p>Você ainda não possui vínculo com uma Igreja.</p>
              </div>
            )}
            {(estado === "erro" || erroContexto) && (
              <div role="alert" className="estado-erro">
                <p>Não foi possível carregar seu acesso. Tente novamente.</p>
                <Button onClick={tentarNovamente}>Tentar novamente</Button>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app app-autenticado">
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="barra-superior">
        <Marca />
        <div className="contexto-superior">
          <label htmlFor="igreja">Igreja</label>
          <select
            id="igreja"
            value={igrejaId}
            onChange={(e) => {
              setContexto(undefined);
              setErroContexto(false);
              setIgrejaId(e.target.value);
            }}
          >
            {igrejas.map((igreja) => (
              <option key={igreja.igrejaId} value={igreja.igrejaId}>
                {igreja.nome}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          onClick={sair}
          disabled={saindo}
          className="botao-sair"
        >
          {saindo ? "Saindo…" : "Sair"}
        </Button>
      </header>
      <main id="conteudo" className="conteudo-app">
        <div className="cabecalho-pagina">
          <div>
            <p className="caminho-pagina">
              Embaixada <span aria-hidden="true">/</span> Área de trabalho
            </p>
            <h1>{contexto.embaixada}</h1>
            <p>{contexto.igreja}</p>
          </div>
          <span className="contexto-ativo">
            <i aria-hidden="true" /> Contexto ativo
          </span>
        </div>
        <Dominio
          key={igrejaId}
          igrejaId={igrejaId}
          permissoes={contexto.permissoes ?? []}
        />
      </main>
    </div>
  );
}
