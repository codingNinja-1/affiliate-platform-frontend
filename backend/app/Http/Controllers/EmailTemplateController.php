<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    private $defaultTemplates = [
        'affiliate_approved' => [
            'subject' => 'Welcome to AffiliateHub - Your Application Has Been Approved!',
            'body' => '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h2>Welcome aboard, {name}!</h2>
<p>Great news! Your affiliate application has been approved.</p>
<p>You can now start promoting our products and earning commissions.</p>
<p><strong>Your Account Details:</strong></p>
<ul>
<li>Email: {email}</li>
<li>Dashboard: <a href="{dashboard_url}">{dashboard_url}</a></li>
</ul>
<p><a href="{login_url}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Login to Dashboard</a></p>
<p>If you have any questions, feel free to reach out to our support team.</p>
<p>Best regards,<br>The AffiliateHub Team</p>
</body></html>'
        ],
        'affiliate_declined' => [
            'subject' => 'AffiliateHub Application Update',
            'body' => '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h2>Hello {name},</h2>
<p>Thank you for your interest in joining our affiliate program.</p>
<p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
<p><strong>Reason:</strong> {reason}</p>
<p>You are welcome to reapply in the future if your circumstances change.</p>
<p>Thank you for your understanding.</p>
<p>Best regards,<br>The AffiliateHub Team</p>
</body></html>'
        ],
        'withdrawal_approved' => [
            'subject' => 'Your Withdrawal Request Has Been Approved',
            'body' => '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h2>Hello {name},</h2>
<p>Good news! Your withdrawal request has been approved and is being processed.</p>
<p><strong>Withdrawal Details:</strong></p>
<ul>
<li>Amount: {amount}</li>
<li>Reference: {withdrawal_ref}</li>
<li>Bank: {bank_name}</li>
<li>Account: {account_number}</li>
</ul>
<p>The funds will be transferred to your account within 1-3 business days.</p>
<p>Thank you for being part of AffiliateHub!</p>
<p>Best regards,<br>The AffiliateHub Team</p>
</body></html>'
        ],
        'withdrawal_rejected' => [
            'subject' => 'Withdrawal Request - Action Required',
            'body' => '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h2>Hello {name},</h2>
<p>We regret to inform you that your withdrawal request could not be processed.</p>
<p><strong>Withdrawal Details:</strong></p>
<ul>
<li>Amount: {amount}</li>
<li>Reference: {withdrawal_ref}</li>
</ul>
<p><strong>Reason for Rejection:</strong> {reason}</p>
<p>Please review the reason and feel free to submit a new request after addressing the issue.</p>
<p>If you have any questions, please contact our support team.</p>
<p>Best regards,<br>The AffiliateHub Team</p>
</body></html>'
        ],
        'new_sale' => [
            'subject' => 'New Sale! You Earned a Commission',
            'body' => '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h2>Congratulations {name}!</h2>
<p>You just earned a new commission from a sale!</p>
<p><strong>Sale Details:</strong></p>
<ul>
<li>Product: {product_name}</li>
<li>Sale Amount: {amount}</li>
<li>Your Commission: {commission}</li>
<li>Customer: {customer_email}</li>
</ul>
<p>Keep up the great work! Your commission will be available for withdrawal once the transaction is completed.</p>
<p>Best regards,<br>The AffiliateHub Team</p>
</body></html>'
        ],
        'password_reset' => [
            'subject' => 'Reset Your AffiliateHub Password',
            'body' => '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h2>Hello {name},</h2>
<p>We received a request to reset your password.</p>
<p>Click the button below to reset your password:</p>
<p><a href="{reset_url}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a></p>
<p>This link will expire in {expiry_time}.</p>
<p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
<p>Best regards,<br>The AffiliateHub Team</p>
</body></html>'
        ],
    ];

    public function show(Request $request, $templateKey)
    {
        $settingKey = "email_template.{$templateKey}";

        $subject = Setting::where('key', "{$settingKey}.subject")->first();
        $body = Setting::where('key', "{$settingKey}.body")->first();

        $defaultTemplate = $this->defaultTemplates[$templateKey] ?? [
            'subject' => '',
            'body' => ''
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'subject' => $subject ? $subject->value : $defaultTemplate['subject'],
                'body' => $body ? $body->value : $defaultTemplate['body'],
            ]
        ]);
    }

    public function update(Request $request, $templateKey)
    {
        $validated = $request->validate([
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        $settingKey = "email_template.{$templateKey}";

        Setting::updateOrCreate(
            ['key' => "{$settingKey}.subject"],
            ['value' => $validated['subject']]
        );

        Setting::updateOrCreate(
            ['key' => "{$settingKey}.body"],
            ['value' => $validated['body']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Email template updated successfully'
        ]);
    }
}
