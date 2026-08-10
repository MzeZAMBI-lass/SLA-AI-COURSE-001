-- Route path geometry cache (Sprint 5.2 — Route Map View)
-- Stores the road-following path for each route so the dashboard can render
-- it without re-calling OpenRouteService on every page load (free-tier: 2,000 req/day).

ALTER TABLE routes
  ADD COLUMN origin_bearing_degrees SMALLINT CHECK (origin_bearing_degrees BETWEEN 0 AND 359),
  ADD COLUMN path_geometry           JSONB,
  ADD COLUMN path_distance_km        DECIMAL(6,2),
  ADD COLUMN path_duration_min       INTEGER,
  ADD COLUMN path_waypoint_hash      TEXT,
  ADD COLUMN path_source             TEXT CHECK (path_source IN ('ors', 'fallback')),
  ADD COLUMN path_cached_at          TIMESTAMPTZ;

-- Seed routes: fixed compass bearing each route's bus originates from,
-- matching the route names already in 20260101000001_seed_data.sql.
UPDATE routes SET origin_bearing_degrees = 0   WHERE route_name = 'Route A - North';
UPDATE routes SET origin_bearing_degrees = 180 WHERE route_name = 'Route B - South';
UPDATE routes SET origin_bearing_degrees = 90  WHERE route_name = 'Route C - East';
