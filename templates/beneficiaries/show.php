<?php

declare(strict_types=1);

use Funderr\Http\View;

$fields = [
    'Nome' => $beneficiary->nome,
    'CPF' => $beneficiary->cpf,
    'Telefone' => $beneficiary->telefone,
    'Apelido' => $beneficiary->apelido,
    'Nacionalidade' => $beneficiary->nacionalidade,
    'Naturalidade' => $beneficiary->naturalidade,
    'Estado civil' => $beneficiary->estadoCivil,
    'Data de nascimento' => $beneficiary->dataNascimento,
    'Profissão' => $beneficiary->profissao,
    'RG' => $beneficiary->rg,
    'Escolaridade' => $beneficiary->escolaridade,
    'Endereço' => $beneficiary->endereco,
    'Dependentes' => $beneficiary->dependentes,
    'Nome do cônjuge' => $beneficiary->conjugeNome,
    'RG do cônjuge' => $beneficiary->conjugeRg,
    'CPF do cônjuge' => $beneficiary->conjugeCpf,
    'Criado em' => $beneficiary->createdAt,
    'Atualizado em' => $beneficiary->updatedAt,
];
$pageTitle = $beneficiary->nome . ' - FUNDERR';
require dirname(__DIR__) . '/_header.php';
?>
    <main>
        <p><a href="/beneficiaries">← Voltar para beneficiários</a></p>
        <h1><?= View::escape($beneficiary->nome) ?></h1>

        <dl>
            <?php foreach ($fields as $label => $value): ?>
                <dt><strong><?= View::escape($label) ?></strong></dt>
                <dd><?= View::escape($value ?? 'Não informado') ?></dd>
            <?php endforeach; ?>
        </dl>
        <h2>Referências pessoais</h2>
        <?php if ($references === []): ?><p>Nenhuma referência informada.</p><?php else: ?><ol><?php foreach ($references as $reference): ?><li><?= View::escape($reference['nome']) ?> — <?= View::escape($reference['telefone']) ?></li><?php endforeach; ?></ol><?php endif; ?>
        <p><a href="/beneficiaries?edit=<?= $beneficiary->id ?>">Editar beneficiário</a></p>
    </main>
<?php require dirname(__DIR__) . '/_footer.php'; ?>
