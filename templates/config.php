<?php
use Funderr\Http\Csrf;
use Funderr\Http\View;
$pageTitle = 'Configurações - FUNDERR';
require __DIR__ . '/_header.php';
?>
<main><h1>Preferências deste dispositivo</h1>
    <p class="lead">Estas opções ficam associadas a este navegador e não alteram a experiência dos demais dispositivos.</p>
    <form class="preferences-form" method="post" action="/config"><?= Csrf::field() ?>
        <p>
            <label for="device_name">Nome do dispositivo</label>
            <input id="device_name" name="device_name" maxlength="60" required value="<?= View::escape($preferences['name'] ?? '') ?>">
            <small>Um nome fácil de reconhecer, como “Notebook da análise”.</small>
        </p>
        <label class="preference-option">
            <input type="checkbox" name="new_financing_ui" <?= !empty($preferences['new_financing_ui']) ? 'checked' : '' ?>>
            <span><strong>Experimentar nova interface de financiamento</strong><small>Ativa a nova experiência visual quando ela estiver disponível.</small></span>
        </label>
        <label class="preference-option">
            <input type="checkbox" name="show_presence" <?= !empty($preferences['show_presence']) ? 'checked' : '' ?>>
            <span><strong>Exibir presença em tempo real</strong><small>Permite que este dispositivo veja e seja visto pelos outros dispositivos ativos.</small></span>
        </label>
        <button type="submit">Salvar preferências</button>
    </form>

    <section><h2>Dispositivos ativos</h2><div data-presence><p>Verificando presença…</p></div></section>
</main>
<?php require __DIR__ . '/_footer.php'; ?>
