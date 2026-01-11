<?php

namespace App\Notifications;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PurchaseConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $transaction;
    protected $product;

    /**
     * Create a new notification instance.
     */
    public function __construct(Transaction $transaction)
    {
        $this->transaction = $transaction;
        $this->product = $transaction->product;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = config('app.frontend_url', 'http://192.168.1.134:3000');

        return (new MailMessage)
            ->subject('Payment Confirmation - ' . $this->product->name)
            ->greeting('Hello ' . ($notifiable->first_name ?: 'Customer') . '!')
            ->line('Thank you for your purchase. Your payment has been confirmed.')
            ->line('**Order Details:**')
            ->line('Product: ' . $this->product->name)
            ->line('Amount: ₦' . number_format($this->transaction->amount, 2))
            ->line('Transaction Reference: ' . $this->transaction->transaction_ref)
            ->line('Date: ' . $this->transaction->paid_at->format('F j, Y g:i A'))
            ->line('You will receive additional information about your purchase shortly.')
            ->action('View Purchase', $frontendUrl . '/dashboard')
            ->line('Thank you for your business!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'transaction_id' => $this->transaction->id,
            'transaction_ref' => $this->transaction->transaction_ref,
            'product_name' => $this->product->name,
            'amount' => $this->transaction->amount,
        ];
    }
}
