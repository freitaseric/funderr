<?php

namespace App\Http\Controllers;

use App\Enums\ProposalStep;
use App\Models\Proposal;
use App\Models\ProposalDocument;
use App\Services\Proposals\ProposalDocuments;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

class ProposalController extends Controller
{
    public function index(Request $request): View
    {
        Gate::authorize('viewAny', Proposal::class);
        $search = $request->string('q')->trim()->limit(255, '')->toString();
        $proposals = Proposal::query()->visibleTo($request->user())->with(['beneficiary', 'property'])->when($search !== '', function (Builder $query) use ($search): void {
            $query->where(function (Builder $query) use ($search): void {
                $query->where('number', 'like', '%'.$search.'%')->orWhereHas('beneficiary', fn (Builder $beneficiary) => $beneficiary->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%']));
            });
        })->latest('id')->paginate(20)->withQueryString();

        return view('proposals.index', compact('proposals', 'search'));
    }

    public function create(): View
    {
        Gate::authorize('create', Proposal::class);

        return view('proposals.create');
    }

    public function edit(Proposal $proposal, string $step): View
    {
        Gate::authorize('view', $proposal);
        $stage = ProposalStep::tryFrom($step);
        abort_unless($stage, 404);
        $livewireComponent = match ($stage) {
            ProposalStep::Initial => 'proposals.create', ProposalStep::Patrimony => 'proposals.patrimony',
            ProposalStep::Financing => 'proposals.financing', ProposalStep::Identification => 'proposals.identification',
            ProposalStep::CashFlow => 'proposals.cash-flow', ProposalStep::Documents => 'proposals.documents', ProposalStep::Review => 'proposals.review',
        };

        return view('proposals.edit', compact('proposal', 'livewireComponent'));
    }

    public function print(Proposal $proposal, string $document, ProposalDocuments $documents): View
    {
        Gate::authorize('view', $proposal);

        return $documents->render($proposal, $document);
    }

    public function download(Proposal $proposal, ProposalDocument $document): Response
    {
        Gate::authorize('view', $proposal);
        abort_unless($document->proposal_id === $proposal->id, 404);
        abort_unless($document->status->value === 'READY' && Storage::disk($document->disk)->exists($document->path), 404);

        return Storage::disk($document->disk)->download($document->path, $document->original_name ?: basename($document->path), ['Content-Type' => $document->mime_type ?: 'application/octet-stream']);
    }
}
