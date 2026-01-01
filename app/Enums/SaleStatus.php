<?php

namespace App\Enums;

enum SaleStatus: string
{
    case DRAFT = 'draft';
    case CONFIRMED = 'confirmed';
    case PAID = 'paid';
    case CANCELLED = 'cancelled';

    /**
     * Get all available statuses.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get valid transitions from current status.
     */
    public function allowedTransitions(): array
    {
        return match($this) {
            self::DRAFT => [self::CONFIRMED, self::CANCELLED],
            self::CONFIRMED => [self::PAID, self::CANCELLED],
            self::PAID => [], // No se puede cambiar una venta pagada
            self::CANCELLED => [], // No se puede reactivar una venta cancelada
        };
    }

    /**
     * Check if transition to new status is allowed.
     */
    public function canTransitionTo(SaleStatus $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions(), true);
    }

    /**
     * Check if status is editable (draft or confirmed only).
     */
    public function isEditable(): bool
    {
        return in_array($this, [self::DRAFT, self::CONFIRMED], true);
    }

    /**
     * Check if status is final (paid or cancelled).
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::PAID, self::CANCELLED], true);
    }
}
