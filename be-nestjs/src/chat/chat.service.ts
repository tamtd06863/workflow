import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

interface CurrentUser {
  id: string;
  role: string;
  tenant_id: string | null;
}

@Injectable()
export class ChatService {
  constructor(private supabase: SupabaseService) {}

  async getHistory(
    requestId: string,
    channel: 'customer_operator' | 'customer_staff',
    user: CurrentUser,
    pagination: PaginationDto,
  ) {
    await this.verifyAccess(requestId, channel, user);

    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    const { data, count, error } = await this.supabase.db
      .from('request_chats')
      .select('*, sender:user_id(id, full_name, avatar_url)', { count: 'exact' })
      .eq('request_id', requestId)
      .eq('channel', channel)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);
    return { data: data ?? [], meta: { total: count, page, limit } };
  }

  async sendMessage(
    requestId: string,
    channel: 'customer_operator' | 'customer_staff',
    content: string | undefined,
    mediaUrls: string[] | undefined,
    user: CurrentUser,
  ) {
    await this.verifyAccess(requestId, channel, user);

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      throw new BadRequestException({ code: 'EMPTY_MESSAGE', message: 'Message must have content or media' });
    }

    const { data, error } = await this.supabase.db
      .from('request_chats')
      .insert({
        request_id: requestId,
        user_id: user.id,
        channel,
        content: content ?? null,
        media_urls: mediaUrls ?? [],
      })
      .select('*, sender:user_id(id, full_name, avatar_url)')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private async verifyAccess(
    requestId: string,
    channel: 'customer_operator' | 'customer_staff',
    user: CurrentUser,
  ) {
    const { data: request } = await this.supabase.db
      .from('service_requests')
      .select('customer_id, assigned_staff_id, tenant_id')
      .eq('id', requestId)
      .single();

    if (!request) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND', message: 'Request not found' });

    const isCustomer = request.customer_id === user.id;
    const isStaff = request.assigned_staff_id === user.id;
    const isOperator = ['business_owner', 'operator'].includes(user.role) && request.tenant_id === user.tenant_id;
    const isSuperadmin = user.role === 'superadmin';

    if (isSuperadmin) return;

    if (channel === 'customer_operator') {
      if (!isCustomer && !isOperator) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied to this chat channel' });
    } else {
      if (!isCustomer && !isStaff) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied to this chat channel' });
    }
  }
}
