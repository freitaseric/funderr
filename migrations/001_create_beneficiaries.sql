CREATE TABLE
  beneficiaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(11) NOT NULL,
    apelido TEXT,
    nacionalidade TEXT,
    naturalidade TEXT,
    estadoCivil TEXT,
    dataNascimento TEXT,
    profissao TEXT,
    rg TEXT,
    escolaridade TEXT,
    endereco TEXT,
    dependentes INTEGER,
    conjugeNome TEXT,
    conjugeRg TEXT,
    conjugeCpf TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );