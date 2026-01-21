<?php

namespace Database\Seeders;

use App\Models\CurrencyRate;
use Illuminate\Database\Seeder;

class CurrencyRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rates = [
            // NGN to other currencies
            ['from_currency' => 'NGN', 'to_currency' => 'USD', 'rate' => 0.00065, 'description' => 'Nigerian Naira to US Dollar'],
            ['from_currency' => 'NGN', 'to_currency' => 'GBP', 'rate' => 0.00052, 'description' => 'Nigerian Naira to British Pound'],
            ['from_currency' => 'NGN', 'to_currency' => 'EUR', 'rate' => 0.00060, 'description' => 'Nigerian Naira to Euro'],

            // Other currencies to NGN (inverse rates)
            ['from_currency' => 'USD', 'to_currency' => 'NGN', 'rate' => 1550.00, 'description' => 'US Dollar to Nigerian Naira'],
            ['from_currency' => 'GBP', 'to_currency' => 'NGN', 'rate' => 1920.00, 'description' => 'British Pound to Nigerian Naira'],
            ['from_currency' => 'EUR', 'to_currency' => 'NGN', 'rate' => 1680.00, 'description' => 'Euro to Nigerian Naira'],
        ];

        foreach ($rates as $rate) {
            CurrencyRate::updateOrCreate(
                [
                    'from_currency' => $rate['from_currency'],
                    'to_currency' => $rate['to_currency'],
                ],
                [
                    'rate' => $rate['rate'],
                    'is_active' => true,
                    'description' => $rate['description'],
                ]
            );
        }

        $this->command->info('Currency rates seeded successfully!');
    }
}
