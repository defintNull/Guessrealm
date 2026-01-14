<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'surname',
        'username',
        'email',
        'password',
        'profile_picture_path',
        'profile_picture_mime',
        'theme',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'profile_picture_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected function profilePictureUrl(): ?Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->profile_picture_path) {
                    $baseURL = route('user.avatar', ['username' => $this->username]);
                    return $baseURL . "?v=" . $this->updated_at->timestamp;
                }
                return null;
            }
        );
    }

    public function messages(): HasMany
    {
        return $this->hasMany(\App\Models\Message::class);
    }

    public function chats(): BelongsToMany
    {
        return $this->belongsToMany(\App\Models\Chat::class)->withTimestamps();
    }
}
