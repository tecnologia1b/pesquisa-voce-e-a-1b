// Web App vinculado à planilha "PESQUISA - CULTO DE SÁBADO - OUTUBRO 2026".
// Implanta como Web App (executar como "Eu", acesso "Qualquer pessoa").
// Antes de publicar: Extensões > Propriedades do script > adicionar SEGREDO (gerado por você).
//
// ATENÇÃO: PERGUNTAS abaixo é uma cópia reduzida de js/perguntas.js (só id/num/texto/tipo/itens),
// porque o Apps Script roda fora do Firebase/módulos JS. Se perguntas.js mudar, atualizar aqui também.

const PERGUNTAS = [
  { id: "p1", num: 1, texto: "Qual a sua idade?", tipo: "unica" },
  { id: "p2", num: 2, texto: "Qual o seu papel hoje?", tipo: "unica" },
  { id: "p3", num: 3, texto: "De qual rede você participa?", tipo: "unica" },
  { id: "p4", num: 4, texto: "Há quanto tempo você frequenta a 1B?", tipo: "unica" },
  { id: "p5", num: 5, texto: "Qual frase descreve melhor o seu momento de vida?", tipo: "unica" },
  { id: "p6", num: 6, texto: "Que tipo de programa você sente falta na igreja?", tipo: "multipla" },
  { id: "p7", num: 7, texto: "Deseja atividades da sua faixa etária?", tipo: "escala" },
  { id: "p8", num: 8, texto: "Deseja atividades com outras idades?", tipo: "escala" },
  { id: "p9", num: 9, texto: "Programa/atividade que gostaria para sua idade", tipo: "aberta" },
  { id: "p10", num: 10, texto: "O que mais te atrai num culto?", tipo: "multipla" },
  { id: "p11", num: 11, texto: "Movimento/evento cristão que mais te atrai", tipo: "multipla" },
  { id: "p12", num: 12, texto: "Onde mais consome conteúdo cristão fora da igreja", tipo: "multipla" },
  { id: "p13", num: 13, texto: "Igrejas/ministérios/pregadores que te inspiram", tipo: "aberta" },
  { id: "p14", num: 14, texto: "Frequência que lê a Bíblia por conta própria", tipo: "unica" },
  { id: "p15", num: 15, texto: "De quais cultos da 1B costuma participar", tipo: "multipla" },
  { id: "p16", num: 16, texto: "Frequência que vem a algum culto da 1B", tipo: "unica" },
  { id: "p17", num: 17, texto: "O que mais faz voltar aos cultos", tipo: "multipla" },
  { id: "p18", num: 18, texto: "O que mais dificulta participar de outras programações", tipo: "multipla" },
  { id: "p19", num: 19, texto: "O quanto você concorda", tipo: "grade", itens: [
    "Me sinto parte da igreja como um todo.",
    "Conheço pelo nome pessoas mais velhas da igreja.",
    "Tenho alguém mais velho que me inspira na fé.",
    "Eu me sentiria à vontade em qualquer culto da 1B, de qualquer horário.",
    "Gostaria de conviver mais com pessoas de outras idades na igreja.",
  ] },
  { id: "p20", num: 20, texto: "Quantos adultos 40+ conhece pelo nome", tipo: "unica" },
  { id: "p21", num: 21, texto: "Conversou de verdade com adulto 40+ nos últimos 3 meses", tipo: "unica" },
  { id: "p22", num: 22, texto: "Tem adulto da igreja a quem procuraria por conselho", tipo: "unica" },
  { id: "p23", num: 23, texto: "O que te aproximaria das outras gerações", tipo: "multipla" },
  { id: "p24", num: 24, texto: "O que sua geração precisa aprender com os mais velhos", tipo: "aberta" },
  { id: "p25", num: 25, texto: "[Liderança] Quantos do seu PGM participam de domingo", tipo: "unica" },
  { id: "p26", num: 26, texto: "[Liderança] Do que seu grupo mais sente falta", tipo: "aberta" },
  { id: "p27", num: 27, texto: "[Liderança] Ação que aproximou gerações", tipo: "aberta" },
  { id: "p28", num: 28, texto: "[Liderança] Apoio que precisaria", tipo: "aberta" },
];

function doPost(e) {
  try {
    const segredoEsperado = PropertiesService.getScriptProperties().getProperty("SEGREDO");
    const body = JSON.parse(e.postData.contents);
    if (!segredoEsperado || body.segredo !== segredoEsperado) return resposta(401, "segredo inválido");
    const lote = body.lote || [];
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    upsertRespostas(ss, lote);
    recalcularResumo(ss);
    recalcularAbertas(ss);
    return resposta(200, "ok");
  } catch (err) {
    return resposta(500, String(err));
  }
}

function colunas() {
  const cols = ["uid", "Participante"];
  PERGUNTAS.forEach((p) => {
    if (p.tipo === "grade") p.itens.forEach((it, i) => cols.push(`${p.num}. ${it}`));
    else cols.push(`${p.num}. ${p.texto}`);
  });
  cols.push("Início", "Conclusão", "Origem", "Status");
  return cols;
}

function abaRespostas(ss) {
  let sh = ss.getSheetByName("Respostas");
  if (!sh) sh = ss.insertSheet("Respostas");
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, colunas().length).setValues([colunas()]).setFontWeight("bold");
  return sh;
}

function upsertRespostas(ss, lote) {
  const sh = abaRespostas(ss);
  const cols = colunas();
  const nLinhas = Math.max(sh.getLastRow() - 1, 0);
  const uids = nLinhas ? sh.getRange(2, 1, nLinhas, 1).getValues().flat() : [];

  lote.forEach((d) => {
    const linha = cols.map((c) => "");
    linha[0] = d.uid || "";
    let idxUid = uids.indexOf(d.uid);
    if (idxUid === -1) {
      linha[1] = "P" + String(uids.length + 1).padStart(3, "0");
    } else {
      linha[1] = sh.getRange(idxUid + 2, 2).getValue();
    }
    let col = 2;
    PERGUNTAS.forEach((p) => {
      const v = d[p.id];
      if (p.tipo === "grade") {
        const arr = Array.isArray(v) ? v : [];
        p.itens.forEach((_, i) => { linha[col] = arr[i] != null ? arr[i] : ""; col++; });
      } else if (p.tipo === "multipla") {
        linha[col] = Array.isArray(v) ? v.join("; ") : "";
        col++;
      } else {
        linha[col] = v != null ? v : "";
        col++;
      }
    });
    linha[col++] = d.iniciadoEm || "";
    linha[col++] = d.concluidoEm || "";
    linha[col++] = d.origem || "";
    linha[col++] = d.status || "";

    if (idxUid === -1) {
      sh.appendRow(linha);
      uids.push(d.uid);
    } else {
      sh.getRange(idxUid + 2, 1, 1, linha.length).setValues([linha]);
    }
  });
}

function letraColuna(n) {
  let s = "";
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function recalcularResumo(ss) {
  let sh = ss.getSheetByName("Resumo");
  if (!sh) sh = ss.insertSheet("Resumo"); else sh.clear();
  const nLinhas = Math.max(abaRespostas(ss).getLastRow() - 1, 0);
  const linhas = [["Pergunta", "Opção / Afirmação", "Contagem", "%", "Média"]];
  let col = 3; // coluna C em diante = primeira pergunta (A=uid, B=Participante)
  PERGUNTAS.forEach((p) => {
    if (p.tipo === "unica" || p.tipo === "multipla") {
      const letra = letraColuna(col);
      linhas.push([`${p.num}. ${p.texto}`, "(ver aba Respostas para as opções)", `=COUNTA(Respostas!${letra}2:${letra})`, "", ""]);
      col++;
    } else if (p.tipo === "escala") {
      const letra = letraColuna(col);
      linhas.push([`${p.num}. ${p.texto}`, "média", "", "", `=IFERROR(AVERAGE(Respostas!${letra}2:${letra}),"")`]);
      col++;
    } else if (p.tipo === "grade") {
      p.itens.forEach((it) => {
        const letra = letraColuna(col);
        linhas.push([`${p.num}. ${p.texto}`, it, "", "", `=IFERROR(AVERAGE(Respostas!${letra}2:${letra}),"")`]);
        col++;
      });
    } else {
      col++; // aberta não entra no resumo numérico
    }
  });
  sh.getRange(1, 1, linhas.length, 5).setValues(linhas);
  sh.getRange(1, 1, 1, 5).setFontWeight("bold");
}

function recalcularAbertas(ss) {
  let sh = ss.getSheetByName("Abertas");
  if (!sh) sh = ss.insertSheet("Abertas"); else sh.clear();
  const linhas = [["Pergunta", "Participante", "Resposta"]];
  const respSh = abaRespostas(ss);
  const nLinhas = Math.max(respSh.getLastRow() - 1, 0);
  if (nLinhas > 0) {
    const cols = colunas();
    const dados = respSh.getRange(2, 1, nLinhas, cols.length).getValues();
    let colIdx = 2; // índice 0-based das colunas de pergunta (depois de uid/Participante)
    PERGUNTAS.forEach((p) => {
      if (p.tipo === "aberta") {
        dados.forEach((linha) => {
          const resp = linha[colIdx];
          if (resp) linhas.push([`${p.num}. ${p.texto}`, linha[1], resp]);
        });
      }
      colIdx += p.tipo === "grade" ? p.itens.length : 1;
    });
  }
  sh.getRange(1, 1, linhas.length, 3).setValues(linhas);
  sh.getRange(1, 1, 1, 3).setFontWeight("bold");
}

function resposta(codigo, msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: codigo === 200, msg })).setMimeType(ContentService.MimeType.JSON);
}
