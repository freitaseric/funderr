@props([
    'model' => null,
    'name' => null,
    'value' => '',
    'options' => [],
    'id' => null,
    'placeholder' => 'Selecione',
    'searchPlaceholder' => 'Pesquisar opções',
    'searchModel' => null,
    'live' => false,
    'disabled' => false,
])

@php
    $selectId = $id ?? 'select-'.str_replace(['.', '[', ']'], '-', $model ?? $name ?? uniqid());
    $errorId = $selectId.'-error';
    $selectedOption = collect($options)->first(fn (array $option): bool => (string) $option['value'] === (string) $value);
@endphp

<div
    {{ $attributes->class(['relative']) }}
    x-data="{
        open: false,
        query: '',
        selected: @js((string) $value),
        placeholder: @js($placeholder),
        selectedLabel: @js($selectedOption['label'] ?? $placeholder),
        choose(value, label) {
            this.selected = String(value);
            this.selectedLabel = label;
            this.open = false;
            this.query = '';
            this.$nextTick(() => {
                this.$refs.value.dispatchEvent(new Event('input', { bubbles: true }));
                this.$refs.value.dispatchEvent(new Event('change', { bubbles: true }));
            });
        },
        show() {
            if (@js($disabled)) {
                return;
            }

            this.open = true;
            this.$nextTick(() => this.$refs.search.focus());
        },
    }"
    @click.outside="open = false"
>
    @if ($model)
        <input
            x-ref="value"
            x-model="selected"
            type="hidden"
            wire:model{{ $live ? '.live' : '' }}="{{ $model }}"
        >
    @elseif ($name)
        <input
            x-ref="value"
            x-model="selected"
            type="hidden"
            name="{{ $name }}"
        >
    @endif

    <button
        x-ref="trigger"
        id="{{ $selectId }}"
        type="button"
        class="select flex w-full items-center justify-between gap-3 text-left font-normal"
        aria-invalid="{{ $model && $errors->has($model) ? 'true' : 'false' }}"
        @if($model && $errors->has($model)) aria-describedby="{{ $errorId }}" @endif
        @click="show()"
        @keydown.escape="open = false"
        :aria-expanded="open.toString()"
        aria-haspopup="listbox"
        @disabled($disabled)
    >
        <span class="truncate" :class="selected === '' ? 'text-base-content/60' : ''" x-text="selectedLabel"></span>
    </button>

    <div
        x-show="open"
        x-transition.origin.top
        class="absolute z-30 mt-2 w-full rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
        role="dialog"
        aria-label="{{ $searchPlaceholder }}"
        style="display: none"
    >
        <input
            x-ref="search"
            x-model="query"
            @if ($searchModel)
                wire:model.live.debounce.300ms="{{ $searchModel }}"
            @endif
            type="search"
            class="input input-sm w-full"
            placeholder="{{ $searchPlaceholder }}"
            @keydown.escape.prevent="open = false; $refs.trigger?.focus()"
        >

        <ul class="mt-2 max-h-60 overflow-y-auto" role="listbox" aria-labelledby="{{ $selectId }}">
            @forelse ($options as $option)
                <li x-show="query.trim() === '' || @js(mb_strtolower($option['label'])).includes(query.trim().toLocaleLowerCase('pt-BR'))">
                    <button
                        type="button"
                        class="btn btn-ghost btn-sm flex w-full justify-start text-left font-normal"
                        :class="String(@js((string) $option['value'])) === String(selected) ? 'btn-active' : ''"
                        @click="choose(@js((string) $option['value']), @js($option['label']))"
                        role="option"
                        :aria-selected="(String(@js((string) $option['value'])) === String(selected)).toString()"
                    >
                        {{ $option['label'] }}
                    </button>
                </li>
            @empty
                <li class="px-3 py-2 text-sm text-base-content/60">Nenhum resultado encontrado.</li>
            @endforelse
        </ul>
    </div>
    @if ($model)
        @error($model)<p id="{{ $errorId }}" class="text-sm text-error" role="alert">{{ $message }}</p>@enderror
    @endif
</div>
