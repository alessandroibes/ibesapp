import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import type { components } from "../../../packages/contracts/api";
import { Dominio } from "./dominio/Dominio";

type Igreja = components["schemas"]["IgrejaResponse"];
type Contexto = components["schemas"]["ContextoResponse"];
type Estado = "loading" | "anonimo" | "pronto" | "erro";
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
  return (
    <div className={`app${areaAtiva ? " app-autenticado" : ""}`}>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header>
        <a href="/" className="marca">
          <span className="simbolo" aria-hidden="true">
            ER
          </span>
          <span>
            EMBAIXADORES
            <br />
            DO REI
          </span>
        </a>
        <span className="assinatura">Servir. Aprender. Crescer.</span>
        {estado === "pronto" && (
          <Button variant="outline" onClick={sair} disabled={saindo}>
            {saindo ? "Saindo…" : "Sair"}
          </Button>
        )}
      </header>
      <main id="conteudo">
        <section
          className={`abertura${areaAtiva ? " abertura-operacional" : ""}`}
        >
          <p className="eyebrow">
            {areaAtiva ? "GESTÃO DA EMBAIXADA" : "UM PROPÓSITO QUE NOS UNE"}
          </p>
          {areaAtiva ? (
            <>
              <h1>{contexto.embaixada}</h1>
              <p className="introducao">{contexto.igreja}</p>
            </>
          ) : (
            <>
              <h1>
                Cuidar de cada jornada.
                <br />
                <em>Construir juntos.</em>
              </h1>
              <p className="introducao">
                Um espaço para apoiar Conselheiros e liderança adulta no serviço
                de sua Embaixada.
              </p>
            </>
          )}
        </section>
        <section
          className={`painel${areaAtiva ? " painel-operacional" : ""}`}
          aria-labelledby="titulo-acesso"
          aria-busy={estado === "loading"}
        >
          <div>
            <p className="eyebrow">
              {areaAtiva ? "CONTEXTO ATUAL" : "SUA EMBAIXADA"}
            </p>
            <h2 id="titulo-acesso">
              {areaAtiva ? "Igreja selecionada" : "Nosso ponto de encontro"}
            </h2>
          </div>
          {estado === "loading" && <p role="status">Verificando seu acesso…</p>}
          {estado === "anonimo" && (
            <div className="acesso">
              <p>Entre com sua conta para acessar sua Igreja.</p>
              <Button asChild>
                <a href="/conta/entrar">
                  Entrar na minha conta <span aria-hidden="true">↗</span>
                </a>
              </Button>
            </div>
          )}
          {(estado === "erro" || erroContexto) && (
            <div role="alert">
              <p>Não foi possível carregar seu acesso. Tente novamente.</p>
              <Button onClick={tentarNovamente}>Tentar novamente</Button>
            </div>
          )}
          {estado === "pronto" && !erroContexto && (
            <div className="acesso">
              {igrejas.length === 0 ? (
                <p>Você ainda não possui vínculo com uma Igreja.</p>
              ) : (
                <>
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
                    {igrejas.map((i) => (
                      <option key={i.igrejaId} value={i.igrejaId}>
                        {i.nome}
                      </option>
                    ))}
                  </select>
                  {contexto ? (
                    <p role="status">
                      Você está trabalhando em {contexto.embaixada}.
                    </p>
                  ) : (
                    <p role="status">Carregando sua Embaixada…</p>
                  )}
                </>
              )}
            </div>
          )}
        </section>
        {!areaAtiva && (
          <aside className="nota">
            <span aria-hidden="true">✦</span>
            <p>
              “Somos embaixadores por Cristo.”<small>2 Coríntios 5:20</small>
            </p>
          </aside>
        )}
        {estado === "pronto" &&
        contexto?.permissoes?.length &&
        !erroContexto ? (
          <Dominio
            key={igrejaId}
            igrejaId={igrejaId}
            permissoes={contexto.permissoes}
          />
        ) : null}
      </main>
      <footer>
        <span>EMBAIXADORES DO REI</span>
        <span>Fé que inspira. Serviço que transforma.</span>
      </footer>
    </div>
  );
}
