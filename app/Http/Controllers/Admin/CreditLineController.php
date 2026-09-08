<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditLine;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CreditLineController extends Controller
{
    public function index(Request $request): View
    {
        $search = $request->string('q')->trim()->limit(255, '')->toString();
        $creditLines = CreditLine::query()->when($search !== '', function (Builder $query) use ($search): void {
            $query->where(function (Builder $query) use ($search): void {
                $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%']);
            });
        })->orderBy('name')->paginate(20)->withQueryString();

        return view('admin.credit-lines.index', compact('creditLines', 'search'));
    }

    public function create(): View
    {
        return view('admin.credit-lines.form', ['creditLine' => new CreditLine]);
    }

    public function edit(CreditLine $creditLine): View
    {
        return view('admin.credit-lines.form', compact('creditLine'));
    }
}
