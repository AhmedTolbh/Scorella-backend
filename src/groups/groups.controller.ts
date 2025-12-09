import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get('user/:userId')
  findAllForUser(@Param('userId') userId: string) {
    return this.groupsService.findAllForUser(userId);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Body('userId') userId: string) {
    return this.groupsService.join(id, userId);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @Body('userId') userId: string) {
    return this.groupsService.leave(id, userId);
  }
}
