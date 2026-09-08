<?php

namespace Tests\Feature;

use App\Actions\IssueTemporaryPassword;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TemporaryPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_senha_aleatoria_expira_e_exige_troca(): void
    {
        $user = User::factory()->create(['must_change_password' => false]);
        $password = app(IssueTemporaryPassword::class)->handle($user);
        $this->assertSame(16, strlen($password));
        $this->assertTrue(Hash::check($password, $user->password));
        $this->post('/login', ['cpf' => $user->cpf, 'password' => $password])->assertRedirect();
        $this->get('/home')->assertRedirect(route('password.change'));
        $this->post('/logout');
        $this->travel(25)->hours();
        $this->postJson('/login', ['cpf' => $user->cpf, 'password' => $password])->assertUnprocessable();
        $this->assertGuest();
    }

    public function test_troca_remove_expiracao(): void
    {
        $user = User::factory()->create();
        $password = app(IssueTemporaryPassword::class)->handle($user);
        $this->actingAs($user)->put('/user/password', [
            'current_password' => $password, 'password' => 'NovaSenhaSegura123!', 'password_confirmation' => 'NovaSenhaSegura123!',
        ])->assertSessionHasNoErrors();
        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertNull($user->fresh()->temporary_password_expires_at);
    }

    public function test_administrador_cria_redefine_e_busca_usuario(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Administrator, 'must_change_password' => false]);
        $cpf = fake('pt_BR')->cpf(false);
        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Técnico de teste', 'cpf' => $cpf, 'email' => '', 'role' => 'tecnico', 'iater_unit' => 'Unidade de teste',
        ])->assertSessionHasNoErrors()->assertSessionHas('temporary_password');
        $password = session('temporary_password');
        $user = User::where('cpf', $cpf)->firstOrFail();
        $this->assertTrue(Hash::check($password, $user->password));
        $this->assertTrue($user->must_change_password);
        $this->assertNotNull($user->temporary_password_expires_at);
        $this->patch(route('admin.users.reset-password', $user))->assertSessionHas('temporary_password');
        $this->assertNotSame($password, session('temporary_password'));
        $this->assertFalse(Hash::check($password, $user->fresh()->password));
        $this->get(route('admin.users.index', ['q' => $cpf]))->assertOk()->assertSee('Técnico de teste')->assertViewHas('users', fn ($users) => $users->total() === 1);
    }

    public function test_rejeita_cpf_invalido_no_cadastro_de_usuario(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Administrator, 'must_change_password' => false]);
        $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'Teste', 'cpf' => '11111111111', 'email' => '', 'role' => 'tecnico',
        ])->assertSessionHasErrors('cpf');
    }

    public function test_sessao_aberta_e_encerrada_quando_senha_temporaria_expira(): void
    {
        $user = User::factory()->create();
        app(IssueTemporaryPassword::class)->handle($user);
        $this->actingAs($user);
        $this->travel(25)->hours();
        $this->get(route('password.change'))->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_redefinicao_revoga_sessoes_no_banco(): void
    {
        $user = User::factory()->create();
        DB::table('sessions')->insert([
            'id' => 'sessao-de-teste', 'user_id' => $user->id,
            'payload' => '', 'last_activity' => now()->timestamp,
        ]);
        config(['session.driver' => 'database']);
        app(IssueTemporaryPassword::class)->handle($user);
        $this->assertDatabaseMissing('sessions', ['id' => 'sessao-de-teste']);
    }

    public function test_comando_cria_administrador_com_senha_temporaria(): void
    {
        $cpf = fake('pt_BR')->cpf(false);
        $this->artisan('funderr:create-admin')
            ->expectsQuestion('Nome', 'Administrador de teste')
            ->expectsQuestion('CPF', $cpf)
            ->expectsQuestion('E-mail (opcional)', '')
            ->assertSuccessful();
        $user = User::where('cpf', $cpf)->firstOrFail();
        $this->assertTrue($user->isAdministrator());
        $this->assertTrue($user->must_change_password);
        $this->assertNotNull($user->temporary_password_expires_at);
        $this->assertFalse(Hash::check(substr($cpf, -5), $user->password));
    }
}
