import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

interface CurrentUser {
  id: string;
  role: string;
  tenant_id: string | null;
}

@Injectable()
export class RatingsService {
  constructor(private supabase: SupabaseService) {}

  async createRating(requestId: string, dto: CreateRatingDto, user: CurrentUser) {
    const { data: request } = await this.supabase.db
      .from('service_requests')
      .select('id, customer_id, assigned_staff_id, status')
      .eq('id', requestId)
      .single();

    if (!request) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND', message: 'Request not found' });

    if (request.customer_id !== user.id) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Only the customer can rate this request' });
    }

    if (!['completed', 'completed_late'].includes(request.status)) {
      throw new UnprocessableEntityException({ code: 'NOT_COMPLETED', message: 'Request is not completed yet' });
    }

    if (!request.assigned_staff_id) {
      throw new BadRequestException({ code: 'NO_STAFF', message: 'No staff assigned to this request' });
    }

    const { data: existing } = await this.supabase.db
      .from('ratings')
      .select('id')
      .eq('request_id', requestId)
      .single();

    if (existing) throw new ConflictException({ code: 'ALREADY_RATED', message: 'Request already rated' });

    const { data, error } = await this.supabase.db
      .from('ratings')
      .insert({
        request_id: requestId,
        customer_id: user.id,
        staff_id: request.assigned_staff_id,
        score: dto.score,
        comment: dto.comment,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.db.from('audit_logs').insert({
      request_id: requestId,
      user_id: user.id,
      action: 'rating_submitted',
      metadata: { score: dto.score, staff_id: request.assigned_staff_id },
    });

    return data;
  }

  async getStaffRatings(staffId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const { data, count, error } = await this.supabase.db
      .from('ratings')
      .select('*, customer:customer_id(id, full_name, avatar_url)', { count: 'exact' })
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    const { data: stats } = await this.supabase.db
      .from('users')
      .select('rating_avg, rating_count')
      .eq('id', staffId)
      .single();

    return {
      data: data ?? [],
      meta: { total: count, page, limit },
      stats: { avg: stats?.rating_avg ?? null, count: stats?.rating_count ?? 0 },
    };
  }
}
