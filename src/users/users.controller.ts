import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  findOrCreate(@Body() createUserDto: CreateUserDto) {
    return this.usersService.findOrCreate(
      createUserDto.appleId,
      createUserDto.email,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.usersService.search(query);
  }

  @Get(':appleId')
  findOne(@Param('appleId') appleId: string) {
    return this.usersService.findOneByAppleId(appleId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // In a real app, verify 'id' matches authenticated user
    return this.usersService.delete(id);
  }
}
