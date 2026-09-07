<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class CpfAuthenticationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_autentica_com_cpf_formatado(): void
    {
        $user = User::factory()->create();
        $cpf = substr($user->cpf, 0, 3).'.'.substr($user->cpf, 3, 3).'.'.substr($user->cpf, 6, 3).'-'.substr($user->cpf, 9);

        $this->postJson('/login', ['cpf' => $cpf, 'password' => 'password'])->assertOk();
        $this->assertAuthenticatedAs($user);
    }

    public function test_mascara_nao_permite_contornar_limite_de_login(): void
    {
        $user = User::factory()->create();
        $cpf = substr($user->cpf, 0, 3).'.'.substr($user->cpf, 3, 3).'.'.substr($user->cpf, 6, 3).'-'.substr($user->cpf, 9);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', ['cpf' => $user->cpf, 'password' => 'incorreta'])->assertUnprocessable();
        }

        $this->postJson('/login', ['cpf' => $cpf, 'password' => 'password'])->assertTooManyRequests();
        $this->assertGuest();
    }

    public function test_exibe_formulario_de_login_por_cpf(): void
    {
        $this->get('/login')->assertOk()
            ->assertSee('name="cpf"', false)
            ->assertSee('name="password"', false);
    }

    public function test_visitante_e_redirecionado_para_login(): void
    {
        $this->get('/home')->assertRedirect('/login');
    }

    public function test_login_no_navegador_redireciona_para_pagina_inicial(): void
    {
        $user = User::factory()->create(['must_change_password' => false]);

        $this->post('/login', [
            'cpf' => $user->cpf,
            'password' => 'password',
        ])->assertRedirect('/home');

        $this->assertAuthenticatedAs($user);
        $this->get('/home')->assertOk()->assertSee($user->name);
    }

    public function test_pagina_inicial_escapa_nome_do_usuario(): void
    {
        $user = User::factory()->create([
            'name' => '<script>alert(1)</script>',
            'must_change_password' => false,
        ]);

        $this->actingAs($user)->get('/home')->assertOk()
            ->assertSee($user->name)
            ->assertDontSee($user->name, false);
    }

    public function test_logout_encerra_acesso_a_pagina_protegida(): void
    {
        $user = User::factory()->create(['must_change_password' => false]);

        $this->actingAs($user)->post('/logout')->assertRedirect('/');

        $this->assertGuest();
        $this->get('/home')->assertRedirect('/login');
    }

    public function test_autentica_com_cpf_e_senha_corretos(): void
    {
        $user = User::factory()->create();

        $this->postJson('/login', [
            'cpf' => $user->cpf,
            'password' => 'password',
        ])->assertOk();

        $this->assertAuthenticatedAs($user);
    }

    public function test_retorna_422_para_senha_incorreta(): void
    {
        $user = User::factory()->create();

        $this->postJson('/login', [
            'cpf' => $user->cpf,
            'password' => 'senha-incorreta',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf']);

        $this->assertGuest();
    }

    public function test_retorna_422_para_login_por_email_sem_cpf(): void
    {
        $user = User::factory()->create();

        $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['cpf']);

        $this->assertGuest();
    }

    public function test_retorna_429_apos_cinco_tentativas_de_login_incorretas(): void
    {
        $user = User::factory()->create();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', [
                'cpf' => $user->cpf,
                'password' => 'senha-incorreta',
            ])->assertUnprocessable();
        }

        $this->postJson('/login', [
            'cpf' => $user->cpf,
            'password' => 'password',
        ])->assertTooManyRequests();

        $this->assertGuest();
    }

    #[TestWith(['/register'])]
    #[TestWith(['/forgot-password'])]
    #[TestWith(['/reset-password'])]
    public function test_retorna_404_para_rotas_publicas_desativadas(
        string $path,
    ): void {
        $this->postJson($path, [
            'name' => 'Usuário de teste',
            'email' => 'teste@example.com',
            'password' => 'Senha-de-teste-123!',
            'password_confirmation' => 'Senha-de-teste-123!',
        ])->assertNotFound();

        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }
}
