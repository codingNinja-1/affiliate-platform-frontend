<?php

namespace App\Mail;

use App\Models\Withdrawal;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WithdrawalRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $subject;
    public $body;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Withdrawal $withdrawal,
        public string $reason
    )
    {
        // Load template from database or use default
        $subjectSetting = Setting::where('key', 'email_template.withdrawal_rejected.subject')->first();
        $bodySetting = Setting::where('key', 'email_template.withdrawal_rejected.body')->first();

        $this->subject = $subjectSetting?->value ?? 'Withdrawal Request - Action Required';
        
        $this->body = $bodySetting?->value ?? '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
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
</body></html>';

        // Replace placeholders
        $this->body = $this->replacePlaceholders($this->body);
    }

    private function replacePlaceholders(string $content): string
    {
        return str_replace([
            '{name}',
            '{amount}',
            '{withdrawal_ref}',
            '{reason}',
        ], [
            $this->withdrawal->user->first_name . ' ' . $this->withdrawal->user->last_name,
            '₦' . number_format($this->withdrawal->amount, 2),
            $this->withdrawal->id,
            $this->reason,
        ], $content);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.raw_html',
            with: [
                'htmlContent' => $this->body,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
