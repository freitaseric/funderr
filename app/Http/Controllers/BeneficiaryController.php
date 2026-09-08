<?php

namespace App\Http\Controllers;

use App\Models\Beneficiary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\View\View;

class BeneficiaryController extends Controller
{
    public function index(Request $request): View
    {
        Gate::authorize('viewAny', Beneficiary::class);
        $search = trim(
            (string) $request->query('q')
        );

        $beneficiaries = Beneficiary::query()->visibleTo($request->user())
            ->when($search !== '', function ($query) use ($search) {
                $digits = preg_replace(
                    '/\D/',
                    '',
                    $search
                ) ?? '';

                $query->where(function ($query) use (
                    $search,
                    $digits
                ) {
                    $query->whereRaw(
                        'LOWER(name) LIKE ?',
                        [
                            '%'.
                            mb_strtolower($search).
                            '%',
                        ]
                    );

                    if ($digits !== '') {
                        $query->orWhere(
                            'cpf',
                            'like',
                            '%'.$digits.'%'
                        );
                    }
                });
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return view('beneficiaries.index', [
            'beneficiaries' => $beneficiaries,
            'search' => $search,
        ]);
    }

    public function create(): View
    {
        Gate::authorize('create', Beneficiary::class);

        return view('beneficiaries.form', [
            'beneficiary' => new Beneficiary,
        ]);
    }

    public function show(
        Beneficiary $beneficiary
    ): View {
        Gate::authorize('view', $beneficiary);
        $beneficiary->load('references');

        return view('beneficiaries.show', [
            'beneficiary' => $beneficiary,
        ]);
    }

    public function edit(
        Beneficiary $beneficiary
    ): View {
        Gate::authorize('update', $beneficiary);

        return view('beneficiaries.form', [
            'beneficiary' => $beneficiary,
        ]);
    }
}
