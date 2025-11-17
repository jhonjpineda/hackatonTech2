import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.logger.setContext('CacheService');
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      const password = this.configService.get<string>('REDIS_PASSWORD');
      const db = this.configService.get<number>('REDIS_DB', 0);

      this.client = createClient({
        socket: {
          host,
          port,
        },
        password: password || undefined,
        database: db,
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        this.logger.log('Redis Client Ready');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error.message);
      this.isConnected = false;
    }
  }

  private async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.logger.log('Redis Client Disconnected');
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
        return keys.length;
      }
      return 0;
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Set TTL for an existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Error setting TTL for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    // If not in cache, get from factory
    this.logger.debug(`Cache miss: ${key}`);
    const value = await factory();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error.message);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error.message);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushAll();
      this.logger.log('Cache cleared');
      return true;
    } catch (error) {
      this.logger.error('Error clearing cache:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const info = await this.client.info();
      return {
        connected: this.isConnected,
        info,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error.message);
      return null;
    }
  }
}
