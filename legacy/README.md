# FUNDERR

Sistema institucional do Instituto de Assistência Técnica e Extensão Rural do
Estado de Roraima (IATER) para elaboração e gestão de projetos de crédito rural.

> **Uso restrito:** este é um projeto privado do Instituto de Assistência Técnica e
> Extensão Rural do Estado de Roraima (IATER). O código-fonte, os documentos e os
> dados associados não podem ser copiados, distribuídos ou utilizados sem
> autorização institucional.

## Requisitos

- PHP 8.2 ou superior;
- extensões PDO SQLite, mbstring e fileinfo;
- Composer.

## Instalação e execução

```bash
composer install
composer migrate
composer start
```

O servidor permanece ativo no terminal e escuta em `0.0.0.0:8000`. No próprio
computador, acesse `http://127.0.0.1:8000`. Para acessar de outro dispositivo na
mesma rede, utilize `http://IP-DO-COMPUTADOR:8000`.

O servidor embutido do PHP é destinado a desenvolvimento e apresentações em rede
local confiável. A aplicação não possui autenticação; não a exponha diretamente à
internet nem a redes públicas.

## Dados e armazenamento

Por padrão:

- o banco SQLite fica em `data/funderr.sqlite`;
- os documentos privados ficam em `data/documents`;
- variáveis `FUNDERR_DATABASE_PATH` e `FUNDERR_DOCUMENTS_PATH` permitem definir
  locais alternativos.

Esses diretórios podem conter dados pessoais e documentos institucionais. Não os
adicione ao Git e mantenha cópias de segurança conforme as políticas do IATER e a
legislação aplicável.

## Funcionalidades

- painel operacional;
- beneficiários, referências pessoais e propriedades;
- processos e controle de completude;
- levantamento patrimonial e dívidas;
- identificação, empregos, usos e fontes;
- fluxo de caixa de sete anos;
- financiamento SAC, garantias e capacidade de pagamento;
- documentos privados;
- linhas de crédito, auditoria e presença de dispositivos.

## Validação

```bash
composer test
```

## Documentação histórica

O diretório `docs/` contém materiais usados na análise de paridade com a planilha
original. Esses documentos são referências históricas e não substituem a validação
das regras com os usuários responsáveis pelo processo.

## Licença

Software proprietário do IATER. Consulte o arquivo [`LICENSE`](LICENSE).
