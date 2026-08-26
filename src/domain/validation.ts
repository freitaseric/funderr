import { z } from "zod";
import { isValidRoraimaMunicipality, validateCoordinates, validateCPF } from "./calculations";

export const beneficiarySchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    cpf: z
      .string()
      .min(11, "CPF deve conter 11 dígitos")
      .refine(validateCPF, { message: "CPF inválido pelo algoritmo oficial" }),
    telefone: z.string().min(10, "Telefone deve conter DDD e número válido"),
    apelido: z.string().optional(),
    nacionalidade: z.string().default("Brasileira"),
    naturalidade: z.string().optional(),
    estadoCivil: z
      .enum(["SOLTEIRO", "CASADO", "UNIAO_ESTAVEL", "DIVORCIADO", "SEPARADO", "VIUVO"])
      .default("SOLTEIRO"),
    dataNascimento: z.string().optional(),
    profissao: z.string().optional(),
    rg: z.string().optional(),
    escolaridade: z.string().optional(),
    endereco: z.string().optional(),
    dependentes: z.number().int().min(0).default(0),
    conjugeNome: z.string().optional(),
    conjugeRg: z.string().optional(),
    conjugeCpf: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.estadoCivil === "CASADO" || data.estadoCivil === "UNIAO_ESTAVEL") {
        return !!data.conjugeNome && data.conjugeNome.trim().length > 0;
      }
      return true;
    },
    {
      message: "Nome do cônjuge é obrigatório para casados ou união estável",
      path: ["conjugeNome"],
    }
  )
  .refine(
    (data) => {
      if (data.conjugeCpf && data.conjugeCpf.trim().length > 0) {
        return validateCPF(data.conjugeCpf);
      }
      return true;
    },
    {
      message: "CPF do cônjuge inválido",
      path: ["conjugeCpf"],
    }
  )
  .refine(
    (data) => {
      if (data.conjugeCpf && data.cpf) {
        return data.conjugeCpf.replace(/\D/g, "") !== data.cpf.replace(/\D/g, "");
      }
      return true;
    },
    {
      message: "CPF do cônjuge não pode ser igual ao do titular",
      path: ["conjugeCpf"],
    }
  );

export const propertySchema = z
  .object({
    beneficiaryId: z.string().min(1, "Beneficiário é obrigatório"),
    denominacao: z.string().min(2, "Denominação da propriedade é obrigatória"),
    endereco: z.string().min(2, "Endereço ou rota de acesso é obrigatório"),
    municipio: z
      .string()
      .min(2, "Município é obrigatório")
      .refine(isValidRoraimaMunicipality, {
        message: "Município inválido. Deve ser um dos 15 municípios oficiais de Roraima",
      }),
    estado: z.string().default("RR"),
    areaTotal: z.number().positive("Área total deve ser maior que zero"),
    areaDisponivel: z.number().min(0).optional(),
    areaLegal: z.number().min(0).optional(),
    formaOcupacao: z.string().min(1, "Forma de ocupação é obrigatória"),
    tempoExploracao: z.string().optional(),
    modulo: z.string().optional(),
    documentoExistente: z.string().min(1, "Documento fundiário existente é obrigatório"),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    placeId: z.string().optional(),
    confrontacaoNorte: z.string().optional(),
    confrontacaoSul: z.string().optional(),
    confrontacaoLeste: z.string().optional(),
    confrontacaoOeste: z.string().optional(),
    administracao: z.string().optional(),
  })
  .refine(
    (data) => {
      const coord = validateCoordinates(data.latitude, data.longitude);
      return coord.valid;
    },
    {
      message: "Coordenadas geodésicas inválidas. Preencha Latitude e Longitude válidas juntas.",
      path: ["latitude"],
    }
  );

export const proposalSchema = z.object({
  beneficiaryId: z.string().min(1, "Beneficiário é obrigatório"),
  propertyId: z.string().min(1, "Propriedade é obrigatória"),
  data: z.string().min(1, "Data é obrigatória"),
  atividade: z.string().min(2, "Atividade produtiva principal é obrigatória"),
});

export const patrimonyItemSchema = z.object({
  categoria: z.enum([
    "TERRA_COBERTURAS",
    "CONSTRUCOES_CIVIS",
    "ESTRUTURA_AGROPECUARIA",
    "INFRAESTRUTURA",
    "MAQUINAS_EQUIPAMENTOS",
    "SEMOVENTES",
    "OUTROS_BENS_URBANOS",
  ]),
  especificacao: z.string().min(2, "Especificação do item é obrigatória"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.number().positive("Valor unitário deve ser maior que zero"),
});

export const patrimonyDebtSchema = z.object({
  credor: z.string().min(2, "Credor é obrigatório"),
  finalidade: z.string().min(2, "Finalidade é obrigatória"),
  vencimento: z.string().min(4, "Data/ano de vencimento é obrigatória"),
  saldoDevedor: z.number().positive("Saldo devedor deve ser maior que zero"),
});

export const creditLineSchema = z.object({
  codigo: z.string().min(2, "Código é obrigatório"),
  nome: z.string().min(3, "Nome é obrigatório"),
  ativo: z.boolean().default(true),
  tetoFinanciamento: z.number().positive("Teto deve ser maior que zero"),
  taxaJurosAnual: z.number().min(0, "Taxa de juros não pode ser negativa"),
  prazoMaxAnos: z.number().int().min(1, "Prazo máximo deve ser de pelo menos 1 ano"),
  carenciaMaxAnos: z.number().int().min(0, "Carência não pode ser negativa"),
  percentualFinanciavelMax: z.number().min(1).max(100),
  percentualAterPadrao: z.number().min(0).max(10),
  observacoes: z.string().default(""),
});

export const financingScenarioSchema = z.object({
  linhaCreditoId: z.string().min(1, "Selecione uma linha de crédito"),
  valorProposta: z.number().positive("Valor da proposta deve ser maior que zero"),
  percentualFinanciavel: z.number().min(1).max(100),
  percentualAter: z.number().min(0).max(10),
  taxaJurosAnual: z.number().min(0),
  prazoTotalAnos: z.number().int().min(1),
  carenciaAnos: z.number().int().min(0),
  jurosCarencia: z.enum(["PAGAR", "CAPITALIZAR"]),
});
