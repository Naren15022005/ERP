<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditObserver
{
    protected function log(Model $model, string $event): void
    {
        $user = Auth::user();

        $properties = [
            'ip' => request()?->ip(),
            'user_agent' => request()?->header('User-Agent'),
            'before' => $model->getOriginal(),
            'after' => $model->getAttributes(),
        ];

        activity()
            ->performedOn($model)
            ->causedBy($user)
            ->withProperties($properties)
            ->log($event);
    }

    public function created(Model $model): void
    {
        $this->log($model, 'created');
    }

    public function updated(Model $model): void
    {
        $this->log($model, 'updated');
    }

    public function deleted(Model $model): void
    {
        $this->log($model, 'deleted');
    }

    public function restored(Model $model): void
    {
        $this->log($model, 'restored');
    }

    public function forceDeleted(Model $model): void
    {
        $this->log($model, 'forceDeleted');
    }
}
