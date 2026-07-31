-- Seed route assignments + student locations (Sprint 5.2 follow-up)
-- The original seed_data.sql created 3 routes and 5 students but never linked
-- them, so route path geometry had no pickup stops to route through — only a
-- straight line from the synthetic origin point to the school. This links
-- each student to a route with an approximate location in the correct
-- compass direction, so getRoutePath() has real waypoints to work with.

SET search_path TO public, extensions;

-- Route A - North (bearing 0°): Amina Hassan, Juma Mwangi
INSERT INTO student_locations (student_id, latitude, longitude, address_text, geocode_source, geocode_confidence, verified_by_staff)
VALUES
  ((SELECT id FROM students WHERE name = 'Juma Mwangi'),  -3.6845, 36.6795, 'Sigino Ward, north of Silverleaf Academy',           'manual', 1.0, TRUE),
  ((SELECT id FROM students WHERE name = 'Amina Hassan'), -3.6980, 36.6840, 'Near Babati bus stand, north of Silverleaf Academy', 'manual', 1.0, TRUE);

-- Route B - South (bearing 180°): David Mbise, Neema Kimaro
INSERT INTO student_locations (student_id, latitude, longitude, address_text, geocode_source, geocode_confidence, verified_by_staff)
VALUES
  ((SELECT id FROM students WHERE name = 'David Mbise'),  -3.7830, 36.6935, 'Mwisi Ward, south of Silverleaf Academy',    'manual', 1.0, TRUE),
  ((SELECT id FROM students WHERE name = 'Neema Kimaro'), -3.7690, 36.6900, 'Chemchem Ward, south of Silverleaf Academy', 'manual', 1.0, TRUE);

-- Route C - East (bearing 90°): Sofia Minja
INSERT INTO student_locations (student_id, latitude, longitude, address_text, geocode_source, geocode_confidence, verified_by_staff)
VALUES
  ((SELECT id FROM students WHERE name = 'Sofia Minja'), -3.7295, 36.7210, 'Endagichim Ward, east of Silverleaf Academy', 'manual', 1.0, TRUE);

-- Assignments — status 'active' so getRoutePath() and the Pending/Realtime
-- views pick them up. pickup_order runs farthest-from-school first, matching
-- how the bus travels from its synthetic origin point in toward the school.
INSERT INTO route_assignments (student_id, route_id, pickup_order, estimated_pickup_time, status, assigned_at)
VALUES
  ((SELECT id FROM students WHERE name = 'Juma Mwangi'),  (SELECT id FROM routes WHERE route_name = 'Route A - North'), 1, '06:45', 'active', NOW()),
  ((SELECT id FROM students WHERE name = 'Amina Hassan'), (SELECT id FROM routes WHERE route_name = 'Route A - North'), 2, '06:55', 'active', NOW()),
  ((SELECT id FROM students WHERE name = 'David Mbise'),  (SELECT id FROM routes WHERE route_name = 'Route B - South'), 1, '06:50', 'active', NOW()),
  ((SELECT id FROM students WHERE name = 'Neema Kimaro'), (SELECT id FROM routes WHERE route_name = 'Route B - South'), 2, '07:00', 'active', NOW()),
  ((SELECT id FROM students WHERE name = 'Sofia Minja'),  (SELECT id FROM routes WHERE route_name = 'Route C - East'),  1, '06:50', 'active', NOW());
