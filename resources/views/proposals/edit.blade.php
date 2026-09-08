<x-layout :title="$proposal->number">@livewire($livewireComponent, ['proposal' => $proposal], key($livewireComponent.'-'.$proposal->id))</x-layout>
