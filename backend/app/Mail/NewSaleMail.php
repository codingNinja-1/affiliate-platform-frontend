<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Commission;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewSaleMail extends Mailable
{
    use Queueable, SerializesModels;

    public $subject;
    public $body;

    public function __construct(
        public User $user,
        public Commission $commission,
        public ?Product $product = null,
        public ?string $customerEmail = null
    )
    {
        $subjectSetting = Setting::where('key', 'email_template.new_sale.subject')->first();
        $bodySetting = Setting::where('key', 'email_template.new_sale.body')->first();

        $this->subject = $subjectSetting?->value ?? 'New Sale! You Earned a Commission';
        $this->body = $bodySetting?->value ?? '<html><body style="font-family: Arial, sans-serif; padding: 20px;">
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
</body></html>';

        $this->body = $this->replacePlaceholders($this->body);
    }

    private function replacePlaceholders(string $content): string
    {
        return str_replace([
            '{name}',
            '{product_name}',
            '{amount}',
            '{commission}',
            '{customer_email}',
        ], [
            $this->user->first_name . ' ' . $this->user->last_name,
            $this->product?->name ?? 'Unknown Product',
            '₦' . number_format($this->commission->sale_amount ?? 0, 2),
            '₦' . number_format($this->commission->amount, 2),
            $this->customerEmail ?? 'N/A',
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
