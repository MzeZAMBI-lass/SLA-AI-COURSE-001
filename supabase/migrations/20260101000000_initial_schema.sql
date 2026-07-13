-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Expose PostGIS types in public search_path so GEOGRAPHY/GEOMETRY work unqualified
SET search_path TO public, extensions;

-- schools
CREATE TABLE schools (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  latitude     DECIMAL(9,6) NOT NULL,
  longitude    DECIMAL(9,6) NOT NULL,
  address      TEXT,
  start_time   TIME NOT NULL DEFAULT '07:30',
  end_time     TIME NOT NULL DEFAULT '14:00',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- routes
CREATE TABLE routes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name   TEXT NOT NULL,
  bus_number   TEXT NOT NULL,
  driver_name  TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  capacity     INTEGER NOT NULL DEFAULT 15,
  school_id    UUID REFERENCES schools(id) NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- students
CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  grade         TEXT,
  parent_name   TEXT,
  parent_phone  TEXT NOT NULL,
  whatsapp_id   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- student_locations  (PostGIS point stored alongside decimal columns)
CREATE TABLE student_locations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           UUID REFERENCES students(id) NOT NULL,
  latitude             DECIMAL(9,6) NOT NULL,
  longitude            DECIMAL(9,6) NOT NULL,
  location             GEOGRAPHY(POINT, 4326),   -- populated by trigger
  address_text         TEXT,
  geocode_source       TEXT NOT NULL CHECK (geocode_source IN ('pin', 'link', 'text', 'manual')),
  geocode_confidence   DECIMAL(3,2) DEFAULT 1.0,
  road_distance_km     DECIMAL(8,3),
  travel_time_minutes  INTEGER,
  verified_by_staff    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- route_assignments
CREATE TABLE route_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID REFERENCES students(id) NOT NULL,
  route_id              UUID REFERENCES routes(id) NOT NULL,
  pickup_order          INTEGER,
  estimated_pickup_time TIME,
  status                TEXT NOT NULL DEFAULT 'pending_review'
                          CHECK (status IN ('pending_review', 'active', 'suspended')),
  assigned_by           UUID,
  assigned_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- incoming_messages
CREATE TABLE incoming_messages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_message_id  TEXT UNIQUE NOT NULL,
  sender_phone         TEXT NOT NULL,
  message_type         TEXT NOT NULL
                         CHECK (message_type IN ('location', 'text', 'link', 'image', 'unknown')),
  raw_payload          JSONB NOT NULL,
  processed            BOOLEAN NOT NULL DEFAULT FALSE,
  processing_status    TEXT NOT NULL DEFAULT 'pending',
  flag_reason          TEXT,
  student_id           UUID REFERENCES students(id),
  received_at          TIMESTAMPTZ DEFAULT NOW(),
  processed_at         TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_students_parent_phone           ON students(parent_phone);
CREATE INDEX idx_student_locations_student_id    ON student_locations(student_id);
CREATE INDEX idx_student_locations_geography     ON student_locations USING GIST(location);
CREATE INDEX idx_route_assignments_student_id    ON route_assignments(student_id);
CREATE INDEX idx_route_assignments_route_id      ON route_assignments(route_id);
CREATE INDEX idx_route_assignments_status        ON route_assignments(status);
CREATE INDEX idx_incoming_messages_sender_phone  ON incoming_messages(sender_phone);
CREATE INDEX idx_incoming_messages_processed     ON incoming_messages(processed);

-- Trigger: auto-populate PostGIS GEOGRAPHY from lat/lng on insert/update
CREATE OR REPLACE FUNCTION sync_student_location_geography()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_student_location_geography
BEFORE INSERT OR UPDATE ON student_locations
FOR EACH ROW EXECUTE FUNCTION sync_student_location_geography();

-- Row Level Security
ALTER TABLE schools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE incoming_messages  ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated staff can read/write most tables
CREATE POLICY "staff_read_schools"           ON schools           FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "staff_read_routes"            ON routes            FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "staff_manage_routes"          ON routes            FOR ALL    TO authenticated USING (TRUE);
CREATE POLICY "staff_read_students"          ON students          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "staff_manage_students"        ON students          FOR ALL    TO authenticated USING (TRUE);
CREATE POLICY "staff_read_locations"         ON student_locations FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "staff_manage_locations"       ON student_locations FOR ALL    TO authenticated USING (TRUE);
CREATE POLICY "staff_manage_assignments"     ON route_assignments FOR ALL    TO authenticated USING (TRUE);
-- Raw message payloads visible to admin role only
CREATE POLICY "admin_manage_messages"        ON incoming_messages FOR ALL    TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- Supabase Realtime on route_assignments (dashboard live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE route_assignments;
