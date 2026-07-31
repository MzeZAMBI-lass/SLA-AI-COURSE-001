-- Seed data for local development and testing

-- School
INSERT INTO schools (id, name, latitude, longitude, address, start_time, end_time) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Silverleaf Academy',
  -3.342059,
  36.878586,
  'Babati, Manyara, Tanzania',
  '07:30',
  '14:00'
);

-- Routes
INSERT INTO routes (route_name, bus_number, driver_name, driver_phone, capacity, school_id) VALUES
  ('Route A - North',  'BUS-001', 'John Msangi',  '+255712345678', 15, '00000000-0000-0000-0000-000000000001'),
  ('Route B - South',  'BUS-002', 'Peter Kileo',  '+255712345679', 15, '00000000-0000-0000-0000-000000000001'),
  ('Route C - East',   'BUS-003', 'James Mwanga', '+255712345680', 15, '00000000-0000-0000-0000-000000000001');

-- Test students
INSERT INTO students (name, grade, parent_name, parent_phone) VALUES
  ('Amina Hassan',  'Grade 5', 'Fatuma Hassan',  '+255712000001'),
  ('Juma Mwangi',   'Grade 3', 'Ali Mwangi',     '+255712000002'),
  ('Neema Kimaro',  'Grade 7', 'Grace Kimaro',   '+255712000003'),
  ('David Mbise',   'Grade 4', 'Robert Mbise',   '+255712000004'),
  ('Sofia Minja',   'Grade 6', 'Mary Minja',     '+255712000005');
