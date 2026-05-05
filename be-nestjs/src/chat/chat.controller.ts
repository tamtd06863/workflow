import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

interface CurrentUserType {
  id: string;
  role: string;
  tenant_id: string | null;
}

@Controller('requests/:requestId/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get(':channel')
  getHistory(
    @Param('requestId') requestId: string,
    @Param('channel') channel: 'customer_operator' | 'customer_staff',
    @CurrentUser() user: CurrentUserType,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.getHistory(requestId, channel, user, pagination);
  }

  @Post(':channel')
  sendMessage(
    @Param('requestId') requestId: string,
    @Param('channel') channel: 'customer_operator' | 'customer_staff',
    @Body() dto: SendMessageDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.sendMessage(requestId, channel, dto.content, dto.media_urls, user);
  }
}
