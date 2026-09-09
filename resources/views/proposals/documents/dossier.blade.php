DOSSIER DA PROPOSTA {{ $proposal->number }}
Revisão: {{ $proposal->revision }}

BENEFICIÁRIO
{{ $proposal->beneficiary->name }} — CPF {{ $proposal->beneficiary->cpf }}

PROPRIEDADE
{{ $proposal->property->denomination }} — {{ $proposal->property->municipality }} / {{ $proposal->property->state }}

PROPOSTA
Atividade: {{ $proposal->activity }}
Finalidade: {{ $proposal->purpose }}
Valor: R$ {{ number_format((float) ($proposal->financing?->proposal_value ?? 0), 2, ',', '.') }}

Este dossier reúne os dados técnicos, o contrato de assistência técnica assinado e os documentos anexados ao processo para impressão e envio manual pelo Núcleo de Crédito.
