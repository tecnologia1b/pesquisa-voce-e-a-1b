# Pesquisa "Você e a 1B"

## Links

| Link | Para quê |
|---|---|
| `pesquisa.1b.org.br/?origem=culto` | QR do telão no sábado |
| `pesquisa.1b.org.br/` | Divulgar online depois do culto |
| `pesquisa.1b.org.br/qr.html` | Notebook do telão (login do operador) |
| `pesquisa.1b.org.br/dashboard.html` | Dashboard do operador (login) |
| qualquer link + `?sessao=teste` | Grava em `respostas_teste`, nunca vai pro Sheets, nunca mexe no contador do telão |

## Roteiro do sábado

1. Abrir `qr.html` no notebook do telão, logado.
2. No `dashboard.html`: **Abrir**.
3. ~10 minutos de resposta no culto.
4. Manter aberta pro período online (dias seguintes).
5. **Encerrar** no dashboard na data combinada.

## Baixar o Excel

Dashboard → card "Exportar" → **Baixar Excel** (3 abas: Respostas, Resumo, Abertas) ou **Baixar JSON** (backup completo). A planilha do Google Sheets é o espelho ao vivo — mais confiável que o Excel em navegadores embutidos (Instagram, WhatsApp).

## Sheets — como funciona

- O **dashboard** sincroniza (nunca o celular — sem chave exposta no participante).
- Sincroniza em lote, ~5s depois de qualquer mudança, só quando `dashboard.html` está aberto (sem `?sessao=teste`).
- Se o dashboard ficar fechado, ao reabrir ele reenvia tudo de novo (upsert por `uid`, idempotente — não duplica linha).
- Primeira vez: cola o **Segredo do Sheets** (o mesmo que está em `PropertiesService` do Apps Script) no campo do dashboard — fica salvo só nesse navegador.

## Apagar a sessão de teste (manual, no console)

1. Firestore → coleção `respostas_teste` → apagar os documentos (ou a coleção inteira).
2. Conferir que `contador/total` não foi alterado por teste (sessão de teste nunca mexe nele — só confirmar).
3. Nada no Sheets precisa ser apagado (teste nunca chega lá).

## Checklist da véspera

- [ ] Teste no Wi-Fi do templo com 3-5 celulares reais (link com `?sessao=teste`)
- [ ] Login do dashboard testado
- [ ] Login do `qr.html` testado
- [ ] Segredo do Sheets salvo no navegador do operador
- [ ] QR impresso de reserva (`dashboard.html` → Baixar QR)
- [ ] Sessão de teste limpa (ver acima)
- [ ] `config/pesquisa.status` = `encerrada` antes de sair (só o operador abre na hora certa)

## Decisões técnicas (resumo)

- **Firestore no plano Spark** (grátis, sem cartão) — não Realtime Database+Blaze. Participante só faz leitura/escrita pontual (sem `onSnapshot` na lista de respostas), então o limite de conexões simultâneas do Realtime DB nunca entra em jogo.
- Cada participante grava **um único doc** (`respostas/{uid}`), atualizado a cada avanço — nunca um doc por pergunta.
- Autenticação Anônima pro participante (uid fica no navegador — "uma resposta por aparelho"), E-mail/senha só pro operador.
- `firestore.rules`: participante só lê/escreve o PRÓPRIO doc, nunca a coleção inteira; nunca escreve depois de `status=concluida`; só escreve com `config/pesquisa.status=="aberta"`.
- Teste de carga de 500 simulados deve rodar **num dia separado** do culto real (cota diária do Spark: 20 mil escritas, 50 mil leituras — cada participante gera ~25-28 escritas).

## Simplificações conscientes (ponytail)

- Scripts de CDN sem SRI (`integrity=`) — adicionar se quiser blindar contra CDN comprometido.
- Validação de tamanho de texto (600 char) só no `maxlength` do cliente, não replicada nas `firestore.rules` — não é dado financeiro/sensível o bastante pra justificar regra complexa sem loop nativo no Firestore Rules.
- Excel/JSON exportam sempre o dataset completo (não respeitam os filtros do dashboard) — é ferramenta de backup/auditoria, não de recorte.
