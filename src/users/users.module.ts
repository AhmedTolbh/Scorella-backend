import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Video } from '../videos/entities/video.entity';
import { ParentalConsent } from '../parental-consent/parental-consent.entity';
import { BlockedUser } from './entities/blocked-user.entity';
import { UserInterest } from './entities/user-interest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Video, ParentalConsent, BlockedUser, UserInterest])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

