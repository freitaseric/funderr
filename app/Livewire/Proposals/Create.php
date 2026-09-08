<?php

namespace App\Livewire\Proposals;

use App\Enums\ActivityCategory;
use App\Enums\ProposalStatus;
use App\Enums\ProposalStep;
use App\Models\Beneficiary;
use App\Models\Property;
use App\Models\Proposal;
use App\Services\Proposals\ProposalWorkflow;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Livewire\Attributes\Computed;

class Create extends StepEditor
{
    public array $data = ['beneficiary_id' => '', 'property_id' => '', 'activity' => '', 'purpose' => '', 'iater_unit' => ''];

    public string $search = '';

    public string $propertySearch = '';

    public string $activityCategory = '';

    public string $activityDetail = '';

    public function step(): ProposalStep
    {
        return ProposalStep::Initial;
    }

    public function mount(?Proposal $proposal = null): void
    {
        if ($proposal?->exists) {
            parent::mount($proposal);
        } else {
            Gate::authorize('create', Proposal::class);
            $this->proposalId = 0;
            $this->revision = 0;
            $this->data['iater_unit'] = (string) (auth()->user()->iater_unit ?? '');
        }
    }

    protected function loadData(array $data): void
    {
        $this->data = $data;
        [$this->activityCategory, $this->activityDetail] = $this->parseActivity((string) ($data['activity'] ?? ''));
    }

    public function updatedActivityCategory(): void
    {
        if (! in_array($this->activityDetail, $this->activityDetails(), true)) {
            $this->activityDetail = '';
        }
    }

    /** @return array<int, string> */
    public function activityDetails(): array
    {
        return ActivityCategory::tryFrom($this->activityCategory)?->details() ?? [];
    }

    public function updatedData(mixed $value, ?string $key): void
    {
        if ($key === 'beneficiary_id') {
            $this->data['property_id'] = '';
            $this->propertySearch = '';
        }
    }

    #[Computed]
    public function beneficiaries(): Collection
    {
        $search = mb_substr(trim($this->search), 0, 255);
        $items = Beneficiary::query()->visibleTo(auth()->user())->select(['id', 'name', 'cpf'])->when($search !== '', function (Builder $query) use ($search): void {
            $query->where(function (Builder $query) use ($search): void {
                $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%']);
                $digits = preg_replace('/\D/', '', $search);
                if ($digits !== '') {
                    $query->orWhere('cpf', 'like', '%'.$digits.'%');
                }
            });
        })->when($search !== '', function (Builder $query) use ($search): void {
            $digits = preg_replace('/\D/', '', $search);
            if ($digits !== '') {
                $query->orderByRaw('case when cpf = ? then 0 when cpf like ? then 1 else 2 end', [$digits, $digits.'%']);

                return;
            }

            $normalizedSearch = mb_strtolower($search);
            $query->orderByRaw('case when lower(name) = ? then 0 when lower(name) like ? then 1 else 2 end', [$normalizedSearch, $normalizedSearch.'%']);
        }, function (Builder $query): void {
            $query->latest();
        })->orderBy('name')->limit(20)->get();
        $id = $this->data['beneficiary_id'];
        if (is_scalar($id) && ctype_digit((string) $id) && ! $items->contains('id', (int) $id)) {
            if ($selected = Beneficiary::query()->visibleTo(auth()->user())->find($id)) {
                $items->push($selected);
            }
        }

        return $items;
    }

    #[Computed]
    public function properties(): Collection
    {
        $id = $this->data['beneficiary_id'];

        if (! is_scalar($id) || ! ctype_digit((string) $id) || (int) $id < 1) {
            return Property::query()->whereKey(0)->get();
        }

        $search = mb_substr(trim($this->propertySearch), 0, 255);
        $items = Property::query()->visibleTo(auth()->user())
            ->where('beneficiary_id', (int) $id)
            ->select(['id', 'beneficiary_id', 'denomination', 'municipality'])
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->whereRaw('LOWER(denomination) LIKE ?', ['%'.mb_strtolower($search).'%'])
                        ->orWhereRaw('LOWER(municipality) LIKE ?', ['%'.mb_strtolower($search).'%']);
                });
            })->when($search !== '', function (Builder $query) use ($search): void {
                $normalizedSearch = mb_strtolower($search);
                $query->orderByRaw('case when lower(denomination) = ? then 0 when lower(denomination) like ? then 1 else 2 end', [$normalizedSearch, $normalizedSearch.'%']);
            }, function (Builder $query): void {
                $query->latest();
            })->orderBy('denomination')
            ->limit(20)
            ->get();

        $propertyId = $this->data['property_id'];
        if (is_scalar($propertyId) && ctype_digit((string) $propertyId) && ! $items->contains('id', (int) $propertyId)) {
            $selected = Property::query()->visibleTo(auth()->user())
                ->where('beneficiary_id', (int) $id)
                ->select(['id', 'beneficiary_id', 'denomination', 'municipality'])
                ->find($propertyId);

            if ($selected) {
                $items->push($selected);
            }
        }

        return $items;
    }

    public function save(bool $complete = false): void
    {
        Gate::authorize($this->proposalId ? 'update' : 'create', $this->proposalId ? $this->proposal : Proposal::class);
        $payload = $this->data;
        $payload['activity'] = trim(implode(' — ', array_filter([$this->activityCategoryLabel(), $this->activityDetail]))) ?: (string) ($this->data['activity'] ?? '');
        if ($this->proposalId === 0) {
            $payload['iater_unit'] = (string) (auth()->user()->iater_unit ?? $payload['iater_unit'] ?? '');
        }
        $data = app(ProposalWorkflow::class)->validate($this->step(), $payload, $complete);
        if ($this->proposalId) {
            $this->persist($complete, fn (Proposal $proposal) => $proposal->fill($data)->save());

            return;
        }
        $proposal = DB::transaction(function () use ($data, $complete): Proposal {
            $proposal = Proposal::create([...$data, 'number' => (string) Str::ulid(), 'proposal_date' => today(), 'created_by' => auth()->id(), 'status' => ProposalStatus::Draft, 'current_step' => $complete ? ProposalStep::Patrimony : ProposalStep::Initial, 'completed_steps' => $complete ? [ProposalStep::Initial->value] : []]);
            $proposal->update(['number' => 'FDR-'.today()->year.'-'.str_pad((string) $proposal->id, 6, '0', STR_PAD_LEFT)]);
            $proposal->history()->create(['user_id' => auth()->id(), 'to_status' => ProposalStatus::Draft, 'reason' => 'Proposta criada.']);

            return $proposal;
        });
        $this->redirectRoute('proposals.edit', ['proposal' => $proposal, 'step' => $proposal->current_step->value]);
    }

    public function render(): View
    {
        return view('livewire.proposals.create', ['activityCategories' => ActivityCategory::cases(), 'activityDetails' => $this->activityDetails()]);
    }

    private function activityCategoryLabel(): string
    {
        return ActivityCategory::tryFrom($this->activityCategory)?->label() ?? '';
    }

    /** @return array{0: string, 1: string} */
    private function parseActivity(string $activity): array
    {
        [$category, $detail] = array_pad(array_map('trim', explode('—', $activity, 2)), 2, '');
        foreach (ActivityCategory::cases() as $item) {
            if (mb_strtolower($category) === mb_strtolower($item->label()) || $category === $item->value) {
                return [$item->value, $detail];
            }
        }

        return ['', ''];
    }
}
