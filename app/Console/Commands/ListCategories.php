<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Category;

class ListCategories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:list-categories {tenant_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List categories for a tenant (outputs JSON).';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');

        $query = Category::query();
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $cats = $query->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'tenant_id' => $c->tenant_id,
                'name' => $c->name,
                'description' => $c->description,
                'created_at' => optional($c->created_at)->toDateTimeString(),
            ];
        })->toArray();

        $this->line(json_encode($cats, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        return 0;
    }
}
