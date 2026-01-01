<?php

namespace App\Services\Integrations;

use App\Models\ExternalConnection;
use App\Services\Integrations\Contracts\IntegrationDriverInterface;
use App\Services\Integrations\Drivers\WooCommerceDriver;
use App\Services\Integrations\Drivers\ShopifyDriver;
use App\Services\Integrations\Drivers\CustomApiDriver;

class IntegrationDriverFactory
{
    protected array $drivers = [
        'woocommerce' => WooCommerceDriver::class,
        'shopify' => ShopifyDriver::class,
        'medusa' => \App\Services\Integrations\Drivers\MedusaDriver::class,
        'strapi_commerce' => \App\Services\Integrations\Drivers\StrapiCommerceDriver::class,
        'graphql' => \App\Services\Integrations\Drivers\GraphQLDriver::class,
        'custom_api' => CustomApiDriver::class,
    ];

    public function make(ExternalConnection $connection): IntegrationDriverInterface
    {
        $platformType = $connection->platform_type;

        if (!isset($this->drivers[$platformType])) {
            throw new \InvalidArgumentException("Driver no soportado: {$platformType}");
        }

        $driverClass = $this->drivers[$platformType];

        return new $driverClass($connection);
    }

    public function getSupportedPlatforms(): array
    {
        return array_keys($this->drivers);
    }

    public function registerDriver(string $platform, string $driverClass): void
    {
        if (!is_subclass_of($driverClass, IntegrationDriverInterface::class)) {
            throw new \InvalidArgumentException("El driver debe implementar IntegrationDriverInterface");
        }

        $this->drivers[$platform] = $driverClass;
    }
}
