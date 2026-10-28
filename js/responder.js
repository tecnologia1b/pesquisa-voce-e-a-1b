import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, runTransaction, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { Q, CONCORDO, DESEJO, LIDER } from "./perguntas.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
try { await enableIndexedDbPersistence(db); } catch (e) { /* aba extra aberta ou navegador sem suporte — segue sem persistência offline */ }

const params = new URLSearchParams(location.search);
const origem = params.get("origem") === "culto" ? "culto" : "online";
const sessao = params.get("sessao") === "teste" ? "teste" : "oficial";
const RESPOSTAS_COL = sessao === "teste" ? "respostas_teste" : "respostas";

let A = {}, pos = -1, sub = 0;
let uid = null, statusPesquisa = null, docCarregado = false, enviando = false, pendingWrites = false;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const vis = () => Q.filter((q) => { if (!q.se) return true; const v = A[q.se[0]]; if (v == null) return false; return Array.isArray(v) ? v.some((x) => q.se[1].includes(x)) : q.se[1].includes(v); });
function limpar() { Q.forEach((q) => { if (q.se && !vis().includes(q)) delete A[q.id]; }); }
const escalaHTML = (lb, sel) => `<div class="opcs">` + [1, 2, 3, 4, 5].map((n) => `<button class="opc ${sel === n ? "on" : ""}" role="radio" aria-checked="${sel === n}" data-n="${n}"><span class="n">${n}</span>${esc(lb[n])}</button>`).join("") + `</div>`;

function payload(extra) {
  const campos = {};
  Q.forEach((q) => { if (A[q.id] !== undefined) campos[q.id] = A[q.id]; });
  return { ...campos, origem, _pos: pos, _sub: sub, ...extra };
}

function salvar(extra) {
  if (!uid) return;
  setDoc(doc(db, RESPOSTAS_COL, uid), payload({ status: "em_andamento", ...extra }), { merge: true }).catch(() => {});
}

async function enviarFinal() {
  if (!uid || enviando) return;
  enviando = true;
  render();
  try {
    if (sessao === "teste") {
      // sessão de teste nunca mexe no contador real do telão
      await setDoc(doc(db, RESPOSTAS_COL, uid), payload({ status: "concluida", concluidoEm: serverTimestamp() }), { merge: true });
    } else {
      await runTransaction(db, async (tx) => {
        const contRef = doc(db, "contador", "total");
        const contSnap = await tx.get(contRef);
        const novoN = (contSnap.data()?.n || 0) + 1;
        tx.set(doc(db, RESPOSTAS_COL, uid), payload({ status: "concluida", concluidoEm: serverTimestamp() }), { merge: true });
        tx.update(contRef, { n: novoN });
      });
    }
    localStorage.setItem("voce1b_concluido", "1");
    enviando = false;
    telaFim();
  } catch (e) {
    enviando = false;
    render();
    alert("Não deu pra enviar agora. Confira sua internet e tenta de novo.");
  }
}

function render() {
  if (statusPesquisa === null || !docCarregado) { $("#corpo").innerHTML = `<p class="txt">Carregando…</p>`; $("#rodape").innerHTML = ""; return; }
  if (statusPesquisa !== "aberta") {
    $("#barra").style.width = "0%";
    $("#corpo").innerHTML = `<span class="tag-line">Pesquisa · 1B</span><h1>A pesquisa está encerrada.</h1><p class="txt">Obrigado por querer participar!</p>`;
    $("#rodape").innerHTML = "";
    return;
  }
  if (A._concluida) { telaFim(true); return; }

  const lista = vis(), corpo = $("#corpo"), rod = $("#rodape");
  corpo.classList.remove("fade"); void corpo.offsetWidth; corpo.classList.add("fade");
  window.scrollTo(0, 0);

  if (pos < 0) {
    $("#barra").style.width = "0%";
    corpo.innerHTML = `<span class="tag-line">Pesquisa · 1B</span>
      <h1>Você e a 1B</h1>
      <p class="txt">Queremos conhecer melhor você: seu momento de vida, o que você busca na sua fé e como você vive a igreja hoje.</p>
      <p class="txt">Não tem resposta certa. É anônimo e leva uns 8 minutos.</p>`;
    rod.innerHTML = `<button class="btn btn-verde" id="prox">Começar</button>`;
    $("#prox").onclick = () => { pos = 0; sub = 0; salvar(); render(); };
    return;
  }

  if (pos >= lista.length) { enviarFinal(); return; }

  const q = lista[pos], v = A[q.id];
  const tot = lista.length, at = pos + 1;
  $("#barra").style.width = Math.round((at / tot) * 100) + "%";
  let h = `<span class="tag-line">${esc(q.s)}</span><div class="cont">Pergunta ${at} de ${tot}</div><h2>${esc(q.q)}</h2>${q.i ? `<p class="instr">${esc(q.i)}</p>` : `<div style="height:12px"></div>`}`;
  let ok = true, lbl = "Próxima";

  if (q.t === "unica") {
    h += `<div class="opcs" role="radiogroup">` + q.o.map((o) => `<button class="opc ${v === o ? "on" : ""}" role="radio" aria-checked="${v === o}" data-o="${esc(o)}"><span class="mk"></span>${esc(o)}</button>`).join("") + `</div>`;
    ok = v != null;
  } else if (q.t === "multipla") {
    const sel = v || [], cheio = q.max && sel.length >= q.max;
    h += `<div class="opcs multi">` + q.o.map((o) => `<button class="opc ${sel.includes(o) ? "on" : cheio ? "off" : ""}" aria-pressed="${sel.includes(o)}" data-o="${esc(o)}"><span class="mk"></span>${esc(o)}</button>`).join("") + `</div>`;
    if (q.max) h += `<div class="contador">${sel.length} de ${q.max} escolhidas</div>`;
    ok = sel.length > 0;
  } else if (q.t === "escala") {
    h += escalaHTML(q.lb, v); ok = v != null;
  } else if (q.t === "grade") {
    const arr = v || Array(q.it.length).fill(null);
    h += `<div class="cont">Afirmação ${sub + 1} de ${q.it.length}</div><div class="item">${esc(q.it[sub])}</div>` + escalaHTML(q.lb, arr[sub]);
    ok = arr[sub] != null;
  } else if (q.t === "aberta") {
    h += `<label for="txt" class="instr" style="margin-bottom:8px">Opcional. Escreva com suas palavras.</label><textarea id="txt" maxlength="600" placeholder="${esc(q.ph || "Escreva aqui")}">${esc(v || "")}</textarea><div class="dica" id="cnt">${(v || "").length}/600</div>`;
    lbl = v && v.trim() ? "Próxima" : "Pular";
  }

  const ultimo = pos === tot - 1 && (q.t !== "grade" || sub === q.it.length - 1);
  if (ultimo && lbl === "Próxima") lbl = "Enviar";
  h += `<div class="salvo">${enviando ? "enviando…" : pendingWrites ? "enviando…" : "salvo ✓"}</div>`;
  corpo.innerHTML = h;
  rod.innerHTML = `<button class="btn btn-out" id="volta">Voltar</button><button class="btn btn-verde" id="prox" ${ok ? "" : "disabled"} ${enviando ? "disabled" : ""}>${enviando ? "Enviando…" : lbl}</button>`;

  corpo.querySelectorAll(".opc[data-o]").forEach((b) => (b.onclick = () => {
    const o = b.dataset.o;
    if (q.t === "unica") { A[q.id] = o; limpar(); salvar(); render(); return; }
    let s = (A[q.id] || []).slice();
    if (s.includes(o)) s = s.filter((x) => x !== o);
    else { const ex = q.ex || []; if (ex.includes(o)) s = [o]; else { s = s.filter((x) => !ex.includes(x)); if (q.max && s.length >= q.max) return; s.push(o); } }
    if (s.length) A[q.id] = s; else delete A[q.id];
    salvar(); render();
  }));
  corpo.querySelectorAll(".opc[data-n]").forEach((b) => (b.onclick = () => {
    const n = +b.dataset.n;
    if (q.t === "escala") A[q.id] = n;
    else { const arr = (A[q.id] || Array(q.it.length).fill(null)).slice(); arr[sub] = n; A[q.id] = arr; }
    salvar(); render();
  }));
  const t = $("#txt");
  if (t) t.oninput = () => { A[q.id] = t.value; $("#cnt").textContent = t.value.length + "/600"; $("#prox").textContent = t.value.trim() ? (ultimo ? "Enviar" : "Próxima") : "Pular"; };
  $("#volta").onclick = () => {
    if (q.t === "grade" && sub > 0) { sub--; render(); return; }
    pos--; if (pos >= 0) { const p = vis()[pos]; sub = p.t === "grade" ? p.it.length - 1 : 0; } else sub = 0;
    salvar(); render();
  };
  $("#prox").onclick = () => {
    if (q.t === "grade" && sub < q.it.length - 1) { sub++; salvar(); render(); return; }
    if (q.t === "aberta" && !(A[q.id] || "").trim()) delete A[q.id];
    pos++; sub = 0; salvar(); render();
  };
}

function telaFim(semResumo) {
  const lista = vis();
  $("#barra").style.width = "100%";
  const fmt = (q, v) => {
    if (v == null) return "<i>Sem resposta</i>";
    if (q.t === "grade") return q.it.map((it, k) => `${esc(it)} <b>${v[k]} · ${esc(q.lb[v[k]])}</b>`).join("<br>");
    if (q.t === "escala") return `<b>${v} · ${esc(q.lb[v])}</b>`;
    if (Array.isArray(v)) return esc(v.join(", "));
    return esc(v);
  };
  const rows = semResumo ? "" : lista.map((q, k) => `<dt>${k + 1}. ${esc(q.q)}</dt><dd>${fmt(q, A[q.id])}</dd>`).join("");
  $("#corpo").innerHTML = `<div class="circ"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></div>
    <span class="tag-line">Obrigado</span>
    <h1>${semResumo ? "Você já respondeu." : "Resposta enviada."}</h1>
    <p class="txt">${semResumo ? "Obrigado por participar!" : "Suas respostas foram registradas. Obrigado por participar!"}</p>
    ${rows ? `<div class="resumo"><details><summary>Ver minhas respostas</summary><dl>${rows}</dl></details></div>` : ""}`;
  $("#rodape").innerHTML = "";
}

// Firebase: autenticação, status da pesquisa e retomada do próprio doc
onAuthStateChanged(auth, (user) => {
  if (!user) { signInAnonymously(auth).catch(() => { $("#corpo").innerHTML = `<p class="txt">Não deu pra conectar. Verifica sua internet e recarrega a página.</p>`; }); return; }
  uid = user.uid;

  onSnapshot(doc(db, "config", "pesquisa"), (snap) => {
    statusPesquisa = snap.exists() ? snap.data().status : "encerrada";
    render();
  }, () => { statusPesquisa = "encerrada"; render(); });

  onSnapshot(doc(db, RESPOSTAS_COL, uid), { includeMetadataChanges: true }, (snap) => {
    pendingWrites = snap.metadata.hasPendingWrites;
    if (!docCarregado) {
      if (snap.exists()) {
        const d = snap.data();
        Q.forEach((q) => { if (d[q.id] !== undefined) A[q.id] = d[q.id]; });
        if (d.status === "concluida") { A._concluida = true; }
        else if (typeof d._pos === "number") { pos = d._pos; sub = d._sub || 0; }
      }
      docCarregado = true;
    }
    render();
  }, () => { docCarregado = true; render(); });
});
