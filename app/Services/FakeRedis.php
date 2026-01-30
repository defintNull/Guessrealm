<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Service to emulate a redis istance for the developing without redis
 */
class FakeRedis
{
    protected static string $table = 'fake_redis';

    /* -----------------------------
     * INTERNAL HELPERS
     * ----------------------------- */

    protected static function getRow(string $key)
    {
        $row = DB::table(self::$table)->where('key', $key)->first();

        if (!$row) {
            return null;
        }

        // TTL expired?
        if ($row->expire_at && Carbon::parse($row->expire_at)->isPast()) {
            DB::table(self::$table)->where('key', $key)->delete();
            return null;
        }

        return $row;
    }

    protected static function write(string $key, $value, ?int $ttl = null): void
    {
        DB::table(self::$table)->updateOrInsert(
            ['key' => $key],
            [
                'value' => $value,
                'expire_at' => $ttl ? Carbon::now()->addSeconds($ttl) : null
            ]
        );
    }

    /* -----------------------------
     * STRING COMMANDS
     * ----------------------------- */

    public static function get(string $key): ?string
    {
        return self::getRow($key)?->value;
    }

    public static function set(string $key, string $value, ?int $ttl = null): void
    {
        self::write($key, $value, $ttl);
    }

    public static function del(string $key): void
    {
        DB::table(self::$table)->where('key', $key)->delete();
    }

    public static function exists(string $key): bool
    {
        return self::getRow($key) !== null;
    }

    public static function incr(string $key): int
    {
        $value = (int) (self::get($key) ?? 0);
        $value++;
        self::set($key, $value);
        return $value;
    }

    public static function decr(string $key): int
    {
        $value = (int) (self::get($key) ?? 0);
        $value--;
        self::set($key, $value);
        return $value;
    }

    /* -----------------------------
     * TTL
     * ----------------------------- */

    public static function expire(string $key, int $seconds): void
    {
        $row = self::getRow($key);
        if ($row) {
            self::write($key, $row->value, $seconds);
        }
    }

    /* -----------------------------
     * HASH COMMANDS
     * ----------------------------- */

    public static function hset(string $key, string $field, string $value): void
    {
        $hash = json_decode(self::get($key) ?? '{}', true);
        $hash[$field] = $value;
        self::set($key, json_encode($hash));
    }

    public static function hget(string $key, string $field): ?string
    {
        $hash = json_decode(self::get($key) ?? '{}', true);
        return $hash[$field] ?? null;
    }

    public static function hgetall(string $key): array
    {
        return json_decode(self::get($key) ?? '{}', true);
    }

    /* -----------------------------
     * SET COMMANDS
     * ----------------------------- */

    public static function sadd(string $key, string $value): void
    {
        $set = json_decode(self::get($key) ?? '[]', true);
        if (!in_array($value, $set)) {
            $set[] = $value;
        }
        self::set($key, json_encode($set));
    }

    public static function srem(string $key, string $value): void
    {
        $set = json_decode(self::get($key) ?? '[]', true);
        $set = array_values(array_filter($set, fn($v) => $v !== $value));
        self::set($key, json_encode($set));
    }

    public static function smembers(string $key): array
    {
        return json_decode(self::get($key) ?? '[]', true);
    }

    /* -----------------------------
     * LIST COMMANDS
     * ----------------------------- */

    public static function lpush(string $key, string $value): void
    {
        $list = json_decode(self::get($key) ?? '[]', true);
        array_unshift($list, $value);
        self::set($key, json_encode($list));
    }

    public static function rpush(string $key, string $value): void
    {
        $list = json_decode(self::get($key) ?? '[]', true);
        $list[] = $value;
        self::set($key, json_encode($list));
    }

    public static function lpop(string $key): ?string
    {
        $list = json_decode(self::get($key) ?? '[]', true);
        $value = array_shift($list);
        self::set($key, json_encode($list));
        return $value;
    }

    public static function rpop(string $key): ?string
    {
        $list = json_decode(self::get($key) ?? '[]', true);
        $value = array_pop($list);
        self::set($key, json_encode($list));
        return $value;
    }

    public static function llen(string $key): int
    {
        return count(json_decode(self::get($key) ?? '[]', true));
    }

    public static function lrange(string $key, int $start, int $stop): array
    {
        $list = json_decode(self::get($key) ?? '[]', true);
        return array_slice($list, $start, $stop - $start + 1);
    }

    /* -----------------------------
     * SORTED SET COMMANDS
     * ----------------------------- */

    public static function zadd(string $key, float $score, string $member): void
    {
        $zset = json_decode(self::get($key) ?? '[]', true);
        $zset[$member] = $score;
        self::set($key, json_encode($zset));
    }

    public static function zrange(string $key, int $start, int $stop): array
    {
        $zset = json_decode(self::get($key) ?? '[]', true);
        asort($zset);
        return array_slice(array_keys($zset), $start, $stop - $start + 1);
    }

    public static function zrevrange(string $key, int $start, int $stop): array
    {
        $zset = json_decode(self::get($key) ?? '[]', true);
        arsort($zset);
        return array_slice(array_keys($zset), $start, $stop - $start + 1);
    }

    public static function zrem(string $key, string $member): void
    {
        $zset = json_decode(self::get($key) ?? '[]', true);
        unset($zset[$member]);
        self::set($key, json_encode($zset));
    }

    public static function zscore(string $key, string $member): ?float
    {
        $zset = json_decode(self::get($key) ?? '[]', true);
        return $zset[$member] ?? null;
    }

    /* -----------------------------
     * KEYS
     * ----------------------------- */

    public static function keys(string $pattern): array
    {
        $pattern = str_replace('*', '%', $pattern);

        return DB::table(self::$table)
            ->where('key', 'LIKE', $pattern)
            ->pluck('key')
            ->toArray();
    }

    /* -----------------------------
     * FLUSH
     * ----------------------------- */

    public static function flushall(): void
    {
        DB::table(self::$table)->truncate();
    }
}
