import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { haversineDistance } from '../common/utils/haversine.util.js';
import type { CategoryMatch, StaffCandidate, TenantMatch } from './matching.types.js';

function normalizeText(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1),
  );
}

function jaccardScore(descTokens: Set<string>, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const kwTokens = new Set(
    keywords.flatMap((kw) => [...normalizeText(kw)]),
  );
  const intersection = [...descTokens].filter((t) => kwTokens.has(t)).length;
  const union = new Set([...descTokens, ...kwTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

@Injectable()
export class MatchingService {
  constructor(private supabase: SupabaseService) {}

  async suggestCategories(description: string): Promise<CategoryMatch[]> {
    const { data: categories } = await this.supabase.db
      .from('service_categories')
      .select('id, name, slug, keywords')
      .eq('is_active', true);

    if (!categories || categories.length === 0) return [];

    const descTokens = normalizeText(description);

    const scored = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        score: jaccardScore(descTokens, cat.keywords ?? []),
      }))
      .filter((c) => c.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length === 0) {
      return categories.slice(0, 6).map((c) => ({ id: c.id, name: c.name, slug: c.slug, score: 0 }));
    }

    return scored;
  }

  async findMatchingTenants(categoryId: string): Promise<TenantMatch[]> {
    const { data } = await this.supabase.db
      .from('service_pricings')
      .select(`
        id, service_name, price_min, price_max, price_fixed, currency, estimated_duration_minutes,
        tenant:tenant_id(id, name, slug, status)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true);

    if (!data) return [];

    return (data as any[])
      .filter((p) => p.tenant?.status === 'active')
      .map((p) => ({
        tenant: { id: p.tenant.id, name: p.tenant.name, slug: p.tenant.slug },
        pricing: {
          id: p.id,
          service_name: p.service_name,
          price_min: p.price_min,
          price_max: p.price_max,
          price_fixed: p.price_fixed,
          currency: p.currency,
          estimated_duration_minutes: p.estimated_duration_minutes,
        },
      }));
  }

  async findCandidates(
    tenantId: string,
    categoryId: string,
    requestLat: number,
    requestLng: number,
    maxDistanceMeters = 15000,
  ): Promise<StaffCandidate[]> {
    // 1. Find online staff with the required skill in this tenant
    const { data: skills } = await this.supabase.db
      .from('staff_skills')
      .select('user_id, proficiency_level')
      .eq('tenant_id', tenantId)
      .eq('category_id', categoryId);

    if (!skills || skills.length === 0) return [];

    const staffUserIds = skills.map((s) => s.user_id);

    // 2. Filter to only active tenant members
    const { data: activeMembers } = await this.supabase.db
      .from('user_tenants')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('role', 'staff')
      .in('user_id', staffUserIds);

    if (!activeMembers || activeMembers.length === 0) return [];

    const activeMemberIds = activeMembers.map((m) => m.user_id);

    // 3. Filter to only online staff
    const { data: onlineStaff } = await this.supabase.db
      .from('staff_status')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .eq('is_online', true)
      .in('user_id', activeMemberIds);

    if (!onlineStaff || onlineStaff.length === 0) return [];

    const onlineIds = onlineStaff.map((s) => s.user_id);

    // 4. Get user info
    const { data: users } = await this.supabase.db
      .from('users')
      .select('id, full_name, avatar_url, rating_avg, rating_count')
      .in('id', onlineIds);

    // 5. Get latest location for each staff (DISTINCT ON equivalent via ordering)
    const { data: locations } = await this.supabase.db
      .from('staff_locations')
      .select('user_id, lat, lng, created_at')
      .in('user_id', onlineIds)
      .order('user_id')
      .order('created_at', { ascending: false });

    // Keep only the latest location per user
    const latestLocation = new Map<string, { lat: number; lng: number }>();
    for (const loc of locations ?? []) {
      if (!latestLocation.has(loc.user_id)) {
        latestLocation.set(loc.user_id, { lat: loc.lat, lng: loc.lng });
      }
    }

    const proficiencyMap = new Map(skills.map((s) => [s.user_id, s.proficiency_level]));
    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    const candidates: StaffCandidate[] = [];

    for (const staffId of onlineIds) {
      const location = latestLocation.get(staffId);
      if (!location) continue;

      const distance = haversineDistance(location.lat, location.lng, requestLat, requestLng);
      if (distance > maxDistanceMeters) continue;

      const user = userMap.get(staffId);
      if (!user) continue;

      candidates.push({
        user_id: staffId,
        full_name: user.full_name,
        avatar_url: user.avatar_url ?? null,
        rating_avg: user.rating_avg ?? null,
        rating_count: user.rating_count ?? 0,
        distance_meters: Math.round(distance),
        eta_seconds: Math.round(distance / 10),
        proficiency_level: proficiencyMap.get(staffId) ?? 1,
        lat: location.lat,
        lng: location.lng,
      });
    }

    return candidates.sort((a, b) => {
      if (a.distance_meters !== b.distance_meters) return a.distance_meters - b.distance_meters;
      if (b.proficiency_level !== a.proficiency_level) return b.proficiency_level - a.proficiency_level;
      return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
    }).slice(0, 5);
  }
}
