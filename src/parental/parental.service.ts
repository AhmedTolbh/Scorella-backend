import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentalSettings } from './entities/parental-settings.entity';

export interface UpdateParentalSettingsDto {
  dailyLimitMinutes?: number;
  blockedCategories?: string[];
  restrictedModeEnabled?: boolean;
  commentsDisabled?: boolean;
  sharingDisabled?: boolean;
}

@Injectable()
export class ParentalService {
  constructor(
    @InjectRepository(ParentalSettings)
    private readonly settingsRepository: Repository<ParentalSettings>,
  ) {}

  async getSettings(childUserId: string): Promise<ParentalSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { childUserId },
    });

    if (!settings) {
      // Create default settings
      settings = this.settingsRepository.create({
        childUserId,
        dailyLimitMinutes: 60,
        restrictedModeEnabled: true,
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(
    childUserId: string,
    parentUserId: string,
    dto: UpdateParentalSettingsDto,
  ): Promise<ParentalSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { childUserId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        childUserId,
        parentUserId,
      });
    }

    Object.assign(settings, dto);
    return this.settingsRepository.save(settings);
  }

  async recordWatchTime(
    childUserId: string,
    minutes: number,
  ): Promise<{ allowed: boolean; remainingMinutes: number }> {
    const settings = await this.getSettings(childUserId);

    const today = new Date().toISOString().split('T')[0];
    const lastReset = settings.lastResetDate?.toISOString().split('T')[0];

    if (lastReset !== today) {
      settings.todayWatchedMinutes = 0;
      settings.lastResetDate = new Date();
    }

    settings.todayWatchedMinutes += minutes;
    await this.settingsRepository.save(settings);

    const remaining = settings.dailyLimitMinutes - settings.todayWatchedMinutes;
    return {
      allowed: remaining > 0,
      remainingMinutes: Math.max(0, remaining),
    };
  }

  async checkLimit(childUserId: string): Promise<{
    allowed: boolean;
    remainingMinutes: number;
    limitMinutes: number;
  }> {
    const settings = await this.getSettings(childUserId);

    const today = new Date().toISOString().split('T')[0];
    const lastReset = settings.lastResetDate?.toISOString().split('T')[0];

    let todayWatched = settings.todayWatchedMinutes;
    if (lastReset !== today) {
      todayWatched = 0;
    }

    const remaining = settings.dailyLimitMinutes - todayWatched;
    return {
      allowed: remaining > 0,
      remainingMinutes: Math.max(0, remaining),
      limitMinutes: settings.dailyLimitMinutes,
    };
  }
}
