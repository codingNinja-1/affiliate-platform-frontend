<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class UpdateAdminEmail extends Command
{
    protected $signature = 'admin:update-email {email}';
    protected $description = 'Update admin user email address';

    public function handle()
    {
        $email = $this->argument('email');

        $admin = User::where('user_type', 'admin')->first();

        if (!$admin) {
            $this->error('No admin user found!');
            return 1;
        }

        $this->info("Current admin email: {$admin->email}");

        $admin->email = $email;
        $admin->save();

        $this->info("Admin email updated to: {$email}");
        return 0;
    }
}
