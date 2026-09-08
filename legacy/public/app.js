(() => {
    const digits = value => value.replace(/\D/g, '');
    const validCpf = value => {
        const cpf = digits(value);
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        for (let position = 9; position < 11; position++) {
            let sum = 0;
            for (let index = 0; index < position; index++) sum += Number(cpf[index]) * (position + 1 - index);
            let check = (sum * 10) % 11;
            if (check === 10) check = 0;
            if (check !== Number(cpf[position])) return false;
        }
        return true;
    };
    const applyMask = input => {
        const value = digits(input.value).slice(0, 11);
        if (input.dataset.mask === 'cpf') {
            input.value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            input.setCustomValidity(value === '' || validCpf(value) ? '' : 'Informe um CPF válido.');
        } else {
            input.value = value.length > 10
                ? value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
                : value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            input.setCustomValidity(value === '' || value.length >= 10 ? '' : 'Informe o DDD e o telefone.');
        }
    };
    document.querySelectorAll('[data-mask]').forEach(input => {
        applyMask(input);
        input.addEventListener('input', () => applyMask(input));
    });

    const maritalStatus = document.querySelector('[data-marital-status]');
    const spouseFields = document.querySelector('[data-spouse-fields]');
    if (maritalStatus && spouseFields) {
        const updateSpouseFields = () => {
            const visible = ['CASADO', 'UNIAO_ESTAVEL'].includes(maritalStatus.value);
            spouseFields.hidden = !visible;
            spouseFields.querySelectorAll('input').forEach(input => {
                input.disabled = !visible;
                input.required = visible;
            });
        };
        maritalStatus.addEventListener('change', updateSpouseFields);
        updateSpouseFields();
    }

    const scrollKey = `funderr-scroll:${location.pathname}`;
    const savedScroll = sessionStorage.getItem(scrollKey);
    if (savedScroll !== null) {
        sessionStorage.removeItem(scrollKey);
        requestAnimationFrame(() => scrollTo({top: Number(savedScroll), behavior: 'instant'}));
    }
    document.querySelectorAll('form[method="post" i]').forEach(form => {
        form.addEventListener('submit', () => sessionStorage.setItem(scrollKey, String(scrollY)));
    });

    const containers = document.querySelectorAll('[data-presence]');
    if (containers.length === 0) return;

    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrf) return;

    const escape = (value) => {
        const element = document.createElement('span');
        element.textContent = value;
        return element.innerHTML;
    };

    const refresh = async () => {
        const body = new URLSearchParams({_token: csrf, path: location.pathname});
        try {
            const response = await fetch('/presence', {
                method: 'POST', body,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            });
            if (!response.ok) return;
            const {devices} = await response.json();
            const content = devices.length === 0
                ? '<p>Presença desativada neste dispositivo.</p>'
                : `<ul>${devices.map(device => `<li><strong>${escape(device.name)}</strong>${device.is_current ? ' (este dispositivo)' : ''} — ${escape(device.current_path || '/')}</li>`).join('')}</ul>`;
            containers.forEach(container => { container.innerHTML = content; });
        } catch (_) {
            containers.forEach(container => { container.innerHTML = '<p>Presença temporariamente indisponível.</p>'; });
        }
    };

    refresh();
    setInterval(refresh, 10000);
})();
