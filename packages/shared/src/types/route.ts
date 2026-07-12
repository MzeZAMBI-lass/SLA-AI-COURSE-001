export interface Route {
  id: string;
  route_name: string;
  bus_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  school_id: string;
  active: boolean;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  start_time: string;
  end_time: string;
}

export interface RouteWithOccupancy extends Route {
  current_count: number;
}

export interface RouteStudentSummary {
  student_id: string;
  student_name: string;
  pickup_order: number | null;
  estimated_pickup_time: string | null;
  road_distance_km: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RouteSuggestion {
  route: Route;
  score: number;
  detour_km: number;
  current_count: number;
}
