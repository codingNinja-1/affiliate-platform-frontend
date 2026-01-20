<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AffiliateApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $subject;
    public $body;

    public function __construct(public User $user)
    {
        $subjectSetting = Setting::where('key', 'email_template.affiliate_approved.subject')->first();
        $bodySetting = Setting::where('key', 'email_template.affiliate_approved.body')->first();

        $this->subject = $subjectSetting?->value ?? 'Welcome to AffiliateHub - Your Application Has Been Approved!';
        $this->body = $bodySetting?->value ?? '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
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
</body></html>';

        $this->body = $this->replacePlaceholders($this->body);
    }

    private function replacePlaceholders(string $content): string
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        return str_replace([
            '{name}',
            '{email}',
            '{dashboard_url}',
            '{login_url}',
        ], [
            $this->user->first_name . ' ' . $this->user->last_name,
            $this->user->email,
            $frontendUrl . '/dashboard',
            $frontendUrl . '/login',
        ], $content);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.raw_html',
            with: ['htmlContent' => $this->body],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
