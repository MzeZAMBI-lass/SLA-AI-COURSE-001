'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@/lib/supabase-client';
import RouteList from '@/components/RouteList/RouteList';
import type { Route } from '@sla/shared';

// Leaflet cannot run server-side
const RouteMap = dynamic(() => import('@/components/Map/RouteMap'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function RoutesPage() {
  const supabase = createBrowserClient();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/api/routes`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) setRoutes(await res.json() as Route[]);
    }
    load();
  }, []);

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      <aside className="w-72 flex-shrink-0 overflow-y-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">Routes</h1>
        <RouteList
          routes={routes}
          selectedId={selectedRouteId}
          onSelect={setSelectedRouteId}
        />
      </aside>
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
        <RouteMap selectedRouteId={selectedRouteId} />
      </div>
    </div>
  );
}
