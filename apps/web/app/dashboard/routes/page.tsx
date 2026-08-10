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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${API}/api/routes`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (!res.ok) {
          setError(`Couldn't load routes (${res.status}). Is the API reachable at ${API}?`);
          return;
        }
        setRoutes(await res.json() as Route[]);
      } catch {
        setError(`Couldn't reach the API at ${API}.`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        <aside className="w-72 flex-shrink-0 overflow-y-auto">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Routes</h1>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <RouteList
              routes={routes}
              selectedId={selectedRouteId}
              onSelect={setSelectedRouteId}
            />
          )}
        </aside>
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
          <RouteMap selectedRouteId={selectedRouteId} />
        </div>
      </div>
    </div>
  );
}
