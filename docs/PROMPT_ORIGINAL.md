# Pesquisa "Você e a 1B" — versão de produção

Crie, num repositório novo e vazio, o app de produção da pesquisa **"Você e a 1B"** da Primeira Igreja Batista de Campo Grande (1B). O público é a galera do culto de sábado (adolescentes, jovens e a liderança deles). A pesquisa vai ser aplicada **ao vivo no culto de sábado, com 300 pessoas ou mais respondendo ao mesmo tempo**, e depois fica aberta online por alguns dias.

O app precisa:
1. aguentar mais de 300 pessoas simultâneas sem travar;
2. salvar cada resposta com segurança;
3. mostrar os resultados num **dashboard com gráficos**, ao vivo;
4. espelhar as respostas numa **planilha Google Sheets**;
5. rodar num **subdomínio da igreja**: `pesquisa.1b.org.br`.

## Anexo (coloque em `docs/`)

- `docs/prototipo-voce-e-a-1b.html`: **simulação aprovada pelo Pastor Presidente e por mim.** É a fonte única das perguntas e do visual do celular.
  - Extraia o array `Q` e as constantes `CONCORDO`, `DESEJO` e `LIDER` para `js/perguntas.js` **sem mudar uma vírgula** nos textos, opções, limites (`max`), exclusivas (`ex`) e condicionais (`se`).
  - O celular final deve ser idêntico à simulação: mesmo CSS, mesma navegação, mesma escala com número e nome lado a lado. O que muda: dados salvos no Firebase, logo real, remover o selo "Simulação" e o aviso de simulação, e a tela final sem "Responder de novo".

Se a skill **frontend-design** (ou **design-taste-frontend**) estiver disponível, use-a no dashboard.

---

## COMO TRABALHAR COMIGO

- Não sou programador. Executo no terminal e nos consoles o que você mandar, **um passo por vez**, dizendo onde clicar e o que devo ver na tela. Espere minha confirmação entre os passos.
- **Antes de codar:** me devolva um resumo do plano (arquivos, estrutura do banco, regras, custo, passos de configuração). PARE e espere meu "pode seguir".
- **Protótipo antes do final:** mostre o dashboard primeiro com dados simulados para eu aprovar o visual. Só depois ligue nos dados reais.
- **Nunca** me peça senha, token ou segredo no chat. A config web do Firebase é pública por natureza e pode ir no código. Segredos ficam fora do repositório.
- Trabalhe por versões: entregue, eu testo, aprovo, e só então seguimos.

---

## DECISÃO CRÍTICA: CAPACIDADE (resolva antes de tudo)

O **Realtime Database no plano gratuito (Spark) aceita só 100 conexões simultâneas**. Com 300 celulares abertos ao mesmo tempo, a partir do 101º a pesquisa trava. Isso não pode acontecer no culto.

Caminho definido:
- **Firebase no plano Blaze** (pago por uso), com **alerta de orçamento de R$ 10/mês**. Na escala desta pesquisa o custo real deve ficar em zero ou centavos, porque a cota gratuita continua valendo dentro do Blaze. O Blaze exige cartão cadastrado.
- Antes de eu ativar, me mostre a estimativa de uso (conexões, leituras, escritas, download) para 500 pessoas e confirme que fica dentro da cota gratuita.
- Se eu decidir não usar cartão, a alternativa é **Firestore no plano Spark** (sem limite de conexões, mas com cota diária de 20 mil escritas e 50 mil leituras). Nesse caso, me mostre a conta de escritas/leituras por participante e garanta folga para 500 pessoas, incluindo os testes do mesmo dia.

Regras de eficiência (valem para qualquer um dos dois):
- O celular **não escuta** respostas de ninguém. Só lê o status da pesquisa (aberta/encerrada) e grava as próprias respostas.
- Cada participante grava **um único registro** (`respostas/{uid}`), atualizado a cada avanço, em vez de um registro por pergunta.
- O SDK do Firebase carrega só os módulos necessários (via CDN gstatic, modular).

---

## STACK

- **HTML + CSS + JavaScript puro**, sem build, sem framework, sem npm.
- **Hospedagem:** GitHub Pages, branch `main`, com domínio próprio `pesquisa.1b.org.br` (arquivo `CNAME` no repo + HTTPS forçado).
- **Firebase:** banco (decidido acima) + Authentication (Anônimo para participantes, E-mail/senha para o operador).
- **Gráficos:** Chart.js via CDN (cdnjs, versão fixa).
- **QR code:** biblioteca leve via CDN.
- **Google Apps Script** vinculado à planilha, como Web App, para o espelho no Sheets.

```
index.html              ← celular (página principal do QR)
dashboard.html          ← dashboard do operador (com login)
qr.html                 ← tela do telão: QR gigante + contador
css/estilo.css
js/config.js            ← config do Firebase + URL do Web App (eu preencho, você me guia)
js/perguntas.js         ← extraído da simulação, não alterar textos
js/responder.js
js/dashboard.js
js/sheets.js            ← sincronização com o Sheets (roda no dashboard)
apps-script/Code.gs     ← script que eu colo na planilha
database.rules.json     ← ou firestore.rules, conforme o banco
img/logo-1b-branca.png
CNAME
docs/prototipo-voce-e-a-1b.html
README.md
```

Logo branca: `https://1b.org.br/wp-content/uploads/2026/07/logo-1b-branca.png`. O site bloqueia download automático; se você não conseguir baixar, me peça e eu coloco o arquivo no repo.

---

## LINKS

| Link | Para quê |
|---|---|
| `pesquisa.1b.org.br/?origem=culto` | Vai no QR do telão no sábado |
| `pesquisa.1b.org.br/` | Link para divulgar online depois do culto |
| `pesquisa.1b.org.br/qr.html` | Abro no notebook do telão |
| `pesquisa.1b.org.br/dashboard.html` | Dashboard (só operador logado) |

O parâmetro `origem` é gravado junto com as respostas (`culto` ou `online`), para eu comparar depois quem respondeu no culto e quem respondeu em casa.

---

## CELULAR (`index.html`)

Igual à simulação, mais:
- **Uma resposta por aparelho.** Firebase Auth Anônimo: o uid fica no navegador. Ao abrir de novo, a pessoa retoma de onde parou. Depois de **Enviar**, a resposta é marcada como concluída, as regras do banco **bloqueiam qualquer nova escrita** daquele uid, e o celular mostra "Você já respondeu. Obrigado!" se abrir o link de novo. Guarde também uma marca em `localStorage` como segunda trava.
- Salva a cada avanço, com indicador discreto "salvo ✓". Com internet ruim, usa a fila offline do Firebase e mostra "enviando…" até confirmar. O botão Enviar só conclui quando o servidor confirmar.
- **Pesquisa encerrada:** tela limpa "A pesquisa está encerrada. Obrigado!", que atualiza sozinha se reabrir.
- **Resultados nunca aparecem no celular.**
- **Nenhum dado pessoal:** sem nome, telefone, e-mail ou PGM específico. Há adolescentes de 12 a 17 anos respondendo.
- Perguntas condicionais (`se`): se a pessoa voltar e mudar a resposta-mãe, apague as respostas que deixaram de valer, como a simulação já faz.

## TELÃO (`qr.html`)

- Fundo carvão, logo branca, legível a 20 metros, sem cursor.
- QR gigante apontando para `pesquisa.1b.org.br/?origem=culto`, o endereço escrito embaixo em letra grande, e o contador **"X pessoas já responderam"** ao vivo.
- **Sem resultados no telão.** É pesquisa com adolescentes; resultado só no dashboard.
- Precisa de login do operador (para ler o contador sem abrir o banco ao público). O navegador lembra o login.

## DASHBOARD (`dashboard.html`)

Protegido por login do operador (eu crio o usuário no console, você me guia). Tema carvão, denso, legível em notebook e no celular.

**Topo, sempre visível:**
- Total de respostas concluídas, em andamento (começaram e não enviaram), e quantas foram no culto x online.
- Status da pesquisa com botões grandes **Abrir** / **Encerrar** (encerrar pede confirmação na própria tela, sem `confirm()`).
- Status do Sheets: "sincronizado ✓" ou "X pendentes", e botão "Ressincronizar tudo".
- Botão **Baixar QR** em PNG de alta resolução, para imprimir.

**Filtros (o ponto mais importante):** todos os gráficos recalculam ao filtrar por:
- Faixa etária (P1)
- Papel (P2), com atalho **"Só liderança"** (líder/auxiliar, supervisor, coordenador)
- Rede (P3)
- Origem (culto / online)
- Cultos que frequenta (P15), com atalho **"Só sábado"** (marcou apenas Sábado 19h)

**Gráficos por tipo:**
| Tipo | Gráfico |
|---|---|
| `unica` | Barras horizontais com % e número absoluto, maior em destaque |
| `multipla` | Barras horizontais, % sobre quem respondeu (legenda avisando que a soma passa de 100%) |
| `escala` | Média grande + barra de distribuição 1 a 5 com os nomes de cada nota |
| `grade` | Uma linha por afirmação: média + distribuição 1 a 5 |
| `aberta` | Lista rolável de respostas, mais recentes no topo, com contador e busca por palavra |

**Painel de cruzamentos** (cards fixos no topo dos gráficos, respeitando os filtros):
1. **Percepção x prática:** % dos que deram 4 ou 5 em "Me sinto parte da igreja como um todo" **e** conhecem 0 a 2 adultos pelo nome (P20) **e** não conversaram com nenhum nos últimos 3 meses (P21).
2. **À vontade x frequência:** % dos que deram 4 ou 5 em "Eu me sentiria à vontade em qualquer culto da 1B" **e** marcaram só "Sábado 19h" na P15.
3. **Só sábado:** % que marcou apenas "Sábado 19h" na P15, por faixa etária.
4. **Faixa etária x outras idades:** média da P7 (atividades da minha idade) ao lado da média da P8 (atividades com outras idades), por faixa etária.

Atualiza ao vivo, com animação sóbria. Recalcula no navegador a partir dos registros, sem custo extra de leitura por filtro.

**Exportar:** botão "Baixar Excel" (SheetJS via CDN) com abas Respostas, Resumo e Abertas, e "Baixar JSON" (backup completo). Como o download dentro de alguns navegadores embutidos pode falhar, deixe a planilha do Sheets como caminho principal.

---

## PLANILHA GOOGLE SHEETS (espelho)

- **Crie uma planilha nova** chamada "PESQUISA VOCÊ E A 1B – 2026". Me guie para criar no Drive da igreja e me passe só o que eu preciso colar.
- Fonte oficial: o Firebase. O Sheets é espelho de acompanhamento.
- Quem envia é o **dashboard** (operador logado), nunca o celular. Assim não existe chave exposta no celular.
- Apps Script vinculado à planilha, publicado como Web App (`doPost`), protegido por segredo compartilhado guardado em `PropertiesService` (nunca no código do repo). No dashboard, o segredo é pedido uma vez e fica guardado no navegador do operador.
- O script monta a estrutura sozinho na primeira sincronização:
  - **Respostas:** 1 linha por participante (P001…), 1 coluna por pergunta (cabeçalho = número + texto). `multipla` com "; ". `grade`: uma coluna por afirmação. Colunas de início, conclusão, origem e status (concluída/em andamento).
  - **Resumo:** contagem e % por opção e médias das escalas, com fórmulas que se atualizam sozinhas.
  - **Abertas:** todas as respostas abertas (pergunta, participante, resposta).
- Sincroniza em lote (debounce ~5s), com fila e reenvio se a internet cair. "Ressincronizar tudo" reescreve as abas a partir do Firebase.
- Com 300 pessoas ao mesmo tempo, respeite os limites do Apps Script: envie em lotes de até 100 linhas por chamada e nunca uma chamada por resposta.
- O espelho só roda com o dashboard aberto. Se ficar fechado, ao reabrir ele completa o que faltou. Deixe isso escrito no README.

---

## SESSÕES: TESTE x OFICIAL

- `?sessao=teste` em qualquer link grava em outro lugar e **não vai para a planilha**. Sem o parâmetro, é a sessão oficial.
- O dashboard mostra claramente qual sessão está aberta (selo "TESTE" em destaque).
- Nada é apagado pelo app. Apagar a sessão de teste é feito por mim no console; documente o passo a passo no README.

---

## REGRAS DE SEGURANÇA

- Participante (anônimo) só escreve no **próprio** registro, só com a pesquisa **aberta**, e **só enquanto não concluiu**.
- Participante não lê nada de ninguém. Só lê o status.
- Operador (uid cadastrado à mão em `operadores/{uid}`) lê tudo e muda o status.
- Validar nas regras: tamanho máximo dos textos (600 caracteres), tipos e campos permitidos.

---

## DOMÍNIO `pesquisa.1b.org.br`

Me guie passo a passo, um por vez:
1. Configurar o domínio no GitHub Pages (arquivo `CNAME` + Settings → Pages).
2. Me dizer **exatamente** qual registro DNS criar (tipo, nome, valor). O DNS do 1b.org.br pode ser gerido por outra pessoa da equipe; escreva a instrução de um jeito que eu possa repassar.
3. Verificar a propagação e ligar o "Enforce HTTPS".
4. Adicionar `pesquisa.1b.org.br` aos domínios autorizados do Firebase Auth.

Enquanto o DNS não propaga, tudo deve funcionar no endereço `*.github.io`.

---

## IDENTIDADE VISUAL 1B — seguir à risca

- **Fonte única:** Inter (300 a 900). Títulos 800 com letter-spacing negativo. Rótulos em caixa alta, 700, letter-spacing 3px.
- **Cores:** carvão `#232323`, carvão 2 `#1a1a1a`, verde-sálvia `#5E9C82`, verde escuro `#4d826b`, verde claro `#7bb59d` (sobre carvão), off-white `#F2F2F2`, branco, cinza texto `#5a5a5a`, cinza suave `#8a8a8a`.
- **Proibido:** gradientes chamativos, laranja, azul-marinho, serifa.
- **Assinatura:** tag-line com traço de 32×1.5px antes dos títulos de seção. Botões pill em caixa alta.
- **Celular:** claro com cabeçalho carvão (como a simulação). **Telão e dashboard:** carvão.

---

## TESTES OBRIGATÓRIOS ANTES DE ME ENTREGAR

1. **Carga:** script de teste (`tools/carga.html` ou Node) que simula **500 participantes** respondendo em paralelo na sessão `teste`, com aberturas e envios espalhados em 3 minutos. Confirme: nenhum erro, todas as respostas gravadas, dashboard e contador acompanhando. Me mostre o consumo medido no console do Firebase.
2. Fluxo completo no celular com todos os tipos, incluindo condicionais da liderança (P25 a P28), `max`, exclusivas e escala com nomes.
3. Recarregar no meio: retoma, sem duplicar.
4. Depois de enviar: reabrir o link mostra "Você já respondeu"; tentar escrever pelo console do navegador é **bloqueado pelas regras**.
5. Encerrar com alguém no meio: tela de encerrado, nada perdido.
6. Participante não consegue ler respostas de outros (testar a regra).
7. Planilha bate 100% com o Excel exportado do dashboard.
8. Filtros e cruzamentos conferidos à mão em uma amostra pequena.
9. Celular de 360px: nenhuma pergunta precisa de rolagem lateral.

## README (curto)

- Os 4 links oficiais e os de teste.
- Roteiro do sábado: abrir `qr.html` no telão → **Abrir** no dashboard → 10 minutos de resposta → manter aberta para o online → **Encerrar** na data combinada.
- Como baixar o Excel pela planilha.
- Como apagar a sessão de teste.
- Checklist da véspera: teste no Wi-Fi do templo com 3 a 5 celulares, login do dashboard e do telão feitos, segredo do Sheets salvo, QR impresso de reserva, sessão de teste limpa.
