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
