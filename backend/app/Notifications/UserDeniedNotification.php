<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class UserDeniedNotification extends Notification
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
            ->subject('Account Status Update - AffiliateHub')
            ->greeting('Hello ' . $userName . ',')
            ->line('Your account application has been reviewed by our team.')
            ->line('Unfortunately, your account could not be approved at this time.')
            ->line('Please contact our support team if you would like more information about this decision.')
            ->action('Contact Support', config('app.frontend_url') . '/support')
            ->salutation('Best regards, AffiliateHub Team');
    }
}
