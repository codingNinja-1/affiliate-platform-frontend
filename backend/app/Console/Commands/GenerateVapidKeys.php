<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\VapidKeyService;
use App\Models\Setting;

class GenerateVapidKeys extends Command
{
    protected $signature = 'vapid:generate';

    protected $description = 'Generate VAPID key pair for web push notifications';

    public function handle()
    {
        $this->info('Generating VAPID keys for web push notifications...');

        try {
            $keys = VapidKeyService::generateKeyPair();

            // Store keys in settings
            Setting::updateOrCreate(
                ['key' => 'vapid_public_key', 'group' => 'push'],
                ['value' => $keys['vapid_public_key'], 'type' => 'text']
            );

            Setting::updateOrCreate(
                ['key' => 'vapid_private_key', 'group' => 'push'],
                ['value' => $keys['vapid_private_key'], 'type' => 'text']
            );

            $this->info('✓ VAPID keys generated and stored successfully');
            $this->line('');
            $this->info('Public Key (save to frontend):');
            $this->line($keys['vapid_public_key']);
            $this->line('');
            $this->info('Private Key (stored securely in backend):');
            $this->line($keys['vapid_private_key']);
            $this->line('');
            $this->warn('WARNING: Keep the private key secure. Do not commit it to version control.');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to generate VAPID keys: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
