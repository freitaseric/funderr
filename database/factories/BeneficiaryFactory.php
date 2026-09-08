<?php

namespace Database\Factories;

use App\Enums\EducationLevel;
use App\Enums\MaritalStatus;
use App\Models\Beneficiary;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Beneficiary> */
class BeneficiaryFactory extends Factory
{
    protected $model = Beneficiary::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'cpf' => fake('pt_BR')->unique()->cpf(false),
            'phone' => '95991234567',
            'birth_date' => '1990-01-01',
            'place_of_birth' => 'Boa Vista',
            'marital_status' => MaritalStatus::Single,
            'education_level' => EducationLevel::HighSchoolComplete,
            'dependents' => 0,
            'address' => 'Endereço de teste',
        ];
    }
}
