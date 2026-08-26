export type UserRole = "ADMIN" | "GESTOR" | "TECNICO" | "CONSULTA" | null;
export type UserStatus = "PENDING" | "ACTIVE" | "DISABLED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type MaritalStatus =
  | "SOLTEIRO"
  | "CASADO"
  | "UNIAO_ESTAVEL"
  | "DIVORCIADO"
  | "SEPARADO"
  | "VIUVO";

export type EducationLevel =
  | "NAO_ALFABETIZADO"
  | "ALFABETIZADO"
  | "FUNDAMENTAL_INCOMPLETO"
  | "FUNDAMENTAL_COMPLETO"
  | "MEDIO_INCOMPLETO"
  | "MEDIO_COMPLETO"
  | "TECNICO"
  | "SUPERIOR_INCOMPLETO"
  | "SUPERIOR_COMPLETO"
  | "POS_GRADUACAO";

export interface Beneficiary {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  apelido?: string;
  nacionalidade?: string;
  naturalidade?: string;
  estadoCivil?: MaritalStatus | string;
  dataNascimento?: string;
  profissao?: string;
  rg?: string;
  escolaridade?: EducationLevel | string;
  endereco?: string;
  dependentes?: number;
  conjugeNome?: string;
  conjugeRg?: string;
  conjugeCpf?: string;
  createdAt: string;
  updatedAt: string;
  references?: BeneficiaryReference[];
}

export interface BeneficiaryReference {
  id: string;
  beneficiaryId: string;
  ordem: number;
  nome: string;
  telefone: string;
  createdAt: string;
  updatedAt: string;
}

export type RoraimaMunicipality =
  | "Alto Alegre"
  | "Amajari"
  | "Boa Vista"
  | "Bonfim"
  | "Cantá"
  | "Caracaraí"
  | "Caroebe"
  | "Iracema"
  | "Mucajaí"
  | "Normandia"
  | "Pacaraima"
  | "Rorainópolis"
  | "São João da Baliza"
  | "São Luiz"
  | "Uiramutã";

export const RORAIMA_MUNICIPALITIES: RoraimaMunicipality[] = [
  "Alto Alegre",
  "Amajari",
  "Boa Vista",
  "Bonfim",
  "Cantá",
  "Caracaraí",
  "Caroebe",
  "Iracema",
  "Mucajaí",
  "Normandia",
  "Pacaraima",
  "Rorainópolis",
  "São João da Baliza",
  "São Luiz",
  "Uiramutã",
];

export interface Property {
  id: string;
  beneficiaryId: string;
  beneficiaryNome?: string;
  denominacao: string;
  endereco: string;
  municipio: RoraimaMunicipality | string;
  estado: string;
  areaTotal: number;
  areaDisponivel?: number;
  areaLegal?: number;
  formaOcupacao: string;
  tempoExploracao?: string;
  modulo?: string;
  documentoExistente: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string;
  confrontacaoNorte?: string;
  confrontacaoSul?: string;
  confrontacaoLeste?: string;
  confrontacaoOeste?: string;
  administracao?: string;
  createdAt: string;
  updatedAt: string;
}

export type StepStatus = "PENDENTE" | "RASCUNHO" | "EM_REVISAO" | "CONCLUIDO";

export interface Proposal {
  id: string;
  numero: string;
  beneficiaryId: string;
  propertyId: string;
  data: string;
  atividade: string;
  status: "EM ELABORAÇÃO" | "EM ANÁLISE" | "APROVADO" | "RECUSADO" | "CONCLUÍDO";
  createdById?: string;
  createdAt: string;
  updatedAt: string;

  // Timestamps of cross-step reviews for cascade synchronization
  patrimonioRevisadoEm?: string | null;
  identificacaoRevisadaEm?: string | null;
  fluxoRevisadoEm?: string | null;
  financiamentoRevisadoEm?: string | null;
}

export type PatrimonyCategory =
  | "TERRA_COBERTURAS"
  | "CONSTRUCOES_CIVIS"
  | "ESTRUTURA_AGROPECUARIA"
  | "INFRAESTRUTURA"
  | "MAQUINAS_EQUIPAMENTOS"
  | "SEMOVENTES"
  | "OUTROS_BENS_URBANOS";

export interface PatrimonyItem {
  id: string;
  proposalId: string;
  categoria: PatrimonyCategory;
  especificacao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatrimonyDebt {
  id: string;
  proposalId: string;
  credor: string;
  finalidade: string;
  vencimento: string;
  saldoDevedor: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalJob {
  id: string;
  proposalId: string;
  categoria: string;
  faseAtual: number;
  faseExpansao: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalUseSource {
  id: string;
  proposalId: string;
  tipo: "USO" | "FONTE";
  categoria: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalIdentification {
  id: string;
  proposalId: string;
  finalidade: string;
  mercado: string;
  faturamentoUltimoAno: number;
  analiseLocalizacao: string;
  consideracoes: string;
  empregosConfirmados: boolean;
  usosFontesConfirmados: boolean;
  status: StepStatus;
  concluidoEm?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CashFlowItemType = "RECEITA" | "CUSTO_VARIAVEL" | "CUSTO_FIXO";

export interface CashFlowItem {
  id: string;
  proposalId: string;
  tipo: CashFlowItemType;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  ano1: number;
  ano2: number;
  ano3: number;
  ano4: number;
  ano5: number;
  ano6: number;
  ano7: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditLine {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  tetoFinanciamento: number;
  taxaJurosAnual: number;
  prazoMaxAnos: number;
  carenciaMaxAnos: number;
  percentualFinanciavelMax: number;
  percentualAterPadrao: number;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancingScenario {
  id: string;
  proposalId: string;
  linhaCreditoId: string;
  linhaCreditoNome: string;
  valorProposta: number;
  percentualFinanciavel: number;
  valorFinanciado: number;
  percentualAter: number;
  valorAter: number;
  valorProjeto: number;
  taxaJurosAnual: number;
  prazoTotalAnos: number;
  carenciaAnos: number;
  numeroParcelas: number;
  periodicidade: "ANUAL" | "SEMESTRAL" | "MENSAL";
  jurosCarencia: "PAGAR" | "CAPITALIZAR";
  garantiasConfirmadas: boolean;
  cronogramaConfirmado: boolean;
  status: StepStatus;
  concluidoEm?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Guarantee {
  id: string;
  proposalId: string;
  tipo: "AVAL_PESSOAL" | "BEM" | "OUTRA";
  descricao: string;
  garantidorNome?: string;
  garantidorCpf?: string;
  garantidorTelefone?: string;
  valorEstimado?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AmortizationRow {
  ano: number;
  saldoInicial: number;
  juros: number;
  amortizacao: number;
  prestacao: number;
  saldoFinal: number;
}

export type DocumentType =
  | "CPF_RG"
  | "COMPROVANTE_RESIDENCIA"
  | "CERTIDAO_CASAMENTO"
  | "CAF_DAP"
  | "CAR_RORAIMA"
  | "TITULO_TERRA"
  | "ORCAMENTO"
  | "PROJETO_TECNICO"
  | "OUTRO";

export type DocumentStatus = "PROCESSING" | "REVIEW_REQUIRED" | "CONFIRMED" | "FAILED";

export interface ProposalDocument {
  id: string;
  proposalId: string;
  tipo: DocumentType;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storagePath: string;
  status: DocumentStatus;
  extractedData?: Record<string, any>;
  aiConfidence?: number;
  humanConfirmedBy?: string;
  humanConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  acao: string;
  entidade: string;
  entityId: string;
  correlationId: string;
  metadata?: Record<string, any>;
  before?: any;
  after?: any;
  timestamp: string;
}

export interface RemoteConfigFlags {
  documents_ai: boolean;
  realtime_presence: boolean;
  assistant: boolean;
  advanced_maps: boolean;
  new_financing_ui: boolean;
}
