CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beneficiary_id INTEGER NOT NULL,
    denominacao TEXT NOT NULL,
    endereco TEXT NOT NULL DEFAULT '',
    municipio TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'RR',
    area_total REAL NOT NULL DEFAULT 0,
    area_disponivel REAL,
    area_legal REAL,
    forma_ocupacao TEXT NOT NULL DEFAULT '',
    tempo_exploracao TEXT,
    modulo TEXT,
    documento_existente TEXT NOT NULL DEFAULT '',
    latitude REAL,
    longitude REAL,
    place_id TEXT,
    confrontacao_norte TEXT,
    confrontacao_sul TEXT,
    confrontacao_leste TEXT,
    confrontacao_oeste TEXT,
    administracao TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE RESTRICT
);

CREATE TABLE beneficiary_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beneficiary_id INTEGER NOT NULL,
    ordem INTEGER NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    UNIQUE (beneficiary_id, ordem),
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE CASCADE
);

CREATE INDEX properties_beneficiary_id_idx ON properties(beneficiary_id);

CREATE TABLE proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    beneficiary_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    atividade TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'EM ELABORAÇÃO',
    patrimonio_status TEXT NOT NULL DEFAULT 'PENDENTE',
    patrimonio_dividas_confirmadas INTEGER NOT NULL DEFAULT 0,
    identificacao_status TEXT NOT NULL DEFAULT 'PENDENTE',
    fluxo_status TEXT NOT NULL DEFAULT 'PENDENTE',
    fluxo_projecao_confirmada INTEGER NOT NULL DEFAULT 0,
    financiamento_status TEXT NOT NULL DEFAULT 'PENDENTE',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE RESTRICT,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT
);

CREATE INDEX proposals_beneficiary_id_idx ON proposals(beneficiary_id);
CREATE INDEX proposals_property_id_idx ON proposals(property_id);

CREATE TABLE proposal_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    status_anterior TEXT NOT NULL,
    status_novo TEXT NOT NULL,
    motivo TEXT NOT NULL DEFAULT '',
    changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE patrimony_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    especificacao TEXT NOT NULL,
    unidade TEXT NOT NULL,
    quantidade REAL NOT NULL,
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE patrimony_debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    credor TEXT NOT NULL,
    finalidade TEXT NOT NULL,
    vencimento TEXT NOT NULL,
    saldo_devedor REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE identifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL UNIQUE,
    finalidade TEXT NOT NULL DEFAULT '',
    mercado TEXT NOT NULL DEFAULT '',
    faturamento_ultimo_ano REAL NOT NULL DEFAULT 0,
    analise_localizacao TEXT NOT NULL DEFAULT '',
    consideracoes TEXT NOT NULL DEFAULT '',
    empregos_confirmados INTEGER NOT NULL DEFAULT 0,
    usos_fontes_confirmados INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'RASCUNHO',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE proposal_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    fase_atual INTEGER NOT NULL DEFAULT 0,
    fase_expansao INTEGER NOT NULL DEFAULT 0,
    UNIQUE (proposal_id, categoria),
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE proposal_use_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    realizado REAL NOT NULL DEFAULT 0,
    a_realizar REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE cash_flow_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    unidade TEXT NOT NULL,
    quantidade REAL NOT NULL,
    valor_unitario REAL NOT NULL,
    ano1 REAL NOT NULL,
    ano2 REAL NOT NULL DEFAULT 0,
    ano3 REAL NOT NULL DEFAULT 0,
    ano4 REAL NOT NULL DEFAULT 0,
    ano5 REAL NOT NULL DEFAULT 0,
    ano6 REAL NOT NULL DEFAULT 0,
    ano7 REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE credit_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    teto_financiamento REAL NOT NULL,
    taxa_juros_anual REAL NOT NULL,
    prazo_max_anos INTEGER NOT NULL,
    carencia_max_anos INTEGER NOT NULL,
    percentual_financiavel_max REAL NOT NULL,
    percentual_ater_padrao REAL NOT NULL,
    observacoes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financing_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL UNIQUE,
    credit_line_id INTEGER NOT NULL,
    valor_proposta REAL NOT NULL,
    percentual_financiavel REAL NOT NULL,
    valor_financiado REAL NOT NULL,
    percentual_ater REAL NOT NULL,
    valor_ater REAL NOT NULL,
    valor_projeto REAL NOT NULL,
    taxa_juros_anual REAL NOT NULL,
    prazo_total_anos INTEGER NOT NULL,
    carencia_anos INTEGER NOT NULL,
    juros_carencia TEXT NOT NULL DEFAULT 'PAGAR',
    garantias_confirmadas INTEGER NOT NULL DEFAULT 0,
    cronograma_confirmado INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'RASCUNHO',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (credit_line_id) REFERENCES credit_lines(id) ON DELETE RESTRICT
);

CREATE TABLE guarantees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    garantidor_nome TEXT,
    garantidor_cpf TEXT,
    garantidor_telefone TEXT,
    valor_estimado REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    tamanho_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
    extracted_data TEXT,
    human_confirmed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    user_role TEXT,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at DESC);

CREATE TABLE app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO app_config (key, value) VALUES
    ('documents_ai', '0'),
    ('realtime_presence', '0'),
    ('assistant', '0'),
    ('advanced_maps', '0'),
    ('new_financing_ui', '0');
