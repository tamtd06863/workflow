import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private supabase: SupabaseService) {}

  async listCategories(includeInactive = false) {
    let query = this.supabase.db
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getCategory(id: string) {
    const { data, error } = await this.supabase.db
      .from('service_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    return data;
  }

  async createCategory(dto: CreateCategoryDto) {
    const { data: existing } = await this.supabase.db
      .from('service_categories')
      .select('id')
      .eq('slug', dto.slug)
      .single();

    if (existing) throw new ConflictException({ code: 'SLUG_ALREADY_EXISTS', message: 'Category slug already taken' });

    const { data, error } = await this.supabase.db
      .from('service_categories')
      .insert({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon_url: dto.icon_url,
        keywords: dto.keywords ?? [],
        sort_order: dto.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.getCategory(id);

    const { data, error } = await this.supabase.db
      .from('service_categories')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteCategory(id: string) {
    await this.getCategory(id);

    await this.supabase.db
      .from('service_categories')
      .update({ is_active: false })
      .eq('id', id);

    return { message: 'Category deactivated' };
  }
}
