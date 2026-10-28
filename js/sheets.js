import { SHEETS_WEBAPP_URL } from "./config.js";

const CHAVE_SEGREDO = "voce1b_sheets_segredo";
export const getSegredo = () => localStorage.getItem(CHAVE_SEGREDO) || "";
export const setSegredo = (v) => localStorage.setItem(CHAVE_SEGREDO, v);

export async function sincronizarTudo(lista) {
  const segredo = getSegredo();
  if (!SHEETS_WEBAPP_URL || !segredo) return { ok: false, motivo: "nao-configurado" };
  const dados = lista.filter((d) => d.status);
  const lotes = [];
  for (let i = 0; i < dados.length; i += 100) lotes.push(dados.slice(i, i + 100));
  try {
    for (const lote of lotes) {
      const resp = await fetch(SHEETS_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ segredo, lote }),
      });
      if (!resp.ok) throw new Error("http " + resp.status);
    }
    return { ok: true, total: dados.length };
  } catch (e) {
    return { ok: false, motivo: "erro", total: dados.length };
  }
}
