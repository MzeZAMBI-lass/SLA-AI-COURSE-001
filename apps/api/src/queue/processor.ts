import { supabase } from '../db/client';
import { classifyMessage } from '../services/messageParser';
import { geocodeAddress } from '../services/geocoding';
import { calculateRoute } from '../services/routing';
import { suggestRoute } from '../services/routeAssignment';
import { isWithinServiceArea, isValidCoordinates } from '../services/routingUtils';

export async function processMessage(msg: Record<string, unknown>): Promise<void> {
  const senderPhone = msg['from'] as string;
  const messageId = msg['whatsapp_message_id'] ?? msg['id'];

  await updateStatus(messageId as string, 'processing');

  // Look up student by parent phone
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('parent_phone', senderPhone)
    .single();

  if (!student) {
    await updateStatus(messageId as string, 'needs_manual_review', 'Unknown sender — no student record found for this phone number');
    return;
  }

  // Step 1 — classify message and extract location
  const classification = classifyMessage(msg);

  if (!classification.location && !classification.needsGeocoding) {
    await updateStatus(messageId as string, 'needs_manual_review', classification.flagReason);
    return;
  }

  let location = classification.location;

  // Step 2 — geocode plain-text addresses
  if (classification.needsGeocoding && classification.rawText) {
    const { location: geocoded, needsReview, flagReason } = await geocodeAddress(classification.rawText);
    if (!geocoded || needsReview) {
      await updateStatus(messageId as string, 'needs_manual_review', flagReason);
      return;
    }
    location = geocoded;
  }

  if (!location) {
    await updateStatus(messageId as string, 'failed', 'Could not extract location from message');
    return;
  }

  // Step 3 — validate coordinates
  if (!isValidCoordinates(location.latitude, location.longitude)) {
    await updateStatus(messageId as string, 'needs_manual_review', 'Invalid coordinates extracted');
    return;
  }

  if (!isWithinServiceArea(location.latitude, location.longitude)) {
    await updateStatus(messageId as string, 'out_of_service_area', 'Location is outside the service area');
    return;
  }

  // Step 4 — calculate routing data
  const schoolLat = parseFloat(process.env.SCHOOL_LATITUDE ?? '-3.7321');
  const schoolLon = parseFloat(process.env.SCHOOL_LONGITUDE ?? '36.6858');
  const routing = await calculateRoute(location.latitude, location.longitude, schoolLat, schoolLon);

  // Step 5 — store student location
  const { data: studentLocation } = await supabase
    .from('student_locations')
    .insert({
      student_id: student.id,
      latitude: location.latitude,
      longitude: location.longitude,
      address_text: location.address_text,
      geocode_source: location.source,
      geocode_confidence: location.confidence,
      road_distance_km: routing.distance_km,
      travel_time_minutes: routing.duration_min,
    })
    .select()
    .single();

  // Step 6 — suggest route
  const suggestion = await suggestRoute(location.latitude, location.longitude);

  if (!suggestion) {
    await updateStatus(messageId as string, 'needs_manual_review', 'No route available — all routes at capacity or none defined');
    return;
  }

  // Step 7 — create pending assignment for staff review
  await supabase.from('route_assignments').insert({
    student_id: student.id,
    route_id: suggestion.route.id,
    status: 'pending_review',
  });

  await supabase
    .from('incoming_messages')
    .update({
      processed: true,
      processing_status: 'processed',
      student_id: student.id,
      processed_at: new Date().toISOString(),
    })
    .eq('whatsapp_message_id', messageId);
}

async function updateStatus(messageId: string, status: string, flagReason?: string): Promise<void> {
  await supabase
    .from('incoming_messages')
    .update({
      processing_status: status,
      processed: ['processed', 'failed', 'out_of_service_area'].includes(status),
      processed_at: new Date().toISOString(),
      ...(flagReason ? { flag_reason: flagReason } : {}),
    })
    .eq('whatsapp_message_id', messageId);
}
