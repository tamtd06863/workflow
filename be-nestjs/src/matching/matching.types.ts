export interface TenantMatch {
  tenant: { id: string; name: string; slug: string };
  pricing: {
    id: string;
    service_name: string;
    price_min: number | null;
    price_max: number | null;
    price_fixed: number | null;
    currency: string;
    estimated_duration_minutes: number | null;
  } | null;
}

export interface CategoryMatch {
  id: string;
  name: string;
  slug: string;
  score: number;
}

export interface StaffCandidate {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  rating_avg: number | null;
  rating_count: number;
  distance_meters: number;
  eta_seconds: number;
  proficiency_level: number;
  lat: number;
  lng: number;
}
