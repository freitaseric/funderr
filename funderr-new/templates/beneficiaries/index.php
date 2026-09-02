<?php

declare(strict_types=1);

use Funderr\Http\View;
use Funderr\Http\Csrf;

$pageTitle = 'Beneficiários - FUNDERR';
require dirname(__DIR__) . '/_header.php';
?>
    <main>
        <h1>Beneficiários</h1>
        <?php if ($error !== null): ?>
            <p role="alert">
                <?= View::escape($error) ?>
            </p>
        <?php endif; ?>

        <section>
            <h2><?= isset($values['id']) ? 'Editar beneficiário' : 'Novo beneficiário' ?></h2>

            <form method="post" action="/beneficiaries">
                <?= Csrf::field() ?>
                <input type="hidden" name="id" value="<?= View::escape($values['id'] ?? '') ?>">
                <p>
                    <label for="nome">Nome *</label><br>
                    <input id="nome" name="nome" required minlength="2" value="<?= View::escape($values['nome'] ?? '') ?>">
                </p>
                <p>
                    <label for="cpf">CPF *</label><br>
                    <input id="cpf" name="cpf" required inputmode="numeric" autocomplete="off" data-mask="cpf" maxlength="14" value="<?= View::escape($values['cpf'] ?? '') ?>">
                </p>
                <p>
                    <label for="telefone">Telefone *</label><br>
                    <input id="telefone" name="telefone" required inputmode="tel" data-mask="phone" maxlength="15" value="<?= View::escape($values['telefone'] ?? '') ?>">
                </p>
                <p>
                    <label for="apelido">Apelido</label><br>
                    <input id="apelido" name="apelido" value="<?= View::escape($values['apelido'] ?? '') ?>">
                </p>
                <p>
                    <label for="nacionalidade">Nacionalidade</label><br>
                    <input id="nacionalidade" name="nacionalidade" value="<?= View::escape($values['nacionalidade'] ?? 'Brasileira') ?>">
                </p>
                <p>
                    <label for="naturalidade">Naturalidade</label><br>
                    <input id="naturalidade" name="naturalidade" value="<?= View::escape($values['naturalidade'] ?? '') ?>">
                </p>
                <p>
                    <label for="estadoCivil">Estado civil</label><br>
                    <select id="estadoCivil" name="estadoCivil" data-marital-status>
                        <?php
                        $maritalStatuses = [
                            '' => 'Não informado',
                            'SOLTEIRO' => 'Solteiro(a)',
                            'CASADO' => 'Casado(a)',
                            'UNIAO_ESTAVEL' => 'União estável',
                            'DIVORCIADO' => 'Divorciado(a)',
                            'SEPARADO' => 'Separado(a)',
                            'VIUVO' => 'Viúvo(a)',
                        ];
                        ?>
                        <?php foreach ($maritalStatuses as $maritalStatus => $label): ?>
                            <option value="<?= View::escape($maritalStatus) ?>" <?= ($values['estadoCivil'] ?? '') === $maritalStatus ? 'selected' : '' ?>>
                                <?= View::escape($label) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </p>
                <p>
                    <label for="dataNascimento">Data de nascimento</label><br>
                    <input id="dataNascimento" name="dataNascimento" type="date" value="<?= View::escape($values['dataNascimento'] ?? '') ?>">
                </p>
                <p>
                    <label for="profissao">Profissão</label><br>
                    <input id="profissao" name="profissao" value="<?= View::escape($values['profissao'] ?? '') ?>">
                </p>
                <p>
                    <label for="rg">RG</label><br>
                    <input id="rg" name="rg" value="<?= View::escape($values['rg'] ?? '') ?>">
                </p>
                <p>
                    <label for="escolaridade">Escolaridade</label><br>
                    <select id="escolaridade" name="escolaridade">
                        <?php foreach (['' => 'Não informada', 'SEM_ESCOLARIDADE' => 'Sem escolaridade', 'FUNDAMENTAL_INCOMPLETO' => 'Ensino fundamental incompleto', 'FUNDAMENTAL_COMPLETO' => 'Ensino fundamental completo', 'MEDIO_INCOMPLETO' => 'Ensino médio incompleto', 'MEDIO_COMPLETO' => 'Ensino médio completo', 'SUPERIOR_INCOMPLETO' => 'Ensino superior incompleto', 'SUPERIOR_COMPLETO' => 'Ensino superior completo', 'POS_GRADUACAO' => 'Pós-graduação'] as $education => $educationLabel): ?>
                            <option value="<?= $education ?>" <?= ($values['escolaridade'] ?? '') === $education ? 'selected' : '' ?>><?= View::escape($educationLabel) ?></option>
                        <?php endforeach; ?>
                    </select>
                </p>
                <p>
                    <label for="endereco">Endereço</label><br>
                    <input id="endereco" name="endereco" value="<?= View::escape($values['endereco'] ?? '') ?>">
                </p>
                <p>
                    <label for="dependentes">Dependentes</label><br>
                    <input id="dependentes" name="dependentes" type="number" min="0" value="<?= View::escape($values['dependentes'] ?? '0') ?>">
                </p>

                <?php $hasSpouse = in_array($values['estadoCivil'] ?? '', ['CASADO', 'UNIAO_ESTAVEL'], true); ?>
                <fieldset data-spouse-fields <?= $hasSpouse ? '' : 'hidden' ?>>
                    <legend>Cônjuge</legend>
                    <p>
                        <label for="conjugeNome">Nome</label><br>
                        <input id="conjugeNome" name="conjugeNome" <?= $hasSpouse ? 'required' : 'disabled' ?> value="<?= View::escape($values['conjugeNome'] ?? '') ?>">
                    </p>
                    <p>
                        <label for="conjugeRg">RG</label><br>
                        <input id="conjugeRg" name="conjugeRg" <?= $hasSpouse ? 'required' : 'disabled' ?> value="<?= View::escape($values['conjugeRg'] ?? '') ?>">
                    </p>
                    <p>
                        <label for="conjugeCpf">CPF</label><br>
                        <input id="conjugeCpf" name="conjugeCpf" inputmode="numeric" data-mask="cpf" maxlength="14" <?= $hasSpouse ? 'required' : 'disabled' ?> value="<?= View::escape($values['conjugeCpf'] ?? '') ?>">
                    </p>
                </fieldset>

                <fieldset>
                    <legend>Referências pessoais</legend>
                    <?php for ($reference = 1; $reference <= 2; $reference++): ?>
                        <p><label>Nome da referência <?= $reference ?> <input name="reference_<?= $reference ?>_name" value="<?= View::escape($values["reference_{$reference}_name"] ?? '') ?>"></label></p>
                        <p><label>Telefone da referência <?= $reference ?> <input name="reference_<?= $reference ?>_phone" inputmode="tel" data-mask="phone" maxlength="15" value="<?= View::escape($values["reference_{$reference}_phone"] ?? '') ?>"></label></p>
                    <?php endfor; ?>
                </fieldset>

                <button type="submit">Salvar beneficiário</button>
            </form>
        </section>

        <section>
            <h2>Beneficiários Cadastrados</h2>

            <?php if ($beneficiaries === []): ?>
                <div class="empty-panel">
                    <strong>Nenhum beneficiário cadastrado</strong>
                    <small>Preencha o formulário acima para adicionar o primeiro beneficiário.</small>
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Telefone</th>
                            <th>Apelido</th>
                            <th>Completude</th>
                            <th>Criado em</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($beneficiaries as $row): $beneficiary = $row['beneficiary']; ?>
                            <tr>
                                <td>
                                    <?= $beneficiary->id ?>
                                </td>
                                <td>
                                    <?= View::escape($beneficiary->nome) ?>
                                </td>
                                <td>
                                    <?= View::escape($beneficiary->cpf) ?>
                                </td>
                                <td>
                                    <?= View::escape($beneficiary->telefone) ?>
                                </td>
                                <td>
                                    <?= View::escape($beneficiary->apelido ?? '') ?>
                                </td>
                                <td><?= $row['percent'] ?>%<?php if ($row['pending'] !== []): ?> — <?= View::escape(implode(', ', $row['pending'])) ?><?php endif; ?></td>
                                <td>
                                    <?= View::escape($beneficiary->createdAt ?? '') ?>
                                </td>
                                <td>
                                    <a href="/beneficiaries/<?= $beneficiary->id ?>">Ver detalhes</a> |
                                    <a href="/beneficiaries?edit=<?= $beneficiary->id ?>">Editar</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </section>
    </main>
<?php require dirname(__DIR__) . '/_footer.php'; ?>
