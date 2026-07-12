export type GeocodeSource = 'pin' | 'link' | 'text' | 'manual';
export type AssignmentStatus = 'pending_review' | 'active' | 'suspended';

export interface Student {
  id: string;
  name: string;
  grade: string | null;
  parent_name: string | null;
  parent_phone: string;
  whatsapp_id: string | null;
  created_at: string;
}

export interface StudentLocation {
  id: string;
  student_id: string;
  latitude: number;
  longitude: number;
  address_text: string | null;
  geocode_source: GeocodeSource;
  geocode_confidence: number;
  road_distance_km: number | null;
  travel_time_minutes: number | null;
  verified_by_staff: boolean;
  created_at: string;
}

export interface RouteAssignment {
  id: string;
  student_id: string;
  route_id: string;
  pickup_order: number | null;
  estimated_pickup_time: string | null;
  status: AssignmentStatus;
  assigned_by: string | null;
  assigned_at: string | null;
  created_at: string;
}

export interface PendingAssignment extends RouteAssignment {
  student: Student;
  student_location: StudentLocation | null;
  route_name: string;
  road_distance_km: number | null;
  travel_time_minutes: number | null;
}
