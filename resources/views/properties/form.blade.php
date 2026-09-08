<x-layout
    :title="$property->exists
        ? 'Editar propriedade'
        : 'Nova propriedade'
    "
>
    <main class="mx-auto w-full max-w-5xl p-6">

        <livewire:properties.form
            :property="$property"
        />

    </main>
</x-layout>
