<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * App\Models\UserLocation
 *
 * @property int $id
 * @property int|null $user_id
 * @property float $lat
 * @property float $lng
 * @property string $location
 * @property bool $is_visible
 * @property \Illuminate\Support\Carbon $last_updated
 * @property User|null $user
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation query()
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation whereLat($value)
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation whereLng($value)
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation whereLocation($value)
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation whereIsVisible($value)
 * @method static \Illuminate\Database\Eloquent\Builder|UserLocation whereLastUpdated($value)
 * @mixin \Illuminate\Database\Eloquent\Model
 */
class UserLocation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'lat',
        'lng',
        'is_visible',
        'last_updated',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'is_visible' => 'boolean',
            'last_updated' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (UserLocation $location): void {
            $location->updatePostGISLocation();
        });

        static::updating(function (UserLocation $location): void {
            if ($location->isDirty(['lat', 'lng'])) {
                $location->updatePostGISLocation();
            }
        });
    }

    /**
     * Update the PostGIS point geometry from lat/lng coordinates.
     */
    protected function updatePostGISLocation(): void
    {
        $this->location = DB::raw("ST_SetSRID(ST_MakePoint({$this->lng}, {$this->lat}), 4326)");
    }

    /**
     * Get the user that owns the location.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
