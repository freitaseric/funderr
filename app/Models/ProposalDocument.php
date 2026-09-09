<?php

namespace App\Models;

use App\Enums\ProposalDocumentStatus;
use App\Enums\ProposalDocumentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'proposal_id', 'type', 'status', 'disk', 'path', 'original_name', 'mime_type', 'size',
        'sha256', 'version', 'source_revision', 'created_by', 'metadata', 'error_message',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProposalDocumentType::class,
            'status' => ProposalDocumentStatus::class,
            'metadata' => 'array',
            'size' => 'integer',
            'version' => 'integer',
            'source_revision' => 'integer',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isCurrent(): bool
    {
        return $this->source_revision === $this->proposal?->revision && $this->status === ProposalDocumentStatus::Ready;
    }
}
