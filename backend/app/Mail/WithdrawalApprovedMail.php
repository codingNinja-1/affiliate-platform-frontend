<?php

namespace App\Mail;

use App\Models\Withdrawal;
use App\Models\Setting;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class WithdrawalApprovedMail extends Mailable
{
    public $subject;
    public $body;

    /**
     * Create a new message instance.
     */
    public function __construct(public Withdrawal $withdrawal)
    {
        // Load template from database or use default
        $subjectSetting = Setting::where('key', 'email_template.withdrawal_approved.subject')->first();
        $bodySetting = Setting::where('key', 'email_template.withdrawal_approved.body')->first();

        $this->subject = $subjectSetting?->value ?? 'Your Withdrawal Request Has Been Approved';
        
        $this->body = $bodySetting?->value ?? '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
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
            '{bank_name}',
            '{account_number}',
        ], [
            $this->withdrawal->user->first_name . ' ' . $this->withdrawal->user->last_name,
            '₦' . number_format($this->withdrawal->amount, 2),
            $this->withdrawal->id,
            $this->withdrawal->destination ?? 'N/A',
            $this->withdrawal->destination ?? 'N/A',
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
