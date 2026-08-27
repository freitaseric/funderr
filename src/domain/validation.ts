import { z } from "zod";
import { isValidRoraimaMunicipality, validateCoordinates, validateCPF } from "./calculations";

export const beneficiarySchema = z
  .object({
    id: z.string().optional(),
    nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    cpf: z
      .string()
      .optional()
      .default("")
      .refine((value) => !value.trim() || validateCPF(value), { message: "CPF inválido pelo algoritmo oficial" }),
    telefone: z.string().optional().default("").refine(
      (value) => !value.trim() || value.replace(/\D/g, "").length >= 10,
      { message: "Telefone deve conter DDD e número válido" }
    ),
    apelido: z.string().optional(),
    nacionalidade: z.string().optional(),
    naturalidade: z.string().optional(),
    estadoCivil: z
      .enum(["SOLTEIRO", "CASADO", "UNIAO_ESTAVEL", "DIVORCIADO", "SEPARADO", "VIUVO"])
      .optional()
      .or(z.literal("")),
    dataNascimento: z.string().optional(),
    profissao: z.string().optional(),
    rg: z.string().optional(),
    escolaridade: z.string().optional(),
    endereco: z.string().optional(),
    dependentes: z.number().int().min(0).optional(),
    conjugeNome: z.string().optional(),
    conjugeRg: z.string().optional(),
    conjugeCpf: z.string().optional(),
  })
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
    id: z.string().optional(),
    beneficiaryId: z.string().min(1, "Beneficiário é obrigatório"),
    denominacao: z.string().min(2, "Denominação da propriedade é obrigatória"),
    endereco: z.string().optional().default(""),
    municipio: z
      .union([
        z.literal(""),
        z.string().refine(isValidRoraimaMunicipality, {
          message: "Município inválido. Deve ser um dos 15 municípios oficiais de Roraima",
        }),
      ])
      .optional()
      .default(""),
    estado: z.string().default("RR"),
    areaTotal: z.number().min(0).optional().default(0),
    areaDisponivel: z.number().min(0).optional(),
    areaLegal: z.number().min(0).optional(),
    formaOcupacao: z.string().optional().default(""),
    tempoExploracao: z.string().optional(),
    modulo: z.string().optional(),
    documentoExistente: z.string().optional().default(""),
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

const proposalJobCategories = [
  "ADMINISTRATIVOS",
  "TECNICOS",
  "PRODUTIVOS",
  "OUTROS",
] as const;

export const identificationSchema = z.object({
  finalidade: z.string().optional(),
  mercado: z.string().optional(),
  faturamentoUltimoAno: z.number().min(0, "Faturamento não pode ser negativo").optional(),
  analiseLocalizacao: z.string().optional(),
  consideracoes: z.string().optional(),
  empregosConfirmados: z.boolean().optional(),
  usosFontesConfirmados: z.boolean().optional(),
  jobs: z
    .array(
      z.object({
        categoria: z.enum(proposalJobCategories),
        faseAtual: z.number().int().min(0, "Quantidade atual não pode ser negativa"),
        faseExpansao: z.number().int().min(0, "Expansão não pode ser negativa"),
      })
    )
    .length(4, "Informe as quatro categorias de empregos")
    .refine(
      (jobs) => new Set(jobs.map((job) => job.categoria)).size === proposalJobCategories.length,
      "As quatro categorias de empregos devem ser únicas"
    )
    .optional(),
  usesSources: z
    .array(
      z.object({
        tipo: z.enum(["USO", "FONTE"]),
        categoria: z.string().trim().min(2, "Categoria de uso ou fonte é obrigatória"),
        realizado: z.number().min(0, "Valor realizado não pode ser negativo"),
        aRealizar: z.number().min(0, "Valor a realizar não pode ser negativo"),
      })
    )
    .optional(),
});

export const cashFlowItemSchema = z.object({
  tipo: z.enum(["RECEITA", "CUSTO_VARIAVEL", "CUSTO_FIXO"]),
  descricao: z.string().trim().min(2, "Descrição do item é obrigatória"),
  unidade: z.string().trim().min(1, "Unidade é obrigatória"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.number().positive("Valor unitário deve ser maior que zero"),
  ano2: z.number().min(0, "Valor do ano 2 não pode ser negativo"),
  ano3: z.number().min(0, "Valor do ano 3 não pode ser negativo"),
  ano4: z.number().min(0, "Valor do ano 4 não pode ser negativo"),
  ano5: z.number().min(0, "Valor do ano 5 não pode ser negativo"),
  ano6: z.number().min(0, "Valor do ano 6 não pode ser negativo"),
  ano7: z.number().min(0, "Valor do ano 7 não pode ser negativo"),
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
}).refine((data) => data.carenciaAnos < data.prazoTotalAnos, {
  message: "Carência deve ser menor que o prazo total",
  path: ["carenciaAnos"],
});

export const guaranteeSchema = z
  .object({
    tipo: z.enum(["AVAL_PESSOAL", "BEM", "OUTRA"]),
    descricao: z.string().trim().min(2, "Descrição da garantia é obrigatória"),
    garantidorNome: z.string().trim().optional(),
    garantidorCpf: z.string().optional(),
    garantidorTelefone: z.string().optional(),
    valorEstimado: z.number().positive("Valor estimado deve ser maior que zero").optional(),
  })
  .superRefine((data, context) => {
    if (data.tipo === "AVAL_PESSOAL") {
      if (!data.garantidorNome) {
        context.addIssue({ code: "custom", message: "Nome do avalista é obrigatório", path: ["garantidorNome"] });
      }
      if (!data.garantidorCpf || !validateCPF(data.garantidorCpf)) {
        context.addIssue({ code: "custom", message: "CPF válido do avalista é obrigatório", path: ["garantidorCpf"] });
      }
      if (!data.garantidorTelefone || data.garantidorTelefone.replace(/\D/g, "").length < 10) {
        context.addIssue({ code: "custom", message: "Telefone válido do avalista é obrigatório", path: ["garantidorTelefone"] });
      }
    }
    if (data.tipo === "BEM" && !data.valorEstimado) {
      context.addIssue({ code: "custom", message: "Valor estimado do bem é obrigatório", path: ["valorEstimado"] });
    }
  });
