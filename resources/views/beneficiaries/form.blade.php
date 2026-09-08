<x-layout :title="$beneficiary->exists
    ? 'Editar beneficiário'
    : 'Novo beneficiário'
">
    <main class="mx-auto w-full max-w-5xl p-6">

        <livewire:beneficiaries.form
            :beneficiary="$beneficiary"
        />

    </main>
</x-layout>
