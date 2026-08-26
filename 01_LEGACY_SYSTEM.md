# Inventário do sistema legado

## Runtime

- Google Apps Script V8
- timezone: `America/Manaus`
- web app executado como `USER_DEPLOYING`
- acesso atual: `MYSELF`
- persistência: Google Sheets
- segredo de Maps: Script Properties (`GOOGLE_MAPS_API_KEY`), injetado no HTML
- favicon/logo: CDN externa
- GovBR-DS: CDN JSDelivr
- frontend: HTML + CSS + JavaScript imperativo
- RPC: `google.script.run`

## Arquivos server-side

- `00_App.gs`: boot do web app e includes
- `01_Setup.gs`: criação/evolução das abas
- `02_Database.gs`: acesso genérico às sheets
- `03_Utils.gs`: datas/números/formatação
- `04_Validacoes.gs`: validações e completude
- `Beneficiarios.gs`
- `Referencias.gs`
- `Propriedades.gs`
- `Propostas.gs`
- `Patrimonio.gs`
- `IdentificacaoProposta.gs`
- `FluxoCaixa.gs`
- `LinhasCredito.gs`
- `Financiamento.gs`

## Views

- `View_Processos.html`
- `View_Beneficiarios.html`
- `View_Propriedades.html`
- `View_Patrimonio.html`
- `View_Identificacao.html`
- `View_FluxoCaixa.html`
- `View_Financiamento.html`

## Clients

Cada view possui um arquivo `Client_*.html` correspondente, usando `google.script.run` para chamar o backend.

### API pública do legado

Consulte `migration/legacy-api-surface.json`.

Principais grupos:

- beneficiários: salvar/listar/buscar;
- propriedades: salvar/listar/buscar;
- propostas: criar/listar/buscar;
- patrimônio: itens, dívidas, rascunho, conclusão;
- identificação: salvar/concluir/obter;
- fluxo de caixa: itens, rascunho, conclusão;
- financiamento: condições, garantias, rascunho, conclusão;
- linhas de crédito: listar ativas.

## Proteções UX já existentes

- aviso de alterações não salvas;
- loading/feedback de erro;
- busca e filtragem;
- preenchimento de data atual;
- navegação contextual;
- cálculo de percentual de completude;
- fallback se GovBR-DS falhar.

Esses comportamentos devem ser preservados ou melhorados.
