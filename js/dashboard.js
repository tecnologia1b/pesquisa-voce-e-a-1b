import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { Q, CONCORDO, DESEJO, LIDER } from "./perguntas.js";
import { sincronizarTudo, getSegredo, setSegredo } from "./sheets.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const sessao = new URLSearchParams(location.search).get("sessao") === "teste" ? "teste" : "oficial";
const RESPOSTAS_COL = sessao === "teste" ? "respostas_teste" : "respostas";

let respostas = [];
let filtros = { faixa: "", papel: "", soLideranca: false, rede: "", origem: "", culto: "", soSabado: false };
let charts = {};
let syncTimer = null;

// ---------- Login ----------
$("#login-btn").onclick = async () => {
  $("#login-erro").textContent = "";
  try {
    await signInWithEmailAndPassword(auth, $("#login-email").value.trim(), $("#login-senha").value);
  } catch (e) {
    $("#login-erro").textContent = "E-mail ou senha incorretos.";
  }
};
$("#btn-sair").onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
  if (!user) { $("#login").style.display = "block"; $("#painel").style.display = "none"; return; }
  const opSnap = await getDoc(doc(db, "operadores", user.uid));
  if (!opSnap.exists()) {
    $("#login-erro").textContent = "Essa conta não tem permissão de operador.";
    await signOut(auth);
    return;
  }
  $("#login").style.display = "none";
  $("#painel").style.display = "block";
  iniciarPainel();
});

// ---------- Painel ----------
let iniciado = false;
function iniciarPainel() {
  if (iniciado) return;
  iniciado = true;
  $("#selo-sessao").textContent = sessao === "teste" ? "SESSÃO DE TESTE" : "SESSÃO OFICIAL";
  if (sessao === "teste") $("#selo-sessao").classList.add("teste");

  montarFiltros();
  montarPerguntas();

  onSnapshot(doc(db, "config", "pesquisa"), (snap) => {
    const status = snap.exists() ? snap.data().status : "encerrada";
    $("#status-pesquisa").textContent = status === "aberta" ? "ABERTA" : "ENCERRADA";
    $("#status-pesquisa").style.color = status === "aberta" ? "var(--verde-claro)" : "#e07a5f";
  });

  onSnapshot(collection(db, RESPOSTAS_COL), (snap) => {
    respostas = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    recalcular();
    if (sessao !== "teste") agendarSync();
  });

  $("#btn-abrir").onclick = () => setDoc(doc(db, "config", "pesquisa"), { status: "aberta" }, { merge: true });
  let armado = false, armTimer = null;
  $("#btn-encerrar").onclick = () => {
    if (!armado) {
      armado = true;
      $("#btn-encerrar").textContent = "Confirmar encerramento?";
      armTimer = setTimeout(() => { armado = false; $("#btn-encerrar").textContent = "Encerrar"; }, 4000);
      return;
    }
    clearTimeout(armTimer); armado = false; $("#btn-encerrar").textContent = "Encerrar";
    setDoc(doc(db, "config", "pesquisa"), { status: "encerrada" }, { merge: true });
  };

  $("#btn-salvar-segredo").onclick = () => { setSegredo($("#sheets-segredo").value.trim()); $("#sheets-segredo").value = ""; $("#sheets-status").textContent = "segredo salvo — sincronizando…"; sincronizarAgora(); };
  $("#btn-ressync").onclick = () => sincronizarAgora();
  if (getSegredo()) $("#sheets-segredo").placeholder = "Segredo do Sheets (já salvo)";

  $("#btn-baixar-qr").onclick = baixarQR;
  $("#btn-excel").onclick = baixarExcel;
  $("#btn-json").onclick = baixarJSON;
}

function agendarSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(sincronizarAgora, 5000);
}
async function sincronizarAgora() {
  const el = $("#sheets-status");
  el.textContent = "sincronizando…";
  const r = await sincronizarTudo(respostas);
  if (r.ok) el.textContent = "sincronizado ✓";
  else if (r.motivo === "nao-configurado") el.textContent = "Sheets não configurado";
  else el.textContent = `${r.total} pendentes`;
}

// ---------- Filtros ----------
function montarFiltros() {
  const pFaixa = Q.find((q) => q.id === "p1"), pPapel = Q.find((q) => q.id === "p2"), pRede = Q.find((q) => q.id === "p3"), pCulto = Q.find((q) => q.id === "p15");
  const html = `
    <select id="f-faixa"><option value="">Faixa etária: todas</option>${pFaixa.o.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select>
    <select id="f-papel"><option value="">Papel: todos</option>${pPapel.o.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select>
    <button id="f-lideranca">Só liderança</button>
    <select id="f-rede"><option value="">Rede: todas</option>${pRede.o.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select>
    <select id="f-origem"><option value="">Origem: todas</option><option value="culto">Culto</option><option value="online">Online</option></select>
    <select id="f-culto"><option value="">Culto: todos</option>${pCulto.o.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select>
    <button id="f-sabado">Só sábado</button>`;
  $("#filtros").innerHTML = html;
  $("#f-faixa").onchange = (e) => { filtros.faixa = e.target.value; recalcular(); };
  $("#f-papel").onchange = (e) => { filtros.papel = e.target.value; recalcular(); };
  $("#f-rede").onchange = (e) => { filtros.rede = e.target.value; recalcular(); };
  $("#f-origem").onchange = (e) => { filtros.origem = e.target.value; recalcular(); };
  $("#f-culto").onchange = (e) => { filtros.culto = e.target.value; recalcular(); };
  $("#f-lideranca").onclick = () => { filtros.soLideranca = !filtros.soLideranca; $("#f-lideranca").classList.toggle("ativo", filtros.soLideranca); recalcular(); };
  $("#f-sabado").onclick = () => { filtros.soSabado = !filtros.soSabado; $("#f-sabado").classList.toggle("ativo", filtros.soSabado); recalcular(); };
}

function aplicaFiltros(lista) {
  return lista.filter((d) => {
    if (filtros.faixa && d.p1 !== filtros.faixa) return false;
    if (filtros.soLideranca) { if (!LIDER.includes(d.p2)) return false; }
    else if (filtros.papel && d.p2 !== filtros.papel) return false;
    if (filtros.rede && d.p3 !== filtros.rede) return false;
    if (filtros.origem && d.origem !== filtros.origem) return false;
    if (filtros.soSabado) { if (!(Array.isArray(d.p15) && d.p15.length === 1 && d.p15[0] === "Sábado 19h")) return false; }
    else if (filtros.culto) { if (!(Array.isArray(d.p15) && d.p15.includes(filtros.culto))) return false; }
    return true;
  });
}

// ---------- Perguntas (cards + charts) ----------
function montarPerguntas() {
  const wrap = $("#perguntas");
  let html = "";
  Q.forEach((q) => {
    if (q.t === "aberta") {
      html += `<div class="card"><h3>${q.num || ""} ${esc(q.q)}</h3>
        <input id="busca_${q.id}" placeholder="Buscar palavra…">
        <div class="contador" id="cnt_${q.id}">0 respostas</div>
        <div class="abertas-lista" id="lista_${q.id}"></div></div>`;
    } else if (q.t === "grade") {
      q.it.forEach((it, i) => {
        html += `<div class="card"><h3>${esc(q.q)} — ${esc(it)}</h3><div class="media-grande" id="media_${q.id}_${i}">—</div><canvas id="chart_${q.id}_${i}"></canvas></div>`;
      });
    } else {
      html += `<div class="card"><h3>${esc(q.q)}</h3>${q.t === "escala" ? `<div class="media-grande" id="media_${q.id}">—</div>` : ""}<canvas id="chart_${q.id}"></canvas></div>`;
    }
  });
  wrap.innerHTML = html;

  Chart.defaults.color = "#c9cfcc";
  Chart.defaults.borderColor = "rgba(255,255,255,.08)";
  Chart.defaults.font.family = "Inter";

  Q.forEach((q) => {
    if (q.t === "aberta") { $(`#busca_${q.id}`).oninput = () => recalcular(); return; }
    if (q.t === "grade") { q.it.forEach((_, i) => criarChart(`chart_${q.id}_${i}`)); return; }
    criarChart(`chart_${q.id}`);
  });
}

function criarChart(id) {
  const ctx = $(`#${id}`);
  if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [{ data: [], backgroundColor: "#5E9C82", borderRadius: 4 }] },
    options: {
      indexAxis: "y",
      animation: { duration: 300 },
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

function distribuicaoUnicaMultipla(lista, q) {
  const c = {}; q.o.forEach((o) => (c[o] = 0));
  let n = 0;
  lista.forEach((d) => {
    const v = d[q.id];
    if (q.t === "unica") { if (v != null) { c[v] = (c[v] || 0) + 1; n++; } }
    else { if (Array.isArray(v) && v.length) { n++; v.forEach((o) => { if (c[o] != null) c[o]++; }); } }
  });
  return { labels: q.o, valores: q.o.map((o) => c[o]), n };
}
function distribuicaoEscala(lista, campo) {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; let soma = 0, n = 0;
  lista.forEach((d) => { const v = d[campo]; if (v != null) { c[v]++; soma += v; n++; } });
  return { c, media: n ? soma / n : 0, n };
}

function recalcular() {
  const concluidas = respostas.filter((d) => d.status === "concluida");
  const andamento = respostas.filter((d) => d.status !== "concluida");
  $("#st-concluidas").textContent = concluidas.length;
  $("#st-andamento").textContent = andamento.length;
  $("#st-culto").textContent = respostas.filter((d) => d.origem === "culto").length;
  $("#st-online").textContent = respostas.filter((d) => d.origem === "online").length;

  const base = aplicaFiltros(concluidas);

  Q.forEach((q) => {
    if (q.t === "unica" || q.t === "multipla") {
      const { labels, valores } = distribuicaoUnicaMultipla(base, q);
      const ch = charts[`chart_${q.id}`];
      if (ch) { ch.data.labels = labels; ch.data.datasets[0].data = valores; ch.update(); }
    } else if (q.t === "escala") {
      const { c, media } = distribuicaoEscala(base, q.id);
      const ch = charts[`chart_${q.id}`];
      if (ch) { ch.data.labels = [1, 2, 3, 4, 5].map((k) => `${k} · ${q.lb[k]}`); ch.data.datasets[0].data = [1, 2, 3, 4, 5].map((k) => c[k]); ch.update(); }
      const m = $(`#media_${q.id}`); if (m) m.textContent = media ? media.toFixed(1) : "—";
    } else if (q.t === "grade") {
      q.it.forEach((_, i) => {
        const vals = base.map((d) => (Array.isArray(d[q.id]) ? d[q.id][i] : null)).filter((v) => v != null);
        const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; let soma = 0;
        vals.forEach((v) => { c[v]++; soma += v; });
        const ch = charts[`chart_${q.id}_${i}`];
        if (ch) { ch.data.labels = [1, 2, 3, 4, 5].map((k) => `${k} · ${q.lb[k]}`); ch.data.datasets[0].data = [1, 2, 3, 4, 5].map((k) => c[k]); ch.update(); }
        const m = $(`#media_${q.id}_${i}`); if (m) m.textContent = vals.length ? (soma / vals.length).toFixed(1) : "—";
      });
    } else if (q.t === "aberta") {
      const buscaEl = $(`#busca_${q.id}`);
      const busca = (buscaEl?.value || "").toLowerCase();
      const resps = base.map((d) => d[q.id]).filter((v) => v && v.trim()).filter((v) => !busca || v.toLowerCase().includes(busca)).reverse();
      $(`#cnt_${q.id}`).textContent = `${resps.length} respostas`;
      $(`#lista_${q.id}`).innerHTML = resps.map((r) => `<div class="resp">${esc(r)}</div>`).join("");
    }
  });

  montarCruzamentos(base);
}

// ---------- Cruzamentos ----------
function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
function montarCruzamentos(base) {
  const n = base.length;

  const c1 = base.filter((d) => Array.isArray(d.p19) && d.p19[0] >= 4 && (d.p20 === "Nenhum" || d.p20 === "1 ou 2") && d.p21 === "Nenhuma vez").length;
  const c2 = base.filter((d) => Array.isArray(d.p19) && d.p19[3] >= 4 && Array.isArray(d.p15) && d.p15.length === 1 && d.p15[0] === "Sábado 19h").length;

  const faixas = Q.find((q) => q.id === "p1").o;
  const c3 = faixas.map((f) => {
    const grupo = base.filter((d) => d.p1 === f);
    const sab = grupo.filter((d) => Array.isArray(d.p15) && d.p15.length === 1 && d.p15[0] === "Sábado 19h");
    return `${f}: ${pct(sab.length, grupo.length)}% (${grupo.length})`;
  }).join("<br>");

  const c4 = faixas.map((f) => {
    const grupo = base.filter((d) => d.p1 === f);
    const p7 = grupo.map((d) => d.p7).filter((v) => v != null);
    const p8 = grupo.map((d) => d.p8).filter((v) => v != null);
    const m = (arr) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "—");
    return `${f}: idade ${m(p7)} · outras ${m(p8)}`;
  }).join("<br>");

  $("#cruzamentos").innerHTML = `
    <div class="card"><h3>Percepção × prática</h3><div class="stat-num">${pct(c1, n)}%</div><div class="stat-lbl">${c1} de ${n} concluídas (filtro atual)</div></div>
    <div class="card"><h3>À vontade × frequência</h3><div class="stat-num">${pct(c2, n)}%</div><div class="stat-lbl">${c2} de ${n} concluídas (filtro atual)</div></div>
    <div class="card"><h3>Só sábado, por faixa etária</h3><div style="font-size:.86rem;line-height:1.7">${c3}</div></div>
    <div class="card"><h3>Faixa etária × outras idades (médias)</h3><div style="font-size:.86rem;line-height:1.7">${c4}</div></div>`;
}

// ---------- QR / Excel / JSON ----------
function baixarQR() {
  const el = $("#qr-oculto");
  el.innerHTML = "";
  const url = `https://pesquisa.1b.org.br/?origem=culto`;
  new QRCode(el, { text: url, width: 1024, height: 1024, correctLevel: QRCode.CorrectLevel.M });
  setTimeout(() => {
    const canvas = el.querySelector("canvas");
    const a = document.createElement("a");
    a.download = "qr-pesquisa-voce-e-a-1b.png";
    a.href = canvas ? canvas.toDataURL("image/png") : el.querySelector("img").src;
    a.click();
  }, 150);
}

function baixarExcel() {
  const wsRespostas = XLSX.utils.json_to_sheet(respostas.map((d) => {
    const linha = { uid: d.uid, Participante: d.uid.slice(0, 6) };
    Q.forEach((q) => { linha[`${q.num || ""} ${q.q}`.trim()] = Array.isArray(d[q.id]) ? d[q.id].join("; ") : d[q.id] ?? ""; });
    linha.Origem = d.origem || ""; linha.Status = d.status || "";
    return linha;
  }));
  const resumoLinhas = [];
  Q.forEach((q) => {
    if (q.t === "unica" || q.t === "multipla") {
      const { labels, valores, n } = distribuicaoUnicaMultipla(respostas.filter((d) => d.status === "concluida"), q);
      labels.forEach((l, i) => resumoLinhas.push({ Pergunta: q.q, Opção: l, Contagem: valores[i], "%": pct(valores[i], n) }));
    } else if (q.t === "escala") {
      const { media, n } = distribuicaoEscala(respostas.filter((d) => d.status === "concluida"), q.id);
      resumoLinhas.push({ Pergunta: q.q, Opção: "média", Contagem: n, "%": "" , Média: media.toFixed(2)});
    }
  });
  const wsResumo = XLSX.utils.json_to_sheet(resumoLinhas);
  const abertasLinhas = [];
  Q.filter((q) => q.t === "aberta").forEach((q) => {
    respostas.forEach((d) => { if (d[q.id] && d[q.id].trim()) abertasLinhas.push({ Pergunta: q.q, Participante: d.uid.slice(0, 6), Resposta: d[q.id] }); });
  });
  const wsAbertas = XLSX.utils.json_to_sheet(abertasLinhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsRespostas, "Respostas");
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");
  XLSX.utils.book_append_sheet(wb, wsAbertas, "Abertas");
  XLSX.writeFile(wb, "voce-e-a-1b.xlsx");
}

function baixarJSON() {
  const blob = new Blob([JSON.stringify(respostas, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.download = "voce-e-a-1b-backup.json";
  a.href = URL.createObjectURL(blob);
  a.click();
}
