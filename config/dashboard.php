<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Widget Definitions by Module
    |--------------------------------------------------------------------------
    |
    | Define default widgets for each module. When a tenant activates a module,
    | these widgets will be made available automatically.
    |
    */

    'modules' => [
        'ventas' => [
            'widgets' => ['sales_today', 'sales_week', 'sales_month'],
        ],
        'products' => [
            'widgets' => ['products_total', 'products_low_stock'],
        ],
        'purchases' => [
            'widgets' => ['purchases_month', 'purchases_pending'],
        ],
        'suppliers' => [
            'widgets' => ['suppliers_total'],
        ],
        'clientes' => [
            'widgets' => ['customers_total', 'customers_new'],
        ],
        'inventario' => [
            'widgets' => ['inventory_value', 'inventory_movements'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Widget Catalog
    |--------------------------------------------------------------------------
    |
    | Complete catalog of available widgets with their metadata.
    |
    */

    'widgets' => [
        // Ventas
        'sales_today' => [
            'key' => 'sales_today',
            'name' => 'Ventas del Día',
            'module' => 'ventas',
            'description' => 'Total de ventas realizadas hoy',
            'component' => 'SalesTodayWidget',
            'min_plan' => 'free',
        ],
        'sales_week' => [
            'key' => 'sales_week',
            'name' => 'Ventas de la Semana',
            'module' => 'ventas',
            'description' => 'Total de ventas de los últimos 7 días',
            'component' => 'SalesWeekWidget',
            'min_plan' => 'basic',
        ],
        'sales_month' => [
            'key' => 'sales_month',
            'name' => 'Ventas del Mes',
            'module' => 'ventas',
            'description' => 'Total de ventas del mes actual',
            'component' => 'SalesMonthWidget',
            'min_plan' => 'basic',
        ],

        // Productos
        'products_total' => [
            'key' => 'products_total',
            'name' => 'Total de Productos',
            'module' => 'products',
            'description' => 'Cantidad total de productos en catálogo',
            'component' => 'ProductsTotalWidget',
            'min_plan' => 'free',
        ],
        'products_low_stock' => [
            'key' => 'products_low_stock',
            'name' => 'Productos con Stock Bajo',
            'module' => 'products',
            'description' => 'Productos que necesitan reabastecimiento',
            'component' => 'ProductsLowStockWidget',
            'min_plan' => 'free',
        ],

        // Compras
        'purchases_month' => [
            'key' => 'purchases_month',
            'name' => 'Compras del Mes',
            'module' => 'purchases',
            'description' => 'Total de compras realizadas este mes',
            'component' => 'PurchasesMonthWidget',
            'min_plan' => 'basic',
        ],
        'purchases_pending' => [
            'key' => 'purchases_pending',
            'name' => 'Compras Pendientes',
            'module' => 'purchases',
            'description' => 'Órdenes de compra pendientes de recepción',
            'component' => 'PurchasesPendingWidget',
            'min_plan' => 'basic',
        ],

        // Proveedores
        'suppliers_total' => [
            'key' => 'suppliers_total',
            'name' => 'Total de Proveedores',
            'module' => 'suppliers',
            'description' => 'Cantidad de proveedores activos',
            'component' => 'SuppliersTotalWidget',
            'min_plan' => 'free',
        ],

        // Clientes
        'customers_total' => [
            'key' => 'customers_total',
            'name' => 'Total de Clientes',
            'module' => 'clientes',
            'description' => 'Cantidad de clientes registrados',
            'component' => 'CustomersTotalWidget',
            'min_plan' => 'free',
        ],
        'customers_new' => [
            'key' => 'customers_new',
            'name' => 'Clientes Nuevos',
            'module' => 'clientes',
            'description' => 'Clientes registrados este mes',
            'component' => 'CustomersNewWidget',
            'min_plan' => 'basic',
        ],

        // Inventario
        'inventory_value' => [
            'key' => 'inventory_value',
            'name' => 'Valor del Inventario',
            'module' => 'inventario',
            'description' => 'Valor total del inventario actual',
            'component' => 'InventoryValueWidget',
            'min_plan' => 'pro',
        ],
        'inventory_movements' => [
            'key' => 'inventory_movements',
            'name' => 'Movimientos de Inventario',
            'module' => 'inventario',
            'description' => 'Últimos movimientos de stock',
            'component' => 'InventoryMovementsWidget',
            'min_plan' => 'basic',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Plan Limits
    |--------------------------------------------------------------------------
    |
    | Maximum number of widgets allowed per plan.
    |
    */

    'plan_limits' => [
        'free' => 3,
        'basic' => 6,
        'pro' => 12,
    ],
    /*
    |--------------------------------------------------------------------------
    | Caching
    |--------------------------------------------------------------------------
    |
    | Time-to-live (seconds) for cached widget initial_data values. Short
    | TTL keeps values reasonably fresh while reducing database load.
    |
    */
    'cache_ttl' => 30,
];
