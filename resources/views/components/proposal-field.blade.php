@props(['model', 'label', 'type' => 'text', 'live' => false, 'step' => '0.01', 'hint' => null, 'money' => false, 'required' => false])
<div class="fieldset">
    @php($errorKey = $errors->has($model) ? $model : (str_starts_with($model, 'data.') ? substr($model, 5) : $model))
    @php($hasError = $errors->has($errorKey))
    @php($fieldId = 'field-'.str_replace('.', '-', $model))
    @php($errorId = $fieldId.'-error')
    <label for="{{ $fieldId }}" class="fieldset-label">{{ $label }} @if($required)<span aria-hidden="true" class="text-error">*</span>@endif</label>
    @if ($type === 'textarea')
        <textarea id="{{ $fieldId }}" wire:model="{{ $model }}" rows="3" aria-invalid="{{ $hasError ? 'true' : 'false' }}" @if($hasError) aria-describedby="{{ $errorId }}" @endif {{ $attributes->class(['textarea w-full', 'textarea-error' => $hasError]) }}></textarea>
    @else
        <input id="{{ $fieldId }}" wire:model{{ $live ? '.live.debounce.400ms' : '' }}="{{ $model }}" type="{{ $money ? 'text' : $type }}"
               aria-invalid="{{ $hasError ? 'true' : 'false' }}" @if($hasError) aria-describedby="{{ $errorId }}" @endif
               @if ($money) data-money-input inputmode="numeric" autocomplete="off" value="{{ old($model, $attributes->get('value', '0')) }}" x-init="formatMoneyInput($el)" x-on:focus="$el.select()" x-on:paste.prevent="$el.value = $event.clipboardData.getData('text'); formatMoneyInput($el); $el.dispatchEvent(new Event('input', { bubbles: true }))" x-on:input.capture="formatMoneyInput($el, true)" @endif
               @if ($type === 'number') step="{{ $step }}" min="0" @endif
               {{ $attributes->class(['input w-full', 'input-error' => $hasError]) }}>
    @endif
    @if ($hint)<p class="text-sm text-base-content/70">{{ $hint }}</p>@elseif($money)<p class="text-sm text-base-content/70">Digite somente os números, incluindo os centavos.</p>@endif
    @if($hasError)<p id="{{ $errorId }}" class="text-sm text-error" role="alert">{{ $errors->first($errorKey) }}</p>@endif
</div>
