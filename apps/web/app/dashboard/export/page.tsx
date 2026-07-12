'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import type { Route } from '@sla/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ExportPage() {
  const supabase = createBrowserClient();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedId, setSelectedId] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

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

  async function exportCsv() {
    setExporting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const url = selectedId === 'all'
      ? `${API}/api/export/csv`
      : `${API}/api/export/csv?route_id=${selectedId}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    if (res.ok) {
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `route-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
    setExporting(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Export Route Sheets</h1>
      <p className="text-sm text-gray-500 mb-6">
        Download a CSV of student route assignments for distribution to drivers.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Route</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.route_name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={exportCsv}
          disabled={exporting}
          className="w-full py-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {exporting ? 'Generating…' : 'Download CSV'}
        </button>
      </div>
    </div>
  );
}
