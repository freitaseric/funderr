import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AuditLog,
  Beneficiary,
  BeneficiaryReference,
  CashFlowItem,
  CreditLine,
  FinancingScenario,
  Guarantee,
  PatrimonyDebt,
  PatrimonyItem,
  Property,
  Proposal,
  ProposalDocument,
  ProposalIdentification,
  ProposalJob,
  ProposalStatusHistory,
  ProposalUseSource,
  RemoteConfigFlags,
  User,
} from "../../domain/types";

export interface DatabaseSchema {
  users: User[];
  beneficiaries: Beneficiary[];
  beneficiaryReferences: BeneficiaryReference[];
  properties: Property[];
  proposals: Proposal[];
  proposalStatusHistory: ProposalStatusHistory[];
  patrimonyItems: PatrimonyItem[];
  patrimonyDebts: PatrimonyDebt[];
  jobs: ProposalJob[];
  usesSources: ProposalUseSource[];
  identifications: ProposalIdentification[];
  cashFlowItems: CashFlowItem[];
  creditLines: CreditLine[];
  financingScenarios: FinancingScenario[];
  guarantees: Guarantee[];
  documents: ProposalDocument[];
  auditLogs: AuditLog[];
  remoteConfig: RemoteConfigFlags;
  counters: Record<string, number>;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "funderr_db.json");

export class RelationalDatabase {
  private data: DatabaseSchema;
  private inTransaction = false;

  constructor() {
    this.data = this.load();
    this.seedDefaults();
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      users: [],
      beneficiaries: [],
      beneficiaryReferences: [],
      properties: [],
      proposals: [],
      proposalStatusHistory: [],
      patrimonyItems: [],
      patrimonyDebts: [],
      jobs: [],
      usesSources: [],
      identifications: [],
      cashFlowItems: [],
      creditLines: [],
      financingScenarios: [],
      guarantees: [],
      documents: [],
      auditLogs: [],
      remoteConfig: {
        documents_ai: true,
        realtime_presence: true,
        assistant: true,
        advanced_maps: true,
        new_financing_ui: true,
      },
      counters: {},
    };
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        return { ...this.getDefaultSchema(), ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error("[Database] Error reading db file, using fresh schema:", err);
    }
    return this.getDefaultSchema();
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error("[Database] Error writing db file:", err);
    }
  }

  private seedDefaults(): void {
    let changed = false;

    // Seed default users with roles
    if (this.data.users.length === 0) {
      this.data.users = [
        {
          id: "usr-admin",
          email: "admin@funderr.rr.gov.br",
          name: "Administrador FUNDERR",
          role: "ADMIN",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "usr-gestor",
          email: "gestor@funderr.rr.gov.br",
          name: "Gestor de Crédito Rural",
          role: "GESTOR",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "usr-tecnico",
          email: "tecnico@funderr.rr.gov.br",
          name: "Técnico Extensionista ATER",
          role: "TECNICO",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "usr-consulta",
          email: "auditoria@funderr.rr.gov.br",
          name: "Auditor Consultivo",
          role: "CONSULTA",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      changed = true;
    }

    // Seed initial credit lines if empty
    if (this.data.creditLines.length === 0) {
      this.data.creditLines = [
        {
          id: "lc-funderr-pecuaria",
          codigo: "FUNDERR_PECUARIA",
          nome: "FUNDERR Apoio à Bovinocultura e Pecuária",
          ativo: true,
          tetoFinanciamento: 150000,
          taxaJurosAnual: 3.5,
          prazoMaxAnos: 7,
          carenciaMaxAnos: 2,
          percentualFinanciavelMax: 100,
          percentualAterPadrao: 2.5,
          observacoes: "Pastagens, melhoramento genético, cerca e instalações para gado de leite e corte.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lc-funderr-fomento",
          codigo: "FUNDERR_FOMENTO",
          nome: "FUNDERR Fomento da Agricultura Familiar",
          ativo: true,
          tetoFinanciamento: 80000,
          taxaJurosAnual: 2.0,
          prazoMaxAnos: 7,
          carenciaMaxAnos: 2,
          percentualFinanciavelMax: 100,
          percentualAterPadrao: 2.5,
          observacoes: "Linha estadual FUNDERR voltada ao fortalecimento do campo em Roraima.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lc-funderr-mandioca",
          codigo: "FUNDERR_HORTI",
          nome: "FUNDERR Hortifrutigranjeiros e Mandiocultura",
          ativo: true,
          tetoFinanciamento: 60000,
          taxaJurosAnual: 2.0,
          prazoMaxAnos: 5,
          carenciaMaxAnos: 1,
          percentualFinanciavelMax: 100,
          percentualAterPadrao: 2.5,
          observacoes: "Irrigação, casas de farinha e cultivo de mandioca e hortaliças.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lc-pronaf-b",
          codigo: "PRONAF_B",
          nome: "PRONAF B (Microcrédito Produtivo Rural)",
          ativo: true,
          tetoFinanciamento: 40000,
          taxaJurosAnual: 0.5,
          prazoMaxAnos: 2,
          carenciaMaxAnos: 1,
          percentualFinanciavelMax: 100,
          percentualAterPadrao: 2.0,
          observacoes: "Destinado a agricultores familiares do Grupo B.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lc-pronaf-custeio",
          codigo: "PRONAF_CUSTEIO",
          nome: "PRONAF Custeio e Investimento",
          ativo: true,
          tetoFinanciamento: 250000,
          taxaJurosAnual: 4.5,
          prazoMaxAnos: 8,
          carenciaMaxAnos: 2,
          percentualFinanciavelMax: 100,
          percentualAterPadrao: 2.0,
          observacoes: "Custeio de lavouras e investimento em infraestrutura produtiva.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lc-pronaf-mulher",
          codigo: "PRONAF_MULHER",
          nome: "PRONAF Mulher / Jovem",
          ativo: true,
          tetoFinanciamento: 100000,
          taxaJurosAnual: 3.0,
          prazoMaxAnos: 10,
          carenciaMaxAnos: 3,
          percentualFinanciavelMax: 100,
          percentualAterPadrao: 2.0,
          observacoes: "Foco em mulheres e jovens rurais com projetos estruturantes.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      changed = true;
    }

    // Seed initial realistic Roraima rural credit data if empty
    if (this.data.beneficiaries.length === 0) {
      const now = new Date().toISOString();
      const b1 = {
        id: "ben-roraima-01",
        cpf: "12345678909",
        nome: "Raimundo Nonato da Silva",
        rg: "123456-SSP/RR",
        dataNascimento: "1978-05-14",
        nacionalidade: "Brasileira",
        naturalidade: "Boa Vista - RR",
        estadoCivil: "CASADO" as const,
        regimeBens: "Comunhão Parcial de Bens",
        profissao: "Agricultor Familiar",
        telefone: "95991234567",
        email: "raimundo.silva@rural.rr.gov.br",
        enderecoResidencial: "Vicinal 01, Km 12, Lote 45",
        municipioResidencia: "Mucajaí" as const,
        ufResidencia: "RR",
        cepResidencia: "69340-000",
        conjugeNome: "Maria de Fátima Alves da Silva",
        conjugeCpf: "98765432100",
        conjugeRg: "654321-SSP/RR",
        conjugeNascimento: "1982-08-20",
        conjugeProfissao: "Agricultora Familiar",
        referenciasPessoais: [
          { nome: "João Pedro Mendes", telefone: "95991887766", relacao: "Vizinho / Cooperado" },
          { nome: "Cooperativa Agropecuária de Mucajaí", telefone: "9535421122", relacao: "Cooperativa" },
        ],
        createdAt: now,
        updatedAt: now,
      };

      const b2 = {
        id: "ben-roraima-02",
        cpf: "23456789012",
        nome: "Ana Paula de Oliveira Costa",
        rg: "234567-SSP/RR",
        dataNascimento: "1985-11-03",
        nacionalidade: "Brasileira",
        naturalidade: "Caracaraí - RR",
        estadoCivil: "SOLTEIRO" as const,
        profissao: "Produtora de Mandiocultura",
        telefone: "95998765432",
        email: "anapaula.agro@rr.gov.br",
        enderecoResidencial: "Assentamento Nova Amazônia, Quadra 04, Lote 18",
        municipioResidencia: "Boa Vista" as const,
        ufResidencia: "RR",
        cepResidencia: "69300-000",
        referenciasPessoais: [
          { nome: "Sindicato dos Trabalhadores Rurais de Boa Vista", telefone: "9536230011", relacao: "Entidade de Classe" },
        ],
        createdAt: now,
        updatedAt: now,
      };

      this.data.beneficiaries.push(b1, b2);

      const prop1 = {
        id: "prop-roraima-01",
        beneficiaryId: b1.id,
        denominacao: "Sítio Boa Esperança",
        municipio: "Mucajaí" as const,
        uf: "RR",
        areaTotalHa: 65.5,
        areaUtilizadaHa: 42.0,
        condicaoPosse: "PROPRIETARIO" as const,
        tipoDocumentoPosse: "TITULO_DEFINITIVO" as const,
        numeroDocumentoPosse: "ITERP-TD-2018/0452",
        registroCartorio: "Cartório de Imóveis de Mucajaí - Livro 2-RG, Fls 12",
        carNumero: "RR-1400308-5421B876E0A84D2C91",
        ccirIncra: "950.041.008.123-4",
        coordenadasGps: "02°25'40\"N 60°54'12\"W",
        localizacaoAcesso: "BR-174 Sul, entra na Vicinal 01 à direita no Km 45, segue 12km de estrada vicinal cascalhada.",
        createdAt: now,
        updatedAt: now,
      };

      const prop2 = {
        id: "prop-roraima-02",
        beneficiaryId: b2.id,
        denominacao: "Fazenda Nova Aurora",
        municipio: "Cantá" as const,
        uf: "RR",
        areaTotalHa: 120.0,
        areaUtilizadaHa: 80.0,
        condicaoPosse: "PROPRIETARIO" as const,
        tipoDocumentoPosse: "TITULO_DEFINITIVO" as const,
        numeroDocumentoPosse: "ITERP-TD-2020/1189",
        registroCartorio: "Cartório de Cantá - Registro Geral 4501",
        carNumero: "RR-1400175-9988A123C4D56E78",
        ccirIncra: "950.017.554.890-1",
        coordenadasGps: "02°36'18\"N 60°36'00\"W",
        localizacaoAcesso: "RR-206 sentido Cantá, Km 28, margem esquerda.",
        createdAt: now,
        updatedAt: now,
      };

      this.data.properties.push(prop1, prop2);

      const propNum = "2026-0001";
      this.data.counters["proposals-2026"] = 1;

      const p1 = {
        id: "prop-funderr-001",
        numero: propNum,
        beneficiaryId: b1.id,
        propertyId: prop1.id,
        status: "EM_ANDAMENTO" as const,
        etapaAtual: "financiamento" as const,
        percentualConclusao: 85,
        atividade: "Bovinocultura de Leite e Mandiocultura",
        data: "2026-02-15",
        responsavelTecnico: "Eng. Agrônomo Extensionista",
        patrimonioRevisadoEm: now,
        identificacaoRevisadaEm: now,
        fluxoRevisadoEm: now,
        financiamentoRevisadoEm: now,
        createdAt: now,
        updatedAt: now,
      };

      this.data.proposals.push(p1);

      // Add patrimony items
      this.data.patrimonyItems.push(
        {
          id: "pat-1",
          proposalId: p1.id,
          categoria: "TERRA_COBERTURAS" as const,
          especificacao: "Terra nua (65,5 ha) e cercas perimetrais",
          unidade: "Ha",
          quantidade: 65.5,
          valorUnitario: 3500,
          valorTotal: 229250,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "pat-2",
          proposalId: p1.id,
          categoria: "SEMOVENTES" as const,
          especificacao: "Vacas mestiças Girolando em lactação",
          unidade: "Cab",
          quantidade: 18,
          valorUnitario: 4500,
          valorTotal: 81000,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "pat-3",
          proposalId: p1.id,
          categoria: "MAQUINAS_EQUIPAMENTOS" as const,
          especificacao: "Ordenhadeira mecânica 2 conjuntos e triturador",
          unidade: "Un",
          quantidade: 1,
          valorUnitario: 18000,
          valorTotal: 18000,
          createdAt: now,
          updatedAt: now,
        }
      );

      // Add proposal identification
      this.data.proposalIdentifications.push({
        id: "ident-1",
        proposalId: p1.id,
        finalidade: "Aquisição de matrizes leiteiras de alto padrão genético, ampliação de pastagem e reforma da sala de ordenha.",
        mercado: "Fornecimento diário de leite in natura para cooperativa de laticínios de Roraima e comércio regional de derivados.",
        faturamentoUltimoAno: 92000,
        analiseLocalizacao: "Propriedade com bom acesso viário na Vicinal 01, facilitando o transporte diário do leite resfriado.",
        status: "CONCLUIDO" as const,
        createdAt: now,
        updatedAt: now,
      });

      // Add Cash Flow items
      this.data.cashFlowItems.push(
        {
          id: "cf-1",
          proposalId: p1.id,
          tipo: "RECEITA" as const,
          descricao: "Venda de Leite Resfriado (Litros)",
          unidade: "Litro",
          quantidade: 28000,
          valorUnitario: 3.2,
          ano1: 89600,
          ano2: 105000,
          ano3: 120000,
          ano4: 125000,
          ano5: 130000,
          ano6: 130000,
          ano7: 130000,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "cf-2",
          proposalId: p1.id,
          tipo: "RECEITA" as const,
          descricao: "Venda de Farinha e Derivados da Mandioca",
          unidade: "Saco 50kg",
          quantidade: 120,
          valorUnitario: 220,
          ano1: 26400,
          ano2: 30000,
          ano3: 32000,
          ano4: 35000,
          ano5: 35000,
          ano6: 35000,
          ano7: 35000,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "cf-3",
          proposalId: p1.id,
          tipo: "CUSTO_VARIAVEL" as const,
          descricao: "Suplementação mineral, vacinas e ração concentrada",
          unidade: "Mês",
          quantidade: 12,
          valorUnitario: 1800,
          ano1: 21600,
          ano2: 24000,
          ano3: 26000,
          ano4: 28000,
          ano5: 28000,
          ano6: 28000,
          ano7: 28000,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "cf-4",
          proposalId: p1.id,
          tipo: "CUSTO_FIXO" as const,
          descricao: "Energia elétrica rural, manutenção e combustível",
          unidade: "Mês",
          quantidade: 12,
          valorUnitario: 1100,
          ano1: 13200,
          ano2: 14000,
          ano3: 15000,
          ano4: 15500,
          ano5: 16000,
          ano6: 16000,
          ano7: 16000,
          createdAt: now,
          updatedAt: now,
        }
      );

      // Add Financing scenario
      this.data.financingScenarios.push({
        id: "fin-1",
        proposalId: p1.id,
        linhaCreditoId: "lc-funderr-pecuaria",
        valorProposta: 60000,
        percentualFinanciavel: 100,
        percentualAter: 2.5,
        taxaJurosAnual: 3.5,
        prazoTotalAnos: 5,
        carenciaAnos: 1,
        jurosCarencia: "PAGAR" as const,
        status: "CONCLUIDO" as const,
        createdAt: now,
        updatedAt: now,
      });

      // Add Document
      this.data.proposalDocuments.push({
        id: "doc-1",
        proposalId: p1.id,
        tipo: "CAF_DAP" as const,
        nomeArquivo: "CAF_Pronaf_RaimundoSilva_2026.pdf",
        mimeType: "application/pdf",
        tamanhoBytes: 345000,
        storageUrl: "gs://funderr-docs/proposals/prop-funderr-001/CAF_Pronaf_RaimundoSilva_2026.pdf",
        status: "CONFIRMED" as const,
        aiConfidence: 0.96,
        extractedData: {
          numeroCAF: "RR-2024-88421",
          titular: "Raimundo Nonato da Silva",
          cpf: "123.456.789-09",
          enquadramentoPronaf: "Grupo A/Familiar",
          validade: "2027-12-31",
        },
        createdAt: now,
        updatedAt: now,
      });

      // Audit log entry
      this.data.auditLogs.push({
        id: "audit-init-01",
        userId: "usr-admin",
        userName: "Administrador FUNDERR",
        userRole: "ADMIN",
        acao: "CRIACAO_PROCESSO_INICIAL",
        entidade: "Proposal",
        entityId: p1.id,
        timestamp: now,
      });

      changed = true;
    }

    if (changed) {
      this.save();
    }
  }

  public transaction<T>(fn: () => T): T {
    this.inTransaction = true;
    try {
      const res = fn();
      this.save();
      return res;
    } finally {
      this.inTransaction = false;
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // --- Sequences & Next Proposal Number AAAA-NNNN ---
  public getNextProposalNumber(year: number = new Date().getFullYear()): string {
    const key = `proposals-${year}`;
    const current = this.data.counters[key] || 0;
    const next = current + 1;
    this.data.counters[key] = next;
    this.save();
    const seqStr = String(next).padStart(4, "0");
    return `${year}-${seqStr}`;
  }

  // --- Audit Logger ---
  public logAudit(log: Omit<AuditLog, "id" | "timestamp">): void {
    const newLog: AuditLog = {
      id: `audit-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.data.auditLogs.unshift(newLog);
    // Keep max 5000 logs in memory
    if (this.data.auditLogs.length > 5000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 5000);
    }
    if (!this.inTransaction) this.save();
  }
}

export const db = new RelationalDatabase();
