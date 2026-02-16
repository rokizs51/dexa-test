import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DrizzleService } from '@dexa/database';
import { eq, lt } from 'drizzle-orm';
import { blacklistedTokens } from '@dexa/database/auth/schema';

@Injectable()
export class BlacklistService {
  constructor(private drizzle: DrizzleService) {}

  async addToBlacklist(token: string, expiresAt: Date): Promise<void> {
    await this.drizzle.db.insert(blacklistedTokens).values({
      token,
      expiresAt,
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.drizzle.db
      .select()
      .from(blacklistedTokens)
      .where(eq(blacklistedTokens.token, token))
      .limit(1);
    return result.length > 0;
  }

  async cleanupExpired(): Promise<void> {
    await this.drizzle.db
      .delete(blacklistedTokens)
      .where(lt(blacklistedTokens.expiresAt, new Date()));
  }
}
