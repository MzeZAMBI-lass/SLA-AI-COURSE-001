-- Fix: recentre school + seeded student coordinates on the real address
-- The schools row was corrected in the Supabase dashboard to Silverleaf
-- Academy's real address (-3.342059, 36.878586), but the original seed
-- migration (20260101000001_seed_data.sql) and the student locations added
-- in 20260128000000_seed_route_assignments.sql were both computed relative
-- to the old placeholder coordinates (-3.7321, 36.6858). The ~48km gap
-- between old and new school position was inflating route path distances
-- to 130-150km. This recentres both around the real school location,
-- preserving each student's original compass direction/offset from the
-- school so Route A/B/C still point north/south/east correctly.

UPDATE schools
SET latitude = -3.342059, longitude = 36.878586
WHERE name = 'Silverleaf Academy';

-- Route A - North
UPDATE student_locations SET latitude = -3.2945, longitude = 36.8723
WHERE student_id = (SELECT id FROM students WHERE name = 'Juma Mwangi');
UPDATE student_locations SET latitude = -3.3080, longitude = 36.8768
WHERE student_id = (SELECT id FROM students WHERE name = 'Amina Hassan');

-- Route B - South
UPDATE student_locations SET latitude = -3.3930, longitude = 36.8863
WHERE student_id = (SELECT id FROM students WHERE name = 'David Mbise');
UPDATE student_locations SET latitude = -3.3790, longitude = 36.8828
WHERE student_id = (SELECT id FROM students WHERE name = 'Neema Kimaro');

-- Route C - East
UPDATE student_locations SET latitude = -3.3395, longitude = 36.9138
WHERE student_id = (SELECT id FROM students WHERE name = 'Sofia Minja');
