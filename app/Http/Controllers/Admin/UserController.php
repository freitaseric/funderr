<?php

namespace App\Http\Controllers\Admin;

use App\Actions\IssueTemporaryPassword;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\Cpf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(Request $request): View
    {
        $search = trim((string) $request->query('q'));

        $users = User::query()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%']);
                    $digits = preg_replace('/\D/', '', $search);
                    if ($digits !== '') {
                        $query->orWhere('cpf', 'like', '%'.$digits.'%');
                    }
                });
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return view('admin.users.index', compact('users', 'search'));
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'cpf' => preg_replace(
                '/\D/',
                '',
                (string) $request->input('cpf')
            ),
            'email' => $request->filled('email')
                ? trim((string) $request->input('email'))
                : null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'cpf' => [
                'required',
                'string',
                'size:11',
                new Cpf,
                Rule::unique('users', 'cpf'),
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],

            'role' => [
                'required',
                Rule::enum(UserRole::class),
            ],
            'iater_unit' => ['nullable', 'string', 'max:255', Rule::requiredIf($request->input('role') === UserRole::Technician->value)],
        ]);

        $user = new User([
            'name' => $validated['name'],
            'cpf' => $validated['cpf'],
            'email' => $validated['email'],
            'role' => UserRole::from($validated['role']),
            'iater_unit' => $validated['iater_unit'] ?? null,
        ]);

        $temporaryPassword = app(IssueTemporaryPassword::class)->handle($user);

        return redirect()
            ->route('admin.users.index')
            ->with([
                'success' => 'Usuário criado com sucesso.',
                'temporary_password' => $temporaryPassword,
                'temporary_password_user' => $user->name,
            ]);
    }

    public function create(): View
    {
        return view('admin.users.create', [
            'roles' => UserRole::cases(),
        ]);
    }

    public function disable(
        Request $request,
        User $user
    ): RedirectResponse {
        if ($request->user()->is($user)) {
            return back()->withErrors([
                'user' => 'Você não pode desativar sua própria conta.',
            ]);
        }

        $user->forceFill([
            'disabled_at' => now(),
        ])->save();

        $this->invalidateSessions($user);

        return back()->with(
            'success',
            'Usuário desativado com sucesso.'
        );
    }

    private function invalidateSessions(User $user): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::table('sessions')
            ->where('user_id', $user->id)
            ->delete();
    }

    public function enable(User $user): RedirectResponse
    {
        $user->forceFill([
            'disabled_at' => null,
        ])->save();

        return back()->with(
            'success',
            'Usuário reativado com sucesso.'
        );
    }

    public function resetPassword(User $user): RedirectResponse
    {
        $temporaryPassword = app(IssueTemporaryPassword::class)->handle($user);

        return back()->with([
            'success' => 'Senha redefinida com sucesso.',
            'temporary_password' => $temporaryPassword,
            'temporary_password_user' => $user->name,
        ]);
    }
}
