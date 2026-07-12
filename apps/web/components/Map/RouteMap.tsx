'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createBrowserClient } from '@/lib/supabase';

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ROUTE_COLOURS = [
  '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2',
];

const SCHOOL_LAT = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LATITUDE ?? '-3.7321');
const SCHOOL_LON = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LONGITUDE ?? '36.6858');

interface StudentPin {
  student_id: string;
  student_name: string;
  latitude: number;
  longitude: number;
  route_id: string;
  route_name: string;
  road_distance_km: number | null;
  estimated_pickup_time: string | null;
  grade: string | null;
}

interface RouteMapProps {
  selectedRouteId: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function RouteMap({ selectedRouteId }: RouteMapProps) {
  const supabase = createBrowserClient();
  const pinsRef = useRef<StudentPin[]>([]);

  return (
    <MapContainer
      center={[SCHOOL_LAT, SCHOOL_LON]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* School marker */}
      <Marker position={[SCHOOL_LAT, SCHOOL_LON]}>
        <Popup>
          <strong>Silverleaf Academy</strong>
        </Popup>
      </Marker>

      <StudentPins selectedRouteId={selectedRouteId} />
    </MapContainer>
  );
}

function StudentPins({ selectedRouteId }: { selectedRouteId: string | null }) {
  const supabase = createBrowserClient();
  const [pins, setPins] = ([] as StudentPin[], () => {});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const url = selectedRouteId
        ? `${API}/api/routes/${selectedRouteId}/students`
        : `${API}/api/students`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) setPins(await res.json() as StudentPin[]);
    }
    load();
  }, [selectedRouteId]);

  return null;
}
