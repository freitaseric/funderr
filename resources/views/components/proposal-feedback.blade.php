@props(['anchorPrefix' => 'field-'])

@if (session('success'))<div class="alert alert-success" role="status">{{ session('success') }}</div>@endif
@if ($errors->any())
    <div class="alert alert-error" role="alert" aria-live="assertive" tabindex="-1">
        <div>
            <p class="font-semibold">Não foi possível concluir esta etapa.</p>
            <p class="text-sm">Revise os campos destacados abaixo e corrija as orientações exibidas junto a cada um.</p>
            <ul class="mt-2 list-disc pl-5 text-sm">
                @foreach ($errors->messages() as $key => $messages)
                    @php
                        $anchor = match (true) {
                            $key === 'workflow' || $key === 'items' => null,
                            $key === 'guarantor.cpf' => 'guarantor-cpf',
                            $key === 'guarantor.phone' => 'guarantor-phone',
                            str_starts_with($key, 'items.') || str_starts_with($key, 'jobs.') || str_starts_with($key, 'sources.') || str_starts_with($key, 'data.') => 'field-'.str_replace('.', '-', $key),
                            default => $anchorPrefix.str_replace('.', '-', $key),
                        };
                    @endphp
                    @foreach ($messages as $message)
                        <li>@if($anchor)<a class="link link-hover" href="#{{ $anchor }}">{{ $message }}</a>@else{{ $message }}@endif</li>
                    @endforeach
                @endforeach
            </ul>
        </div>
    </div>
@endif
