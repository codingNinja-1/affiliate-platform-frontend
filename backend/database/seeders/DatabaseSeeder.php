<?php

namespace Database\Seeders;

use App\Models\Affiliate;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed a default platform admin for immediate access to admin routes.
        $admin = User::create([
            'uuid' => Str::uuid(),
            'email' => 'admin@example.com',
            'first_name' => 'Platform',
            'last_name' => 'Admin',
            'user_type' => 'admin',
            'phone' => '000-000-0000',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('Admin@123'),
        ]);

        // Create a demo vendor for products
        $vendor_user = User::create([
            'uuid' => Str::uuid(),
            'email' => 'vendor@example.com',
            'first_name' => 'Demo',
            'last_name' => 'Vendor',
            'user_type' => 'vendor',
            'phone' => '000-000-0001',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('Vendor@123'),
        ]);

        // Create vendor profile
        $vendor = Vendor::create([
            'user_id' => $vendor_user->id,
            'business_name' => 'Demo Vendor Co.',
            'business_description' => 'A demo vendor for testing affiliate products',
        ]);

        // Create a demo affiliate
        $affiliate_user = User::create([
            'uuid' => Str::uuid(),
            'email' => 'affiliate@example.com',
            'first_name' => 'Demo',
            'last_name' => 'Affiliate',
            'user_type' => 'affiliate',
            'phone' => '000-000-0002',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('Affiliate@123'),
        ]);

        // Create affiliate profile
        $affiliate = new Affiliate();
        $affiliate->user_id = $affiliate_user->id;
        $affiliate->referral_code = 'AFFILIATE001'; // Set specific code for testing
        $affiliate->save();

        // Create sample products (pre-approved)
        $product1 = new Product();
        $product1->uuid = Str::uuid();
        $product1->product_id = 'PRD-' . mt_rand(100000, 999999);
        $product1->vendor_id = $vendor->id;
        $product1->name = 'Premium Website Template';
        $product1->slug = 'premium-website-template';
        $product1->description = 'A beautiful, responsive website template for businesses';
        $product1->price = 5000;
        $product1->commission_rate = 15;
        $product1->commission_amount = 750;
        $product1->is_active = true;
        $product1->approval_status = 'approved';
        $product1->approved_by = $admin->id;
        $product1->approved_at = now();
        $product1->save();

        $product2 = new Product();
        $product2->uuid = Str::uuid();
        $product2->product_id = 'PRD-' . mt_rand(100000, 999999);
        $product2->vendor_id = $vendor->id;
        $product2->name = 'E-commerce Platform';
        $product2->slug = 'ecommerce-platform';
        $product2->description = 'Complete e-commerce solution with payment integration';
        $product2->price = 15000;
        $product2->commission_rate = 20;
        $product2->commission_amount = 3000;
        $product2->is_active = true;
        $product2->approval_status = 'approved';
        $product2->approved_by = $admin->id;
        $product2->approved_at = now();
        $product2->save();

        $product3 = new Product();
        $product3->uuid = Str::uuid();
        $product3->product_id = 'PRD-' . mt_rand(100000, 999999);
        $product3->vendor_id = $vendor->id;
        $product3->name = 'Mobile App Starter Kit';
        $product3->slug = 'mobile-app-starter-kit';
        $product3->description = 'React Native mobile app template for iOS and Android';
        $product3->price = 8000;
        $product3->commission_rate = 18;
        $product3->commission_amount = 1440;
        $product3->is_active = true;
        $product3->approval_status = 'approved';
        $product3->approved_by = $admin->id;
        $product3->approved_at = now();
        $product3->save();

        $product4 = new Product();
        $product4->uuid = Str::uuid();
        $product4->product_id = 'PRD-' . mt_rand(100000, 999999);
        $product4->vendor_id = $vendor->id;
        $product4->name = 'Cloud API Service';
        $product4->slug = 'cloud-api-service';
        $product4->description = 'Scalable cloud API service for web and mobile applications';
        $product4->price = 12000;
        $product4->commission_rate = 25;
        $product4->commission_amount = 3000;
        $product4->is_active = true;
        $product4->approval_status = 'approved';
        $product4->approved_by = $admin->id;
        $product4->approved_at = now();
        $product4->save();
    }
}
