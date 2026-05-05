import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { MatchingService } from '../matching/matching.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService, private matching: MatchingService) {}

  @Get()
  list(@Query('include_inactive') includeInactive?: string) {
    return this.service.listCategories(includeInactive === 'true');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getCategory(id);
  }

  @Get(':id/tenants')
  getTenants(@Param('id') id: string) {
    return this.matching.findMatchingTenants(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  create(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  remove(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }
}
