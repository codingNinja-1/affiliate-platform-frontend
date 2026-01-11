<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class UserApprovedNotification extends Notification
{
    use Queueable;

    private User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $userName = $this->user->first_name ? $this->user->first_name . ' ' . ($this->user->last_name ?? '') : $this->user->email;

        return (new MailMessage)
            ->subject('Account Approved - AffiliateHub')
            ->greeting('Hello ' . $userName . ',')
            ->line('Great news! Your account has been approved by our team.')
            ->line('You can now start using all features of the AffiliateHub platform.')
            ->action('Log In to Your Account', config('app.frontend_url') . '/login')
            ->line('If you have any questions, please contact our support team.')
            ->salutation('Best regards, AffiliateHub Team');
    }
}
