# Modelo de segurança

## Dados sensíveis

O sistema contém dados pessoais e potencialmente financeiros:

- CPF;
- RG;
- endereço;
- telefone;
- dados de cônjuge;
- propriedade;
- coordenadas;
- patrimônio;
- dívidas;
- garantias;
- documentos.

Trate o sistema como aplicação institucional, não como demo pública.

## Authentication

- Google Sign-In inicialmente.
- Criar perfil `users/{uid}`.
- Usuário autenticado ≠ usuário autorizado.
- Novos usuários devem ficar bloqueados ou em papel sem acesso até aprovação.

## Papéis iniciais

- `ADMIN`: configuração e usuários;
- `GESTOR`: acesso operacional amplo;
- `TECNICO`: cria/edita processos conforme política;
- `CONSULTA`: somente leitura autorizada.

Os papéis podem evoluir para claims customizadas/escopos.

## Firestore Rules

Princípios:

- deny by default;
- sem `allow read, write: if true`;
- exigir auth;
- validar ownership/role;
- impedir cliente de escolher `createdBy`, `role`, status final e campos de auditoria;
- considerar operações sensíveis somente via servidor.

## Storage Rules

- arquivos vinculados a processo;
- exigir auth;
- validar tamanho e tipos aceitos;
- impedir caminho arbitrário;
- exclusão só por papel autorizado;
- metadados e Firestore devem permanecer consistentes.

## App Check

Habilitar antes da produção.

Web: usar o provider recomendado pelo Firebase no momento do deploy.

## Secrets

- Gemini API key nunca no código cliente;
- Maps browser key pode existir no cliente apenas com restrições de domínio/API adequadas;
- segredos reais no gerenciador de secrets/server environment;
- `.env` não deve ser commitado.

## Logs e Analytics

Nunca enviar PII para Analytics.

Não registrar CPF completo, RG, conteúdo de documentos ou dados financeiros em logs de telemetria.

## Gemini

- opt-in por funcionalidade;
- não enviar documentos automaticamente;
- apresentar resultado como sugestão;
- manter revisão humana;
- IA não altera status/cálculo financeiro por conta própria.
