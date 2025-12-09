import { Controller, Get, Put, Post, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ParentalService } from './parental.service';

interface UpdateSettingsDto {
  dailyLimitMinutes?: number;
  blockedCategories?: string[];
  restrictedModeEnabled?: boolean;
  commentsDisabled?: boolean;
  sharingDisabled?: boolean;
}

@ApiTags('parental')
@Controller('api/v1/parental')
export class ParentalController {
  constructor(private readonly parentalService: ParentalService) {}

  @Get('settings/:childUserId')
  @ApiOperation({ summary: 'Get parental settings for a child' })
  @ApiHeader({ name: 'x-parent-id', required: true })
  async getSettings(@Param('childUserId') childUserId: string) {
    const settings = await this.parentalService.getSettings(childUserId);
    return { success: true, data: settings };
  }

  @Put('settings/:childUserId')
  @ApiOperation({ summary: 'Update parental settings for a child' })
  @ApiHeader({ name: 'x-parent-id', required: true })
  async updateSettings(
    @Param('childUserId') childUserId: string,
    @Headers('x-parent-id') parentUserId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    const settings = await this.parentalService.updateSettings(
      childUserId,
      parentUserId,
      dto,
    );
    return { success: true, data: settings };
  }

  @Get('limit/:childUserId')
  @ApiOperation({ summary: 'Check remaining screen time limit' })
  async checkLimit(@Param('childUserId') childUserId: string) {
    const result = await this.parentalService.checkLimit(childUserId);
    return { success: true, data: result };
  }

  @Post('watch-time/:childUserId')
  @ApiOperation({ summary: 'Record watch time for a child' })
  async recordWatchTime(
    @Param('childUserId') childUserId: string,
    @Body('minutes') minutes: number,
  ) {
    const result = await this.parentalService.recordWatchTime(
      childUserId,
      minutes,
    );
    return { success: true, data: result };
  }
}
