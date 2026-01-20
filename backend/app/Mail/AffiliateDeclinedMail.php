<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AffiliateDeclinedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $subject;
    public $body;

    public function __construct(
        public User $user,
        public ?string $reason = null
    )
    {
        $subjectSetting = Setting::where('key', 'email_template.affiliate_declined.subject')->first();
        $bodySetting = Setting::where('key', 'email_template.affiliate_declined.body')->first();

        $this->subject = $subjectSetting?->value ?? 'AffiliateHub Application Update';
        $this->body = $bodySetting?->value ?? '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
<h2>Hello {name},</h2>
<p>Thank you for your interest in joining our affiliate program.</p>
<p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
<p><strong>Reason:</strong> {reason}</p>
<p>You are welcome to reapply in the future if your circumstances change.</p>
<p>Thank you for your understanding.</p>
<p>Best regards,<br>The AffiliateHub Team</p>
</body></html>';

        $this->body = $this->replacePlaceholders($this->body);
    }

    private function replacePlaceholders(string $content): string
    {
        return str_replace([
            '{name}',
            '{reason}',
        ], [
            $this->user->first_name . ' ' . $this->user->last_name,
            $this->reason ?? 'Your application does not meet our current criteria.',
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
