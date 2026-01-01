<?php

return [
    /*
    Catalog of available modules. Keys are used in frontend and tenant_modules.module_key.
    */
    'catalog' => [
        'dashboard',
        'ventas',
        'caja',
        'products',
        'inventory',
        'roles',
        'users',
        'reportes',
        'purchases',
        'suppliers',
        'accounting',
    ],

    /*
    Default modules by tenant size. These will be enabled when a tenant is created
    unless overridden by business_type rules.
    */
    'defaults' => [
            'size_category' => [
            'microempresa' => ['dashboard', 'products', 'users'],
            'pequena' => ['dashboard', 'ventas', 'products', 'users'],
            'mediana' => ['dashboard', 'ventas', 'products', 'users', 'roles'],
            'grande' => ['dashboard', 'ventas', 'products', 'users', 'roles', 'accounting', 'suppliers', 'purchases'],
            'empresa' => ['dashboard', 'ventas', 'products', 'users', 'roles'],
            'macroempresa' => ['dashboard', 'ventas', 'products', 'users', 'roles', 'accounting'],
            'granempresa' => ['dashboard', 'ventas', 'products', 'users', 'roles', 'accounting', 'suppliers', 'purchases'],
        ],

        /*
        Business type overrides/additions. Keys should be normalized values found in
        `business_type` (you can map more values later).
        */
        'business_type' => [
            'tiendas-de-barrio' => ['ventas', 'caja', 'products'],
            'minimercados' => ['ventas', 'caja', 'products', 'suppliers'],
            'superettes' => ['ventas', 'caja', 'products', 'suppliers', 'purchases'],
            'droguerias' => ['ventas', 'products', 'suppliers'],
            'ferreterias' => ['ventas', 'products', 'suppliers', 'purchases'],
            'papelerias' => ['ventas', 'products'],
            'licoreras' => ['ventas', 'caja', 'products'],
            'tiendas-de-ropa' => ['ventas', 'products', 'suppliers'],
            'tiendas-de-celulares' => ['ventas', 'products', 'suppliers'],
            'restaurantes' => ['ventas', 'caja', 'products'],
            'cafeterias' => ['ventas', 'caja', 'products'],
            'panaderias' => ['ventas', 'caja', 'products'],
            'pizzerias' => ['ventas', 'caja', 'products'],
            'comidas-rapidas' => ['ventas', 'caja', 'products'],
            'heladerias' => ['ventas', 'caja', 'products'],
            'eccomerce' => ['ventas', 'products', 'suppliers', 'reportes'],
        ],
    ],
    /*
    Optional manifests: provide metadata for frontend (icon, route, lazyImportPath)
    */
    'manifests' => [
        'dashboard' => ['title' => 'Dashboard', 'icon' => 'dashboard', 'route' => '/dashboard', 'lazyImportPath' => 'frontend/src/app/features/dashboard/dashboard.component'],
        'ventas' => ['title' => 'Ventas', 'icon' => 'shopping-cart', 'route' => '/ventas', 'lazyImportPath' => 'frontend/src/app/features/ventas/ventas.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32"><path fill="currentColor" d="M30 6V4h-3V2h-2v2h-1c-1.103 0-2 .898-2 2v2c0 1.103.897 2 2 2h4v2h-6v2h3v2h2v-2h1c1.103 0 2-.897 2-2v-2c0-1.102-.897-2-2-2h-4V6zm-6 14v2h2.586L23 25.586l-2.292-2.293a1 1 0 0 0-.706-.293H20a1 1 0 0 0-.706.293L14 28.586L15.414 30l4.587-4.586l2.292 2.293a1 1 0 0 0 1.414 0L28 23.414V26h2v-6zM4 30H2v-5c0-3.86 3.14-7 7-7h6c1.989 0 3.89.85 5.217 2.333l-1.49 1.334A5 5 0 0 0 15 20H9c-2.757 0-5 2.243-5 5zm8-14a7 7 0 1 0 0-14a7 7 0 0 0 0 14m0-12a5 5 0 1 1 0 10a5 5 0 0 1 0-10"/></svg>'],
        'caja' => ['title' => 'Caja Diaria', 'icon' => 'cash', 'route' => '/caja', 'lazyImportPath' => 'frontend/src/app/features/caja/caja.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 15h-2.5a1.503 1.503 0 0 0-1.5 1.5a1.503 1.503 0 0 0 1.5 1.5h1a1.503 1.503 0 0 1 1.5 1.5a1.503 1.503 0 0 1-1.5 1.5H17m2 0v1m0-8v1m-6 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2m12 3.12V9a2 2 0 0 0-2-2h-2"/><path d="M16 10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6m8 0H8m8 0h1m-9 0H7m1 4v.01M8 17v.01m4-3.02V14m0 3v.01"/></g></svg>'],
        'ingresos' => ['title' => 'Ingresos', 'icon' => 'trending-up', 'route' => '/ingresos', 'lazyImportPath' => 'frontend/src/app/features/ingresos/ingresos.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12a3 3 0 1 0 3 3a3 3 0 0 0-3-3m0 4a1 1 0 1 1 1-1a1 1 0 0 1-1 1m-.71-6.29a1 1 0 0 0 .33.21a.94.94 0 0 0 .76 0a1 1 0 0 0 .33-.21L15 7.46A1 1 0 1 0 13.54 6l-.54.59V3a1 1 0 0 0-2 0v3.59L10.46 6A1 1 0 0 0 9 7.46ZM19 15a1 1 0 1 0-1 1a1 1 0 0 0 1-1m1-7h-3a1 1 0 0 0 0 2h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3a1 1 0 0 0 0-2H4a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3M5 15a1 1 0 1 0 1-1a1 1 0 0 0-1 1"/></svg>'],
        'egresos' => ['title' => 'Egresos', 'icon' => 'trending-down', 'route' => '/egresos', 'lazyImportPath' => 'frontend/src/app/features/egresos/egresos.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m10.46 6l.54-.59V9a1 1 0 0 0 2 0V5.41l.54.55A1 1 0 0 0 15 6a1 1 0 0 0 0-1.42l-2.29-2.29a1 1 0 0 0-.33-.21a1 1 0 0 0-.76 0a1 1 0 0 0-.33.21L9 4.54A1 1 0 0 0 10.46 6M12 12a3 3 0 1 0 3 3a3 3 0 0 0-3-3m0 4a1 1 0 1 1 1-1a1 1 0 0 1-1 1m-7-1a1 1 0 1 0 1-1a1 1 0 0 0-1 1m14 0a1 1 0 1 0-1 1a1 1 0 0 0 1-1m1-7h-4a1 1 0 0 0 0 2h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h4a1 1 0 0 0 0-2H4a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3"/></svg>'],
        'products' => ['title' => 'Productos', 'icon' => 'box', 'route' => '/products', 'lazyImportPath' => 'frontend/src/app/features/products/products.component'],
        'inventory' => ['title' => 'Inventario', 'icon' => 'archive', 'route' => '/inventory/products', 'lazyImportPath' => 'frontend/src/app/features/inventory/products-list.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M5 19V5v11.35v-2.125zm0 2q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v8h-2V5H5v14h7v2zm12.35 1l-3.55-3.55l1.425-1.4l2.125 2.125l4.25-4.25L23 16.35zM8 13q.425 0 .713-.288T9 12t-.288-.712T8 11t-.712.288T7 12t.288.713T8 13m0-4q.425 0 .713-.288T9 8t-.288-.712T8 7t-.712.288T7 8t.288.713T8 9m3 4h6v-2h-6zm0-4h6V7h-6z"/></svg>'],
        'roles' => ['title' => 'Roles', 'icon' => 'shield', 'route' => '/roles', 'lazyImportPath' => 'frontend/src/app/features/roles/roles.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2m12-5.5V14a2 2 0 0 1 4 0v1.5"/><rect width="8" height="5" x="13" y="16" rx=".899"/></g></svg>'],
        'users' => ['title' => 'Usuarios', 'icon' => 'users', 'route' => '/users', 'lazyImportPath' => 'frontend/src/app/features/users/users.component'],
        'purchases' => ['title' => 'Compras', 'icon' => 'shopping-bag', 'route' => '/purchases', 'lazyImportPath' => 'frontend/src/app/features/purchases/purchases.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 2048 2048"><path fill="currentColor" d="m1344 2l704 352v785l-128-64V497l-512 256v258l-128 64V753L768 497v227l-128-64V354zm0 640l177-89l-463-265l-211 106zm315-157l182-91l-497-249l-149 75zm-507 654l-128 64v-1l-384 192v455l384-193v144l-448 224L0 1735v-676l576-288l576 288zm-640 710v-455l-384-192v454zm64-566l369-184l-369-185l-369 185zm576-1l448-224l448 224v527l-448 224l-448-224zm384 576v-305l-256-128v305zm384-128v-305l-256 128v305zm-320-288l241-121l-241-120l-241 120z"/></svg>'],
        'suppliers' => ['title' => 'Proveedores', 'icon' => 'truck', 'route' => '/suppliers', 'lazyImportPath' => 'frontend/src/app/features/suppliers/suppliers.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M16.539 20.135L13 18.069v-4.111l3.539-2.068l3.576 2.07v4.101zm-2.197-5.977l2.216 1.279l2.215-1.28l-2.215-1.272zm2.658 4.7l2.23-1.288v-2.724L17 16.191zm-3.116-1.281l2.231 1.306v-2.667l-2.23-1.325zM10 11.384q-1.237 0-2.119-.88T7 8.383t.881-2.118T10 5.385t2.119.88t.881 2.12t-.881 2.118t-2.119.882m-7 7.23V16.97q0-.69.348-1.194t.983-.802q1.217-.592 2.51-.975q1.292-.382 3.159-.382h.235q.092 0 .223.011q-.104.258-.165.505l-.116.484H10q-1.679 0-2.928.344t-2.264.89q-.456.24-.632.504Q4 16.618 4 16.97v.647h6.3q.073.236.179.508t.233.492zm7-8.23q.825 0 1.413-.588T12 8.385t-.587-1.413T10 6.385t-1.412.587T8 8.385t.588 1.412t1.412.588m.3 7.23"/></svg>'],
        'accounting' => ['title' => 'Contabilidad', 'icon' => 'calculator', 'route' => '/accounting', 'lazyImportPath' => 'frontend/src/app/features/accounting/accounting.component'],
        'reportes' => ['title' => 'Reportes', 'icon' => 'chart-bar', 'route' => '/reportes', 'lazyImportPath' => 'frontend/src/app/features/reportes/reportes.component', 'iconSvg' => '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path strokeMiterlimit="5.759" d="M3 3v16a2 2 0 0 0 2 2h16"/><path strokeMiterlimit="5.759" d="m7 14l4-4l4 4l6-6"/><path d="M18 8h3v3"/></g></svg>'],
    ],
];
