<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\View\View;

class PropertyController extends Controller
{
    public function index(Request $request): View
    {
        Gate::authorize('viewAny', Property::class);
        $search = trim(
            (string) $request->query('q')
        );

        $properties = Property::query()->visibleTo($request->user())
            ->with('beneficiary')
            ->when(
                $search !== '',
                function ($query) use ($search) {
                    $query->where(
                        function ($query) use ($search) {
                            $query
                                ->whereRaw(
                                    'LOWER(denomination) LIKE ?',
                                    [
                                        '%'.
                                        mb_strtolower($search).
                                        '%',
                                    ]
                                )
                                ->orWhereHas(
                                    'beneficiary',
                                    fn ($query) => $query->whereRaw(
                                        'LOWER(name) LIKE ?',
                                        [
                                            '%'.
                                            mb_strtolower($search).
                                            '%',
                                        ]
                                    )
                                );
                        }
                    );
                }
            )
            ->orderBy('denomination')
            ->paginate(20)
            ->withQueryString();

        return view('properties.index', [
            'properties' => $properties,
            'search' => $search,
        ]);
    }

    public function create(): View
    {
        Gate::authorize('create', Property::class);

        return view('properties.form', [
            'property' => new Property,
        ]);
    }

    public function show(Property $property): View
    {
        Gate::authorize('view', $property);
        $property->load('beneficiary');

        return view('properties.show', [
            'property' => $property,
        ]);
    }

    public function edit(Property $property): View
    {
        Gate::authorize('update', $property);

        return view('properties.form', [
            'property' => $property,
        ]);
    }
}
