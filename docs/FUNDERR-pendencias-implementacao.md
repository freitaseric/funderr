# FUNDERR — pendências de implementação

Atualizado em: 26 de agosto de 2026

Este documento registra o trabalho que ainda falta para o sistema refletir integralmente a visão descrita em `FUNDERR-visao-funcional.md` e substituir de forma segura a planilha `PLANILHA - FUNDER 3.0 (2024) nova Lei - Copia.zip`.

## 1. Estado atual resumido

Já estão implementados no código:

- autenticação com Firebase Authentication e perfis `ADMIN`, `GESTOR`, `TECNICO` e `CONSULTA`;
- bootstrap controlado do primeiro administrador;
- cadastros de beneficiário e propriedade como rascunhos, com cálculo detalhado de completude;
- patrimônio com itens, dívidas e confirmação explícita da revisão das dívidas;
- identificação com finalidade, mercado, localização, considerações, quatro categorias de empregos e usos/fontes;
- separação de valores realizados e a realizar em usos/fontes;
- fluxo de caixa de sete anos, com Ano 1 calculado por quantidade × valor unitário;
- financiamento SAC, carência, capacidade de pagamento, garantias e confirmações explícitas;
- máquina de estados do processo e revisão em cascata;
- anexação local e confirmação humana de documentos;
- validação TypeScript, testes de domínio e build de produção.

Esses itens estão implementados localmente, mas a autenticação ainda precisa ser validada contra um projeto Firebase real.

## 2. Prioridade imediata — colocar a infraestrutura real em funcionamento

### 2.1. Configurar e validar o Firebase Authentication

Falta:

- definir o projeto Google/Firebase definitivo;
- habilitar o provedor E-mail/Senha;
- preencher as variáveis `VITE_FIREBASE_*`, `FIREBASE_PROJECT_ID` e `FUNDERR_BOOTSTRAP_EMAIL`;
- configurar credenciais do backend por Application Default Credentials ou conta de serviço;
- executar o bootstrap do primeiro administrador;
- validar login, logout, renovação/revogação de token e criação de usuários;
- validar as custom claims `role` e `status` em ambiente real;
- testar todos os perfis de acesso contra as rotas protegidas.

Critério de aceite:

- nenhum usuário acessa dados sem token Firebase válido;
- usuário pendente não acessa o sistema;
- `CONSULTA` não altera dados;
- apenas `ADMIN` gerencia usuários;
- não é possível remover ou desativar o último administrador ativo.

### 2.2. Substituir o banco JSON local

Situação atual:

- dados estruturados ainda são persistidos em `data/funderr_db.json`;
- a implementação é síncrona e adequada apenas para desenvolvimento local;
- não há controle robusto de concorrência entre múltiplas instâncias do servidor.

Falta:

- migrar usuários locais, beneficiários, propriedades, processos, etapas, linhas de crédito e auditoria para Cloud Firestore;
- definir coleções, subcoleções, índices e estratégia de transações;
- aplicar e testar `firebase/firestore/firestore.rules`;
- criar migração idempotente do JSON para Firestore, sem dados artificiais;
- implementar paginação e consultas que evitem leituras desnecessárias;
- definir política de retenção, exportação e recuperação.

Critério de aceite:

- duas instâncias podem alterar processos sem perda silenciosa de dados;
- operações relacionadas são atômicas;
- regras do Firestore reproduzem o RBAC do backend;
- a migração pode ser executada mais de uma vez sem duplicar registros.

### 2.3. Migrar anexos para armazenamento gerenciado

Situação atual:

- arquivos são gravados em `data/uploads` no disco do servidor;
- formato e tamanho são validados, mas os arquivos não sobrevivem necessariamente a uma troca de instância ou implantação.

Falta:

- armazenar anexos no Cloud Storage for Firebase;
- usar caminhos por processo e documento;
- aplicar e testar `firebase/storage/storage.rules`;
- gerar acesso autenticado e impedir URLs públicas permanentes;
- excluir o objeto físico de forma consistente com o registro do documento;
- definir versionamento, retenção e antivírus/verificação de conteúdo;
- migrar anexos locais existentes, caso existam.

Critério de aceite:

- nenhum documento sensível fica público;
- exclusão lógica e física permanecem consistentes;
- upload interrompido não cria registro órfão;
- limites de tipo e tamanho são impostos no cliente, backend e Storage Rules.

## 3. Documentos e dossiê final

### 3.1. Matriz documental

Falta definir quais documentos são:

- obrigatórios para todo processo;
- condicionais ao estado civil;
- condicionais à ocupação ou documentação da propriedade;
- condicionais à linha de crédito e ao tipo de garantia;
- opcionais.

O status da etapa não deve ser concluído apenas porque existe um documento confirmado. Ele deve considerar essa matriz e indicar nominalmente cada ausência.

### 3.2. Google Docs e Google Drive

Falta:

- definir a conta ou Shared Drive institucional proprietário dos arquivos;
- preparar modelos oficiais no Google Docs;
- definir marcadores e tabelas repetíveis para os dados do processo;
- gerar um Google Doc a partir dos dados estruturados, sem redigitação;
- exportar o documento para PDF;
- armazenar Google Doc e PDF em pasta própria do processo no Google Drive;
- registrar IDs, links, versão, modelo utilizado, autor e data da geração;
- permitir nova geração sem apagar versões anteriores;
- impedir geração final quando houver etapas incompletas ou em revisão;
- definir permissões de visualização e edição no Drive.

Critério de aceite:

- o dossiê contém beneficiário, propriedade, patrimônio, dívidas, identificação, empregos, usos/fontes, fluxo, financiamento, capacidade e garantias;
- os totais do documento são idênticos aos totais do sistema;
- cada PDF possui rastreabilidade até o processo e a versão que o gerou;
- usuários não precisam copiar dados manualmente para um editor.

### 3.3. Document AI

Situação atual:

- não existe extração real;
- a antiga simulação com dados inventados foi removida;
- documentos sem processador real seguem para revisão humana.

Falta, após autorização de custo:

- escolher processadores por tipo documental;
- enviar arquivos ao Document AI;
- mapear entidades extraídas para um contrato interno;
- apresentar lado a lado o valor extraído e o valor cadastrado;
- exigir confirmação humana antes de atualizar qualquer cadastro;
- tratar baixa confiança, falha, reprocessamento e documentos ilegíveis;
- registrar processador, versão, confiança, custo estimado e auditoria;
- garantir que documentos pessoais não sejam enviados a modelos ou regiões não autorizados.

Critério de aceite:

- nenhuma extração altera dados automaticamente;
- o usuário identifica claramente a origem e confiança de cada campo;
- falhas de processamento não impedem a confirmação manual do documento.

## 4. Migração e equivalência com a planilha

Falta:

- inventariar todas as abas, células de entrada, fórmulas, listas e documentos produzidos pela planilha;
- criar uma matriz de equivalência `planilha → domínio → tela → documento final`;
- identificar regras da Nova Lei que ainda não estão formalizadas na visão funcional;
- criar importador da planilha para processos históricos, se necessário;
- preservar identificadores e origem dos dados importados;
- comparar cálculos do sistema e da planilha com casos reais anonimizados;
- documentar divergências intencionais, arredondamentos e regras substituídas.

Critério de aceite:

- um conjunto de processos de referência produz os mesmos resultados esperados da planilha;
- toda divergência possui justificativa funcional aprovada;
- a importação apresenta relatório de erros sem gravar processos parcialmente corrompidos.

## 5. Regras funcionais que ainda precisam ser fechadas

### 5.1. Linhas de crédito

Falta:

- cadastrar as linhas oficiais vigentes sem colocá-las como constantes no código;
- definir vigência e histórico de alterações;
- decidir se a taxa pode ser alterada por processo ou deve ser herdada obrigatoriamente;
- definir limites de ATER por linha;
- impedir que alteração posterior de uma linha modifique cenários já formalizados;
- registrar uma fotografia dos parâmetros aplicados ao processo.

### 5.2. Garantias

Falta:

- detalhar campos obrigatórios para penhor, hipoteca, aval, fiança e outras garantias;
- validar CPF/CNPJ conforme o tipo de garantidor;
- definir cobertura mínima ou apenas alerta de insuficiência;
- vincular documentos comprobatórios à garantia correspondente.

### 5.3. Aprovação e formalização

Falta:

- definir quem pode enviar para análise, devolver, aprovar, recusar e concluir;
- definir pareceres e justificativas obrigatórias por transição;
- criar histórico visual das decisões;
- decidir se aprovação requer dupla conferência ou assinatura;
- bloquear alterações diretas em processo formalizado, usando nova revisão ou versão.

### 5.4. Completude dos dados gerais

Falta:

- transformar Dados Gerais em etapa validada, em vez de tratá-la sempre como 100%;
- definir campos obrigatórios adicionais, responsáveis e unidade administrativa;
- revisar pesos do percentual global — hoje as oito etapas têm o mesmo peso;
- definir tratamento de processos legados incompletos.

## 6. Integrações Google complementares

### 6.1. Google Maps

Situação atual:

- o sistema apenas abre coordenadas em um link externo do Google Maps.

Falta, após autorização de custo:

- escolher APIs necessárias, evitando habilitar APIs sem uso;
- restringir chaves por domínio, aplicativo e API;
- implementar seleção/validação visual da localização;
- decidir se Place ID, geocodificação e rotas são realmente necessários;
- configurar cotas, orçamento e alertas.

### 6.2. Firebase Remote Config

Situação atual:

- os sinalizadores são armazenados no banco local;
- existe apenas um template no repositório;
- recursos não implementados ou potencialmente cobrados ficam desativados por padrão.

Falta:

- usar o Firebase Remote Config real;
- manter valores padrão seguros no cliente;
- restringir publicação a administradores;
- registrar histórico de publicação e permitir rollback;
- não usar feature flag como substituto de autorização no backend.

### 6.3. Observabilidade e segredos

Falta:

- armazenar credenciais em Secret Manager no ambiente de produção;
- adicionar logs estruturados sem CPF, telefone, tokens ou conteúdo documental;
- configurar Error Reporting e métricas operacionais;
- criar alertas de autenticação, falhas de processamento e consumo/custo;
- definir regiões dos serviços conforme requisitos de proteção de dados.

## 7. Segurança, privacidade e conformidade

Falta:

- elaborar inventário de dados pessoais e base legal de tratamento;
- definir perfis de acesso a documentos sensíveis;
- mascarar CPF e telefone em telas onde o dado completo não seja necessário;
- implementar política de retenção e descarte;
- registrar download, visualização, geração e compartilhamento de documentos;
- proteger contra upload malicioso e validar assinatura real do tipo de arquivo;
- aplicar cabeçalhos HTTP de segurança, limite de requisições e proteção CSRF quando aplicável;
- executar análise de dependências e revisão de segurança antes da produção;
- definir procedimento para revogação de acesso e resposta a incidente.

## 8. Qualidade e testes

Falta:

- testes unitários específicos para cada serviço e transição;
- testes de integração das rotas com Firebase Auth Emulator;
- testes com Firestore e Storage Emulator;
- testes de concorrência e transações;
- testes de migração da planilha e do JSON;
- testes ponta a ponta dos quatro perfis de usuário;
- testes do fluxo completo até a geração do dossiê;
- testes de acessibilidade e navegação por teclado;
- testes em telas pequenas e com grande volume de processos;
- casos de regressão para revisão em cascata;
- CI executando `typecheck`, testes e build em cada alteração.

O conjunto atual de testes cobre principalmente validações e cálculos de domínio; ainda não representa cobertura suficiente para produção.

## 9. Experiência de uso

Falta:

- dividir `ProcessosView.tsx` em componentes menores por etapa;
- substituir `any` remanescentes por contratos de API tipados;
- adicionar estados de salvamento, prevenção de duplo clique e confirmação de saída com alterações não salvas;
- apresentar erros por campo, não apenas mensagem global;
- permitir edição dos valores extraídos antes da confirmação documental;
- criar visualização do histórico de status e revisões;
- adicionar paginação, busca e filtros nos cadastros;
- revisar termos, máscaras monetárias e formatação de datas;
- concluir acessibilidade conforme padrão aplicável ao serviço público.

## 10. Operação e implantação

Falta:

- definir ambientes de desenvolvimento, homologação e produção;
- criar configuração de Firebase separada por ambiente;
- definir infraestrutura de hospedagem do frontend e backend;
- automatizar implantação e rollback;
- executar migrações antes da liberação;
- configurar domínio, HTTPS, CORS e política de cookies;
- criar monitoramento, backup e plano de continuidade;
- documentar instalação local, configuração e operação;
- criar procedimento de treinamento e suporte aos técnicos.

## 11. Serviços com decisão de custo pendente

Nenhum destes serviços deve ser habilitado no projeto real sem autorização prévia do responsável:

| Serviço | Uso previsto | Situação de custo |
|---|---|---|
| Cloud Storage for Firebase | Anexos e PDFs | Requer plano Blaze; pode gerar cobrança por armazenamento, operações e tráfego |
| Document AI | OCR e extração estruturada | Cobrança conforme processador e páginas processadas |
| Google Maps Platform | Mapa, Places, geocodificação e rotas | Cobrança conforme API e volume |
| Cloud Firestore | Banco transacional | Possui cota gratuita, mas cobra excedentes e certos recursos |
| Secret Manager, Cloud Run e observabilidade | Produção do backend | Podem gerar cobrança conforme uso |

Google Drive e Google Docs podem ser usados no limite padrão da API sem custo adicional, mas ainda exigem projeto Google, credenciais, definição da conta proprietária e política de compartilhamento.

## 12. Ordem recomendada de execução

1. Definir projeto Firebase/Google, ambientes e responsáveis.
2. Validar Firebase Authentication real e RBAC.
3. Aprovar ou rejeitar os serviços com cobrança potencial.
4. Migrar banco local para Firestore e anexos para Storage.
5. Criar matriz documental e modelos oficiais no Google Docs.
6. Gerar, versionar e armazenar o dossiê e PDF no Google Drive.
7. Inventariar integralmente a planilha e fechar a matriz de equivalência.
8. Implementar Document AI e Maps apenas se aprovados e necessários.
9. Completar segurança, testes de integração, acessibilidade e observabilidade.
10. Homologar com processos reais anonimizados antes da produção.

## 13. Decisões necessárias do responsável

Para desbloquear as próximas implementações, é necessário informar:

- ID do projeto Google/Firebase definitivo;
- ambientes desejados: homologação e produção, ou também desenvolvimento remoto;
- autorização ou proibição individual para Storage, Document AI, Maps, Firestore e hospedagem Google;
- conta ou Shared Drive que será proprietário dos documentos;
- modelos oficiais que devem ser reproduzidos no Google Docs;
- necessidade de importar processos históricos da planilha;
- matriz de documentos obrigatórios;
- linhas de crédito oficiais e suas regras vigentes;
- política de aprovação, assinatura e formalização do projeto.

## 14. Referências de custo e operação

- [Firebase Pricing](https://firebase.google.com/pricing)
- [Cloud Firestore — preços e cotas](https://firebase.google.com/docs/firestore/pricing)
- [Cloud Storage for Firebase — requisitos de faturamento](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [Document AI Pricing](https://cloud.google.com/products/document-ai/pricing)
- [Google Drive API — limites e preços](https://developers.google.com/workspace/drive/api/guides/limits)
