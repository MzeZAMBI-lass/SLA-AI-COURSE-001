'use client';

import { Fragment, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { createBrowserClient } from '@/lib/supabase-client';
import type { RoutePath, RouteStudentSummary } from '@sla/shared';

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ROUTE_COLOURS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2'];

const SCHOOL_LAT = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LATITUDE ?? '-3.7321');
const SCHOOL_LON = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LONGITUDE ?? '36.6858');
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface StudentPin {
  student_id: string;
  student_name: string;
  grade?: string | null;
  latitude: number | null;
  longitude: number | null;
  road_distance_km?: number | null;
  route_id: string | null;
  estimated_pickup_time: string | null;
}

interface RawStudentLocation {
  latitude: number;
  longitude: number;
  road_distance_km: number | null;
}

interface RawStudentRow {
  id: string;
  name: string;
  grade: string | null;
  student_locations?: RawStudentLocation[];
  route_assignments?: Array<{ route_id: string; status: string; estimated_pickup_time: string | null }>;
}

/** GET /api/students returns raw student rows (used for the "all routes" view). */
function pinsFromAllStudents(rows: RawStudentRow[]): StudentPin[] {
  return rows.map((row) => {
    const location = row.student_locations?.[0];
    const active = row.route_assignments?.find((a) => a.status === 'active');
    return {
      student_id: row.id,
      student_name: row.name,
      grade: row.grade,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      road_distance_km: location?.road_distance_km ?? null,
      route_id: active?.route_id ?? null,
      estimated_pickup_time: active?.estimated_pickup_time ?? null,
    };
  });
}

/** GET /api/routes/:id/students returns RouteStudentSummary[] (single route, so route_id is implicit). */
function pinsFromRouteStudents(rows: RouteStudentSummary[], routeId: string): StudentPin[] {
  return rows.map((row) => ({
    student_id: row.student_id,
    student_name: row.student_name,
    latitude: row.latitude,
    longitude: row.longitude,
    road_distance_km: row.road_distance_km,
    route_id: routeId,
    estimated_pickup_time: row.estimated_pickup_time,
  }));
}

interface RouteMapProps {
  selectedRouteId: string | null;
}

function colourForRoute(index: number): string {
  return ROUTE_COLOURS[index % ROUTE_COLOURS.length];
}

function makeIcon(colour: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${colour};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function makeOriginIcon(colour: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;transform:rotate(45deg);background:${colour};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function RouteMap({ selectedRouteId }: RouteMapProps) {
  const supabase = createBrowserClient();
  const [pins, setPins] = useState<StudentPin[]>([]);
  const [routeIndexMap, setRouteIndexMap] = useState<Record<string, number>>({});
  const [paths, setPaths] = useState<RoutePath[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const url = selectedRouteId
        ? `${API}/api/routes/${selectedRouteId}/students`
        : `${API}/api/students`;

      const res = await fetch(url, { headers });
      if (!res.ok) return;
      const raw = await res.json();
      const data: StudentPin[] = selectedRouteId
        ? pinsFromRouteStudents(raw as RouteStudentSummary[], selectedRouteId)
        : pinsFromAllStudents(raw as RawStudentRow[]);
      setPins(data);

      // Build stable colour index map
      const ids = [...new Set(data.map((p) => p.route_id).filter(Boolean))] as string[];
      const map: Record<string, number> = {};
      ids.forEach((id, i) => { map[id] = i; });
      setRouteIndexMap(map);

      // Fetch road-following path geometry for whichever routes are in view
      const pathRouteIds = selectedRouteId ? [selectedRouteId] : ids;
      const fetchedPaths = await Promise.all(
        pathRouteIds.map(async (id) => {
          const pathRes = await fetch(`${API}/api/routes/${id}/path`, { headers });
          if (!pathRes.ok) return null;
          return (await pathRes.json()) as RoutePath;
        }),
      );
      setPaths(fetchedPaths.filter((p): p is RoutePath => p !== null));
    }
    load();
  }, [selectedRouteId]);

  return (
    <MapContainer center={[SCHOOL_LAT, SCHOOL_LON]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* School */}
      <Marker position={[SCHOOL_LAT, SCHOOL_LON]}>
        <Popup><strong>Silverleaf Academy</strong></Popup>
      </Marker>

      {/* Route paths + origin points */}
      {paths.map((path) => {
        const colour = colourForRoute(routeIndexMap[path.route_id] ?? 0);
        const positions = path.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);

        return (
          <Fragment key={path.route_id}>
            <Polyline positions={positions} pathOptions={{ color: colour, weight: 4, opacity: 0.75 }}>
              <Popup>
                <strong>{path.route_name}</strong>
                <div className="text-xs text-gray-500">
                  {path.distance_km.toFixed(1)} km · {path.duration_min} min
                </div>
                {path.source === 'fallback' && (
                  <div className="text-xs text-amber-600">Straight-line estimate (ORS unavailable)</div>
                )}
              </Popup>
            </Polyline>
            <Marker position={[path.origin.latitude, path.origin.longitude]} icon={makeOriginIcon(colour)}>
              <Popup>
                <strong>{path.route_name} — Origin</strong>
                <div className="text-xs text-gray-500">~10 km from school</div>
              </Popup>
            </Marker>
          </Fragment>
        );
      })}

      {/* Students */}
      {pins.map((pin) => {
        if (pin.latitude === null || pin.longitude === null) return null;

        const colour = pin.route_id ? colourForRoute(routeIndexMap[pin.route_id] ?? 0) : '#6b7280';

        return (
          <Marker key={pin.student_id} position={[pin.latitude, pin.longitude]} icon={makeIcon(colour)}>
            <Popup>
              <strong>{pin.student_name}</strong>
              {pin.grade && <div className="text-xs text-gray-500">Grade {pin.grade}</div>}
              {pin.road_distance_km != null && (
                <div className="text-xs">Distance: {pin.road_distance_km.toFixed(1)} km</div>
              )}
              {pin.estimated_pickup_time && (
                <div className="text-xs">Pickup: {pin.estimated_pickup_time}</div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
