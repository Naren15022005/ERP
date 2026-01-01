<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\ExternalConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Recibir webhooks de sistemas externos
     * URL: /api/integrations/webhooks/{connection}/receive
     */
    public function receive(Request $request, ExternalConnection $connection)
    {
        Log::info('Webhook recibido', [
            'connection_id' => $connection->id,
            'platform' => $connection->platform_type,
            'headers' => $request->headers->all(),
            'payload' => $request->all(),
        ]);

        try {
            // Verificar firma/autenticación del webhook según plataforma
            if (!$this->verifyWebhook($request, $connection)) {
                return response()->json(['message' => 'Webhook signature invalid'], 403);
            }

            // Procesar el webhook según tipo de evento
            $event = $this->extractEventType($request, $connection->platform_type);
            
            match ($event) {
                'product.created', 'product.updated' => $this->handleProductWebhook($request, $connection),
                'order.created', 'order.updated' => $this->handleOrderWebhook($request, $connection),
                'inventory.updated' => $this->handleInventoryWebhook($request, $connection),
                default => Log::info('Evento de webhook no manejado', ['event' => $event]),
            };

            return response()->json(['message' => 'Webhook processed'], 200);

        } catch (\Exception $e) {
            Log::error('Error procesando webhook', [
                'connection_id' => $connection->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Error processing webhook'], 500);
        }
    }

    protected function verifyWebhook(Request $request, ExternalConnection $connection): bool
    {
        $credentials = $connection->credentials;

        return match ($connection->platform_type) {
            'woocommerce' => $this->verifyWooCommerceWebhook($request, $credentials),
            'shopify' => $this->verifyShopifyWebhook($request, $credentials),
            default => true, // Para custom APIs, implementar según necesidad
        };
    }

    protected function verifyWooCommerceWebhook(Request $request, array $credentials): bool
    {
        $signature = $request->header('X-WC-Webhook-Signature');
        $secret = $credentials['webhook_secret'] ?? '';
        
        if (!$signature || !$secret) {
            return false;
        }

        $expectedSignature = base64_encode(hash_hmac('sha256', $request->getContent(), $secret, true));
        
        return hash_equals($signature, $expectedSignature);
    }

    protected function verifyShopifyWebhook(Request $request, array $credentials): bool
    {
        $hmac = $request->header('X-Shopify-Hmac-Sha256');
        $secret = $credentials['webhook_secret'] ?? $credentials['api_secret_key'] ?? '';
        
        if (!$hmac || !$secret) {
            return false;
        }

        $calculatedHmac = base64_encode(hash_hmac('sha256', $request->getContent(), $secret, true));
        
        return hash_equals($hmac, $calculatedHmac);
    }

    protected function extractEventType(Request $request, string $platform): string
    {
        return match ($platform) {
            'woocommerce' => $request->header('X-WC-Webhook-Topic', 'unknown'),
            'shopify' => $request->header('X-Shopify-Topic', 'unknown'),
            default => $request->input('event', 'unknown'),
        };
    }

    protected function handleProductWebhook(Request $request, ExternalConnection $connection): void
    {
        // Dispatch job para sincronizar este producto específico
        dispatch(new \App\Jobs\Integrations\SyncProductsJob(
            $connection,
            'inbound',
            ['id' => $request->input('id')]
        ));
    }

    protected function handleOrderWebhook(Request $request, ExternalConnection $connection): void
    {
        // Dispatch job para sincronizar esta orden específica
        dispatch(new \App\Jobs\Integrations\SyncOrdersJob(
            $connection,
            'inbound',
            ['id' => $request->input('id')]
        ));
    }

    protected function handleInventoryWebhook(Request $request, ExternalConnection $connection): void
    {
        // Dispatch job para sincronizar inventario
        dispatch(new \App\Jobs\Integrations\SyncInventoryJob(
            $connection,
            'inbound',
            ['id' => $request->input('id')]
        ));
    }
}
