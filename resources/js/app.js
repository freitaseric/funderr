function maskCpf(input) {
    const position = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value.slice(0, position).replace(/\D/g, '').length;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    input.value = digits.replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
    let cursor = 0;
    let count = 0;
    while (cursor < input.value.length && count < digitsBeforeCursor) {
        if (/\d/.test(input.value[cursor])) count++;
        cursor++;
    }
    input.setSelectionRange(cursor, cursor);
}

document.querySelectorAll('[data-cpf-mask]').forEach((input) => {
    maskCpf(input);
    input.addEventListener('input', () => maskCpf(input));
});

function formatMoneyInput(input, typing = false) {
    let digits;
    if (typing) {
        digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 11) || '0';
    } else {
        const decimal = input.value.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
        digits = decimal.includes('.')
            ? decimal.split('.')[0].replace(/\D/g, '') + decimal.split('.')[1].replace(/\D/g, '').padEnd(2, '0').slice(0, 2)
            : decimal.replace(/\D/g, '') || '0';
        digits = digits.replace(/^0+(?=\d)/, '').slice(0, 11) || '0';
    }
    const cents = digits.padStart(3, '0');
    const integer = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = `R$ ${integer},${cents.slice(-2)}`;
}

window.formatMoneyInput = formatMoneyInput;
