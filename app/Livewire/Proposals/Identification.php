<?php

namespace App\Livewire\Proposals;

use App\Enums\JobCategory;
use App\Enums\PatrimonyCategory;
use App\Enums\ProposalStep;
use App\Models\Proposal;
use App\Services\Proposals\ProposalCalculator;
use Illuminate\View\View;
use Livewire\Attributes\Computed;

class Identification extends StepEditor
{
    public array $data = ['purpose' => '', 'market' => '', 'last_year_revenue' => '0.00', 'location_analysis' => '', 'considerations' => ''];

    public array $jobs = [];

    public array $sources = [];

    public function step(): ProposalStep
    {
        return ProposalStep::Identification;
    }

    protected function loadData(array $data): void
    {
        $this->data = array_replace($this->data, array_intersect_key($data, $this->data));
        $this->data['last_year_revenue'] ??= '0.00';
        $storedJobs = array_column($data['jobs'], null, 'category');
        foreach (JobCategory::cases() as $category) {
            $job = $storedJobs[$category->value] ?? [];
            $this->jobs[$category->value] = [
                'category' => $category->value,
                'current' => $job['current'] ?? 0,
                'expansion' => $job['expansion'] ?? 0,
            ];
        }
        $storedSources = array_column($data['sources'], null, 'category');
        foreach ([...array_column(array_slice(PatrimonyCategory::cases(), 0, 6), 'value'), 'OWN', 'OTHER'] as $category) {
            $this->sources[$category] = $storedSources[$category] ?? ['category' => $category, 'realized' => null, 'planned' => '0.00'];
        }
    }

    #[Computed]
    public function usesSources(): array
    {
        $summary = app(ProposalCalculator::class)->summary($this->proposal);

        return app(ProposalCalculator::class)->usesAndSources($summary['patrimony'], $summary['financing'], $this->sources);
    }

    #[Computed]
    public function employment(): array
    {
        $rows = [];
        foreach ($this->jobs as $key => $job) {
            $rows[$key] = (int) ($job['current'] ?? 0) + (int) ($job['expansion'] ?? 0);
        }

        return ['rows' => $rows, 'total' => array_sum($rows)];
    }

    public function save(bool $complete = false): void
    {
        $data = $this->validatedStep([...$this->data, 'jobs' => $this->jobs, 'sources' => $this->sources], $complete);
        $this->persist($complete, function (Proposal $proposal) use ($data): void {
            $proposal->purpose = $data['purpose'];
            $proposal->identification()->updateOrCreate([], array_intersect_key($data, array_flip(['market', 'last_year_revenue', 'location_analysis', 'considerations'])));
            $proposal->jobs()->delete();
            $proposal->jobs()->createMany(array_values($data['jobs']));
            $proposal->useSources()->delete();
            foreach ($data['sources'] as $source) {
                if ($source['category'] !== 'OTHER') {
                    $source['realized'] = null;
                }
                $proposal->useSources()->create($source);
            }
        });
    }

    public function calculate(): void
    {
        unset($this->usesSources);
    }

    public function render(): View
    {
        return view('livewire.proposals.identification');
    }
}
