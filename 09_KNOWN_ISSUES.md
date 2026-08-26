# Achados e pontos de atenção no legado

## 1. Versão visual divergente

O pacote é v0.10.2, porém `Index.html` ainda mostra `v0.10.1` em dois pontos e existem comentários CSS misturando versões.

Na v1, a versão deve vir de uma fonte única (`package.json`/build metadata).

## 2. Documentos não implementado

A etapa “Documentos” já aparece no progresso do processo, mas é hardcoded como `Pendente` e não possui view/client/server.

A v1 deve implementar o módulo usando Cloud Storage + Firestore.

## 3. Dados não incluídos

O ZIP exportado contém código, não a planilha.

As linhas de crédito reais e todos os registros operacionais precisam de export separado.

## 4. Acesso atual é MYSELF

O manifesto Apps Script restringe o web app ao próprio owner. A v1 mudará completamente o modelo de identidade; autenticação e autorização precisam ser projetadas, não apenas “ligadas”.

## 5. Maps key é injetada no HTML

A chave está em Script Properties, mas acaba sendo entregue ao browser, como é normal para Maps JS.

Na v1, usar chave de browser separada e restringida por domínio e APIs. Não reutilizar chave de servidor/Gemini.

## 6. Concorrência

O legado usa `LockService` para criação de processos e gravações.

No Firestore, substituir por transactions/batched writes e operações server-side apropriadas.

## 7. Estado derivado por timestamps

A revisão entre etapas depende de timestamps de “última revisão” e “última alteração”.

Essa lógica precisa ser testada explicitamente; não basta migrar o campo `status`.
