import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

export class RedisAuthRepository {
  private client: RedisClient;
  public constructor(redisClient: RedisClient) {
    this.client = redisClient;
  }

  async isTokenBlacklisted(token: string) {
    const result = await this.client.get(`blacklist:${token}`);

    if (result !== null) {
      return true;
    }
    
    return false;
  }

  async blacklistToken(token: string, expiresIn: number) {
    await this.client.set(`blacklist:${token}`, 'true', { EX: expiresIn });
  }

  async storeRefreshTokenId(
    userId: string,
    refresh_token_id: string
  ): Promise<void> {
    await this.client.set(`rt:${refresh_token_id}`, userId, { EX: 60 * 10 });
  }

  async findSessionByTokenId(tokenId: string): Promise<string | null> {
    const userId = await this.client.get(`rt:${tokenId}`);

    if (userId) {
      await this.client.del(`rt:${tokenId}`);
      return userId;
    }

    return null;
  }
}
