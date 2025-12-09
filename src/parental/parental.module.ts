import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentalService } from './parental.service';
import { ParentalController } from './parental.controller';
import { ParentalSettings } from './entities/parental-settings.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParentalSettings, User])],
  controllers: [ParentalController],
  providers: [ParentalService],
  exports: [ParentalService],
})
export class ParentalModule {}
