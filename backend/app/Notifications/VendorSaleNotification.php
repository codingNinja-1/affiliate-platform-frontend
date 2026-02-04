<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Setting;

class VendorSaleNotification extends Notification
{

    public function __construct(private array $data)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $template = $this->resolvedTemplate($notifiable);

        return (new MailMessage)
            ->subject($template['subject'])
            ->view('emails.sale_vendor', ['body' => $template['body']]);
    }

    public function templateKey(): string
    {
        return 'sale_vendor';
    }

    public function resolvedSubject($notifiable): string
    {
        return $this->resolvedTemplate($notifiable)['subject'];
    }

    public function resolvedTemplate($notifiable): array
    {
        $template = $this->getTemplate($this->templateKey());

        return [
            'subject' => $this->replacePlaceholders($template['subject'], $notifiable),
            'body' => $this->replacePlaceholders($template['body'], $notifiable, true),
        ];
    }

    private function getTemplate(string $key): array
    {
        $subject = Setting::where('key', "email_template.{$key}.subject")->value('value');
        $body = Setting::where('key', "email_template.{$key}.body")->value('value');

        $defaults = app(\App\Http\Controllers\EmailTemplateController::class);
        $default = $defaults?->defaultTemplates[$key] ?? ['subject' => '', 'body' => ''];

        return [
            'subject' => $subject ?? $default['subject'],
            'body' => $body ?? $default['body'],
        ];
    }

    private function replacePlaceholders(string $text, $notifiable, bool $isHtml = false): string
    {
        $replacements = [
            '{name}' => $this->data['name'] ?? ($notifiable->name ?? ''),
            '{product_name}' => $this->data['product_name'] ?? '',
            '{amount}' => $this->data['amount'] ?? '',
            '{commission}' => $this->data['commission'] ?? '',
            '{customer_email}' => $this->data['customer_email'] ?? '',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }
}
