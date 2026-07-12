export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinServiceArea(lat: number, lon: number): boolean {
  const schoolLat = parseFloat(process.env.SCHOOL_LATITUDE ?? '-3.7321');
  const schoolLon = parseFloat(process.env.SCHOOL_LONGITUDE ?? '36.6858');
  const maxKm = parseFloat(process.env.MAX_SERVICE_DISTANCE_KM ?? '50');
  return haversineKm(lat, lon, schoolLat, schoolLon) <= maxKm;
}

export function isValidCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
