// Dummy credentials so importing src/db/client.ts doesn't throw during tests
// that only exercise pure business logic (no real Supabase calls are made).
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';
