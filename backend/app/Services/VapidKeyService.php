<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class VapidKeyService
{
    /**
     * Generate VAPID key pair for web push notifications
     * Used by openssl to generate EC P-256 key pair
     */
    public static function generateKeyPair(): array
    {
        try {
            // Generate EC P-256 private key
            $privateKey = openssl_pkey_new([
                'private_key_type' => OPENSSL_KEYTYPE_EC,
                'curve_name' => 'prime256v1',
            ]);

            if (!$privateKey) {
                throw new \Exception('Failed to generate private key');
            }

            // Extract private key PEM
            openssl_pkey_export($privateKey, $privateKeyPem);

            // Extract public key
            $keyDetails = openssl_pkey_get_details($privateKey);
            if (!$keyDetails || !isset($keyDetails['key'])) {
                throw new \Exception('Failed to extract public key');
            }

            $publicKeyPem = $keyDetails['key'];

            // Convert to base64url format (removing newlines and padding)
            $privateKeyBase64Url = self::pemToBase64Url($privateKeyPem, 'PRIVATE');
            $publicKeyBase64Url = self::pemToBase64Url($publicKeyPem, 'PUBLIC');

            return [
                'vapid_public_key' => $publicKeyBase64Url,
                'vapid_private_key' => $privateKeyBase64Url,
            ];
        } catch (\Exception $e) {
            Log::error('VAPID key generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Convert PEM format to base64url format for VAPID
     */
    private static function pemToBase64Url(string $pem, string $type): string
    {
        // Extract base64 content from PEM
        $lines = explode("\n", $pem);
        $base64 = '';

        foreach ($lines as $line) {
            if (strpos($line, '-----') !== 0) {
                $base64 .= $line;
            }
        }

        $base64 = base64_decode($base64);

        if ($type === 'PRIVATE') {
            // Extract raw d value from PKCS#8 private key
            $base64 = self::extractPrivateKey($base64);
        } elseif ($type === 'PUBLIC') {
            // Extract raw point from public key
            $base64 = self::extractPublicKey($base64);
        }

        // Convert to base64url (no padding, URL-safe)
        return rtrim(strtr(base64_encode($base64), '+/', '-_'), '=');
    }

    /**
     * Extract raw private key from PKCS#8 DER format
     */
    private static function extractPrivateKey(string $der): string
    {
        // PKCS#8 structure: look for the 32-byte private key
        // For P-256, the private key is 32 bytes
        $length = strlen($der);

        // Scan for the OCTET STRING containing the private key (tag 04)
        for ($i = 0; $i < $length - 32; $i++) {
            if (ord($der[$i]) === 0x04 && ord($der[$i + 1]) === 0x20) {
                return substr($der, $i + 2, 32);
            }
        }

        // Fallback: extract last 32 bytes if pattern not found
        return substr($der, -32);
    }

    /**
     * Extract raw public key point from DER format
     */
    private static function extractPublicKey(string $der): string
    {
        // The public key point for P-256 is 65 bytes (0x04 || X || Y)
        // Look for 0x04 followed by 64 bytes
        $length = strlen($der);

        for ($i = 0; $i < $length - 65; $i++) {
            if (ord($der[$i]) === 0x04 && strlen(substr($der, $i, 65)) === 65) {
                return substr($der, $i, 65);
            }
        }

        // Fallback: extract last 65 bytes
        return substr($der, -65);
    }

    /**
     * Get stored VAPID keys from settings
     */
    public static function getKeys(): array
    {
        $model = app('App\Models\Setting');

        return [
            'public' => $model::firstWhere(['key' => 'vapid_public_key', 'group' => 'push'])?->value,
            'private' => $model::firstWhere(['key' => 'vapid_private_key', 'group' => 'push'])?->value,
        ];
    }

    /**
     * Check if VAPID keys are configured
     */
    public static function hasKeys(): bool
    {
        $keys = self::getKeys();
        return !empty($keys['public']) && !empty($keys['private']);
    }
}
