import { randomUUID } from "node:crypto";

export interface Beneficiario {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  criadoEm: Date | string;
  apelido: string;
  nacionalidade: string;
  naturalidade: string;
  estadoCivil: string;
  dataNascimento: string;
  profissao: string;
  rg: string;
  escolaridade: string;
  endereco: string;
  dependentes: number | string;
  conjugeNome: string;
  conjugeRg: string;
  conjugeCpf: string;
  atualizadoEm: Date | string;
}

export interface BeneficiarioReferencia {
  id: string;
  beneficiarioId: string;
  ordem: number;
  nome: string;
  telefone: string;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface Propriedade {
  id: string;
  beneficiarioId: string;
  denominacao: string;
  endereco: string;
  municipio: string;
  estado: string;
  areaTotal: number | string;
  areaDisponivel: number | string;
  formaOcupacao: string;
  tempoExploracao: string;
  modulo: string;
  documentoExistente: string;
  latitude: number | string;
  longitude: number | string;
  confrontacaoNorte: string;
  confrontacaoSul: string;
  confrontacaoLeste: string;
  confrontacaoOeste: string;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
  areaLegal: number | string;
  administracao: string;
}

export interface Proposta {
  id: string;
  numero: string;
  beneficiarioId: string;
  data: Date | string;
  atividade: string;
  status: string;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
  propriedadeId: string;
}

export interface PatrimonioLevantamento {
  id: string;
  propostaId: string;
  status: string;
  dividasConfirmadas: boolean;
  concluidoEm: Date | string | null;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface PatrimonioItem {
  id: string;
  propostaId: string;
  categoria: string;
  especificacao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface PatrimonioDivida {
  id: string;
  propostaId: string;
  credor: string;
  finalidade: string;
  vencimento: string;
  saldoDevedor: number;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface PropostaIdentificacao {
  id: string;
  propostaId: string;
  finalidade: string;
  mercado: string;
  faturamentoUltimoAno: number;
  analiseLocalizacao: string;
  consideracoes: string;
  empregosConfirmados: boolean;
  usosFontesConfirmados: boolean;
  status: string;
  patrimonioRevisadoEm: Date | string | null;
  concluidoEm: Date | string | null;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface PropostaEmprego {
  id: string;
  propostaId: string;
  categoria: string;
  faseAtual: number;
  faseExpansao: number;
  total: number;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface PropostaUsoFonte {
  id: string;
  propostaId: string;
  tipo: "USO" | "FONTE";
  categoria: string;
  valor: number;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface FluxoCaixa {
  id: string;
  propostaId: string;
  status: string;
  projecaoConfirmada: boolean;
  identificacaoRevisadaEm: Date | string | null;
  concluidoEm: Date | string | null;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface FluxoCaixaItem {
  id: string;
  propostaId: string;
  tipo: "RECEITA" | "CUSTO_VARIAVEL" | "CUSTO_FIXO";
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
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface LinhaCredito {
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
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface Financiamento {
  id: string;
  propostaId: string;
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
  periodicidade: string;
  jurosCarencia: "PAGAR" | "CAPITALIZAR";
  garantiasConfirmadas: boolean;
  cronogramaConfirmado: boolean;
  status: string;
  fluxoRevisadoEm: Date | string | null;
  concluidoEm: Date | string | null;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export interface FinanciamentoGarantia {
  id: string;
  propostaId: string;
  tipo: "AVAL_PESSOAL" | "BEM" | "OUTRA";
  descricao: string;
  garantidorNome: string;
  garantidorCpf: string;
  garantidorTelefone: string;
  valorEstimado: number;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
}

export class InMemoryDatabase {
  beneficiarios: Beneficiario[] = [];
  referencias: BeneficiarioReferencia[] = [];
  propriedades: Propriedade[] = [];
  propostas: Proposta[] = [];
  patrimonioLevantamentos: PatrimonioLevantamento[] = [];
  patrimonioItens: PatrimonioItem[] = [];
  patrimonioDividas: PatrimonioDivida[] = [];
  propostaIdentificacoes: PropostaIdentificacao[] = [];
  propostaEmpregos: PropostaEmprego[] = [];
  propostaUsosFontes: PropostaUsoFonte[] = [];
  fluxoCaixa: FluxoCaixa[] = [];
  fluxoCaixaItens: FluxoCaixaItem[] = [];
  linhasCredito: LinhaCredito[] = [];
  financiamentos: Financiamento[] = [];
  financiamentoGarantias: FinanciamentoGarantia[] = [];

  constructor() {
    this.seedDefaultLinhasCredito();
    this.seedSampleData();
  }

  private seedDefaultLinhasCredito() {
    const agora = new Date().toISOString();
    this.linhasCredito = [
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
        criadoEm: agora,
        atualizadoEm: agora,
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
        criadoEm: agora,
        atualizadoEm: agora,
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
        criadoEm: agora,
        atualizadoEm: agora,
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
        criadoEm: agora,
        atualizadoEm: agora,
      },
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
        criadoEm: agora,
        atualizadoEm: agora,
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
        criadoEm: agora,
        atualizadoEm: agora,
      },
    ];
  }

  private seedSampleData() {
    const agora = new Date().toISOString();
    const benId = "ben-exemplo-01";
    const propId = "prop-exemplo-01";

    this.beneficiarios.push({
      id: benId,
      nome: "João da Silva Roraima",
      cpf: "12345678909",
      telefone: "95991234567",
      criadoEm: agora,
      apelido: "Seu João",
      nacionalidade: "Brasileira",
      naturalidade: "Boa Vista - RR",
      estadoCivil: "CASADO",
      dataNascimento: "1980-05-15",
      profissao: "Agricultor Familiar",
      rg: "123456 SSP/RR",
      escolaridade: "MEDIO_COMPLETO",
      endereco: "Gleba Cauamé, Lote 45, Zona Rural",
      dependentes: 2,
      conjugeNome: "Maria de Fátima Roraima",
      conjugeRg: "654321 SSP/RR",
      conjugeCpf: "98765432100",
      atualizadoEm: agora,
    });

    this.referencias.push({
      id: randomUUID(),
      beneficiarioId: benId,
      ordem: 1,
      nome: "Sindicato dos Trabalhadores Rurais de Boa Vista",
      telefone: "9536230000",
      criadoEm: agora,
      atualizadoEm: agora,
    });

    this.propriedades.push({
      id: propId,
      beneficiarioId: benId,
      denominacao: "Sítio Boa Esperança",
      endereco: "Vicinal 12, KM 8, Gleba Cauamé",
      municipio: "Boa Vista",
      estado: "RORAIMA",
      areaTotal: 50.0,
      areaDisponivel: 35.0,
      areaLegal: 40.0,
      formaOcupacao: "PROPRIETARIO",
      tempoExploracao: "12 anos",
      modulo: "2 Módulos Fiscais",
      documentoExistente: "TITULO_DEFINITIVO",
      latitude: 2.819722,
      longitude: -60.673333,
      confrontacaoNorte: "Lote 44 de Pedro Santos",
      confrontacaoSul: "Estrada Vicinal 12",
      confrontacaoLeste: "Igarapé Cauamé",
      confrontacaoOeste: "Lote 46 de Ana Costa",
      criadoEm: agora,
      atualizadoEm: agora,
      administracao: "Familiar direta",
    });
  }
}

export const db = new InMemoryDatabase();
