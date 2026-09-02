<?php

declare(strict_types=1);

namespace Funderr\Application\Beneficiary;

use DateTimeImmutable;
use Funderr\Application\Exception\ValidationException;
use Funderr\Domain\Beneficiary\Beneficiary;
use Funderr\Domain\Beneficiary\BeneficiaryRepository;

final class BeneficiaryService
{
    public function __construct(
        private readonly BeneficiaryRepository $beneficiaries,
    ) {}

    /** @return list<Beneficiary> */
    public function list(): array
    {
        return $this->beneficiaries->findAll();
    }

    public function find(int $id): ?Beneficiary
    {
        return $this->beneficiaries->findById($id);
    }

    public function references(int $id): array
    {
        return $this->beneficiaries->references($id);
    }

    public function listDetailed(): array
    {
        return array_map(function (Beneficiary $beneficiary): array {
            $required = [
                'nome' => 'Nome', 'cpf' => 'CPF', 'rg' => 'RG', 'telefone' => 'Telefone',
                'endereco' => 'Endereço', 'nacionalidade' => 'Nacionalidade',
                'naturalidade' => 'Naturalidade', 'dataNascimento' => 'Data de nascimento',
                'estadoCivil' => 'Estado civil', 'escolaridade' => 'Escolaridade',
                'profissao' => 'Profissão', 'dependentes' => 'Dependentes',
            ];
            $pending = [];
            foreach ($required as $property => $label) {
                if (($beneficiary->{$property} ?? null) === null || $beneficiary->{$property} === '') $pending[] = $label;
            }
            $references = $this->references((int) $beneficiary->id);
            if ($references === [] || $references[0]['nome'] === '' || $references[0]['telefone'] === '') {
                $pending[] = 'Referência pessoal';
            }
            if (in_array($beneficiary->estadoCivil, ['CASADO', 'UNIAO_ESTAVEL'], true)) {
                if (!$beneficiary->conjugeNome) $pending[] = 'Nome do cônjuge';
                if (!$beneficiary->conjugeRg) $pending[] = 'RG do cônjuge';
                if (!$beneficiary->conjugeCpf) $pending[] = 'CPF do cônjuge';
            }

            $total = count($required) + 1
                + (in_array($beneficiary->estadoCivil, ['CASADO', 'UNIAO_ESTAVEL'], true) ? 3 : 0);

            return [
                'beneficiary' => $beneficiary,
                'pending' => $pending,
                'percent' => (int) round(($total - count($pending)) / $total * 100),
            ];
        }, $this->list());
    }

    public function create(array $data): Beneficiary
    {
        return $this->save($data);
    }

    public function save(array $data): Beneficiary
    {
        $normalized = $this->normalize($data);
        $errors = $this->validate($normalized);

        for ($index = 1; $index <= 2; $index++) {
            $referenceName = isset($data["reference_{$index}_name"]) && is_scalar($data["reference_{$index}_name"])
                ? trim((string) $data["reference_{$index}_name"])
                : '';
            $referencePhone = $this->digits($data["reference_{$index}_phone"] ?? '');
            if (($referenceName !== '' || $referencePhone !== '')
                && ($referenceName === '' || strlen($referencePhone) < 10 || strlen($referencePhone) > 11)) {
                $errors["reference_{$index}"] = "Preencha nome e telefone válidos para a referência {$index}.";
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $id = isset($data['id']) && is_scalar($data['id']) ? (int) $data['id'] : 0;
        $existingCpf = $this->beneficiaries->findByCpf($normalized['cpf']);

        if ($existingCpf !== null && $existingCpf->id !== ($id ?: null)) {
            throw new ValidationException([
                'cpf' => 'Já existe um beneficiário cadastrado com este CPF.',
            ]);
        }

        $existing = $id > 0 ? $this->find($id) : null;
        if ($id > 0 && $existing === null) {
            throw new ValidationException(['id' => 'Beneficiário não encontrado.']);
        }

        $beneficiary = new Beneficiary(
            id: $existing?->id,
            nome: $normalized['nome'],
            cpf: $normalized['cpf'],
            telefone: $normalized['telefone'],
            apelido: $this->nullIfEmpty($normalized['apelido']),
            nacionalidade: $this->nullIfEmpty($normalized['nacionalidade']),
            naturalidade: $this->nullIfEmpty($normalized['naturalidade']),
            estadoCivil: $this->nullIfEmpty($normalized['estadoCivil']),
            dataNascimento: $this->nullIfEmpty($normalized['dataNascimento']),
            profissao: $this->nullIfEmpty($normalized['profissao']),
            rg: $this->nullIfEmpty($normalized['rg']),
            escolaridade: $this->nullIfEmpty($normalized['escolaridade']),
            endereco: $this->nullIfEmpty($normalized['endereco']),
            dependentes: $normalized['dependentes'] === ''
                ? null
                : (int) $normalized['dependentes'],
            conjugeNome: $this->nullIfEmpty($normalized['conjugeNome']),
            conjugeRg: $this->nullIfEmpty($normalized['conjugeRg']),
            conjugeCpf: $this->nullIfEmpty($normalized['conjugeCpf']),
            createdAt: $existing?->createdAt,
            updatedAt: $existing?->updatedAt,
        );

        $saved = $existing === null
            ? $this->beneficiaries->create($beneficiary)
            : $this->beneficiaries->update($beneficiary);

        $references = [];
        for ($index = 1; $index <= 2; $index++) {
            $name = isset($data["reference_{$index}_name"]) && is_scalar($data["reference_{$index}_name"])
                ? trim((string) $data["reference_{$index}_name"])
                : '';
            $phone = $this->digits($data["reference_{$index}_phone"] ?? '');
            if ($name !== '') $references[] = ['nome' => $name, 'telefone' => $phone];
        }
        $this->beneficiaries->replaceReferences((int) $saved->id, $references);

        return $saved;
    }

    /** @return array<string, string> */
    private function normalize(array $data): array
    {
        $fields = [
            'nome',
            'apelido',
            'nacionalidade',
            'naturalidade',
            'estadoCivil',
            'dataNascimento',
            'profissao',
            'rg',
            'escolaridade',
            'endereco',
            'dependentes',
            'conjugeNome',
            'conjugeRg',
        ];

        $normalized = [];

        foreach ($fields as $field) {
            $value = $data[$field] ?? '';
            $normalized[$field] = is_scalar($value) ? trim((string) $value) : '';
        }

        $normalized['cpf'] = $this->digits($data['cpf'] ?? '');
        $normalized['telefone'] = $this->digits($data['telefone'] ?? '');
        $normalized['conjugeCpf'] = $this->digits($data['conjugeCpf'] ?? '');
        $normalized['escolaridade'] = $this->normalizeEducation($normalized['escolaridade']);

        return $normalized;
    }

    /** @param array<string, string> $data
     *  @return array<string, string>
     */
    private function validate(array $data): array
    {
        $errors = [];

        if (mb_strlen($data['nome']) < 2) {
            $errors['nome'] = 'Nome deve ter no mínimo 2 caracteres.';
        }

        if (!$this->isValidCpf($data['cpf'])) {
            $errors['cpf'] = 'CPF inválido pelo algoritmo oficial.';
        }

        $phoneLength = strlen($data['telefone']);

        if ($phoneLength < 10 || $phoneLength > 11) {
            $errors['telefone'] = 'Telefone deve conter DDD e um número válido.';
        }

        $maritalStatuses = [
            '',
            'SOLTEIRO',
            'CASADO',
            'UNIAO_ESTAVEL',
            'DIVORCIADO',
            'SEPARADO',
            'VIUVO',
        ];

        if (!in_array($data['estadoCivil'], $maritalStatuses, true)) {
            $errors['estadoCivil'] = 'Estado civil inválido.';
        }

        $educationLevels = ['', 'SEM_ESCOLARIDADE', 'FUNDAMENTAL_INCOMPLETO', 'FUNDAMENTAL_COMPLETO',
            'MEDIO_INCOMPLETO', 'MEDIO_COMPLETO', 'SUPERIOR_INCOMPLETO', 'SUPERIOR_COMPLETO', 'POS_GRADUACAO'];
        if (!in_array($data['escolaridade'], $educationLevels, true)) {
            $errors['escolaridade'] = 'Escolaridade inválida.';
        }

        if ($data['dataNascimento'] !== '' && !$this->isValidDate($data['dataNascimento'])) {
            $errors['dataNascimento'] = 'Data de nascimento inválida.';
        }

        if (
            $data['dependentes'] !== ''
            && (!ctype_digit($data['dependentes']) || (int) $data['dependentes'] < 0)
        ) {
            $errors['dependentes'] = 'Dependentes deve ser um número inteiro não negativo.';
        }

        if ($data['conjugeCpf'] !== '' && !$this->isValidCpf($data['conjugeCpf'])) {
            $errors['conjugeCpf'] = 'CPF do cônjuge inválido.';
        } elseif ($data['conjugeCpf'] !== '' && $data['conjugeCpf'] === $data['cpf']) {
            $errors['conjugeCpf'] = 'CPF do cônjuge não pode ser igual ao do titular.';
        }

        if (in_array($data['estadoCivil'], ['CASADO', 'UNIAO_ESTAVEL'], true)) {
            if ($data['conjugeNome'] === '') {
                $errors['conjugeNome'] = 'Informe o nome do cônjuge.';
            }
            if ($data['conjugeRg'] === '') {
                $errors['conjugeRg'] = 'Informe o RG do cônjuge.';
            }
            if ($data['conjugeCpf'] === '') {
                $errors['conjugeCpf'] = 'Informe o CPF do cônjuge.';
            }
        }

        return $errors;
    }

    private function digits(mixed $value): string
    {
        if (!is_scalar($value)) {
            return '';
        }

        return preg_replace('/\D/', '', (string) $value) ?? '';
    }

    private function nullIfEmpty(string $value): ?string
    {
        return $value === '' ? null : $value;
    }

    private function isValidDate(string $value): bool
    {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return $date !== false && $date->format('Y-m-d') === $value;
    }

    private function normalizeEducation(string $value): string
    {
        return match (mb_strtolower($value)) {
            'sem escolaridade' => 'SEM_ESCOLARIDADE',
            'fundamental incompleto', 'ensino fundamental incompleto' => 'FUNDAMENTAL_INCOMPLETO',
            'fundamental completo', 'ensino fundamental completo' => 'FUNDAMENTAL_COMPLETO',
            'médio incompleto', 'medio incompleto', 'ensino médio incompleto' => 'MEDIO_INCOMPLETO',
            'médio completo', 'medio completo', 'ensino médio completo' => 'MEDIO_COMPLETO',
            'superior incompleto', 'ensino superior incompleto' => 'SUPERIOR_INCOMPLETO',
            'superior completo', 'ensino superior completo' => 'SUPERIOR_COMPLETO',
            'pós-graduação', 'pos-graduacao' => 'POS_GRADUACAO',
            default => $value,
        };
    }

    private function isValidCpf(string $cpf): bool
    {
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf) === 1) {
            return false;
        }

        for ($digit = 9; $digit < 11; $digit++) {
            $sum = 0;

            for ($index = 0; $index < $digit; $index++) {
                $sum += (int) $cpf[$index] * (($digit + 1) - $index);
            }

            $checkDigit = ($sum * 10) % 11;
            $checkDigit = $checkDigit === 10 ? 0 : $checkDigit;

            if ($checkDigit !== (int) $cpf[$digit]) {
                return false;
            }
        }

        return true;
    }
}
