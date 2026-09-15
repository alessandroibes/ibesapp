import { useState } from "react";
import type { components } from "../../../../packages/contracts/api";
import { type Api, useConsulta } from "./api";
import { Estado, Formulario } from "./componentes";
export function Manuais({ api, editar }: { api: Api; editar: boolean }) {
  const [revisao, setRevisao] = useState(0);
  const [posto, setPosto] = useState("1");
  const atualizar = () => setRevisao((r) => r + 1);
  const consulta = useConsulta<components["schemas"]["ManualResponse"][]>(
    api,
    "/manuais",
    revisao,
  );
  const conhecidas = useConsulta<Record<string, string[]>>(
    api,
    editar ? "/manuais/tarefas-conhecidas" : null,
    revisao,
  );
  return (
    <section>
      <h2>Manuais e versões</h2>
      <p>
        A edição é informada explicitamente. Cada jornada mantém a versão
        escolhida no ingresso naquele posto.
      </p>
      <Estado {...consulta} atualizar={atualizar} />
      {consulta.dados?.length === 0 && (
        <p>
          Nenhuma versão cadastrada. Não foi presumida edição dos manuais
          conhecidos.
        </p>
      )}
      {consulta.dados?.map((m) => (
        <details key={m.id}>
          <summary>
            {m.nomePosto} · {m.identificacao}
          </summary>
          <ul>
            {m.tarefas.map((t) => (
              <li key={t.id}>{t.nome}</li>
            ))}
          </ul>
          <p>Tarefas podem ser concluídas em qualquer ordem.</p>
        </details>
      ))}
      <p>
        Emérito: ingresso permitido após concluir o Sênior. Seu manual e suas
        tarefas aguardam definição.
      </p>
      {editar && (
        <>
          <h3>Cadastrar versão identificada</h3>
          <label>
            Posto do manual
            <select value={posto} onChange={(e) => setPosto(e.target.value)}>
              <option value="1">Embaixador Escudeiro</option>
              <option value="2">Embaixador Arauto</option>
              <option value="3">Embaixador Sênior</option>
            </select>
          </label>
          <Estado {...conhecidas} atualizar={atualizar} />
          {conhecidas.dados && (
            <Formulario
              key={`${posto}-${revisao}`}
              titulo="Nova versão do manual"
              campos={[
                {
                  nome: "identificacao",
                  rotulo: "Identificação exata da edição",
                  obrigatorio: true,
                  limite: 150,
                },
                {
                  nome: "tarefas",
                  rotulo: "Tarefas, uma por linha",
                  tipo: "textarea",
                  obrigatorio: true,
                  limite: 100000,
                },
              ]}
              iniciais={{
                tarefas:
                  conhecidas.dados[
                    { "1": "Escudeiro", "2": "Arauto", "3": "Senior" }[posto]!
                  ]?.join("\n"),
              }}
              salvar={async (d) => {
                await api("/manuais/versoes", {
                  posto: Number(posto),
                  identificacao: d.identificacao,
                  tarefas: d.tarefas
                    .split("\n")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
                atualizar();
              }}
            />
          )}
        </>
      )}
    </section>
  );
}
