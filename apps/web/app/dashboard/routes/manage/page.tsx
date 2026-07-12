'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import type { Route } from '@sla/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface RouteForm {
  route_name: string;
  bus_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
}

const EMPTY_FORM: RouteForm = {
  route_name: '',
  bus_number: '',
  driver_name: '',
  driver_phone: '',
  capacity: 15,
};

export default function ManageRoutesPage() {
  const supabase = createBrowserClient();
  const [routes, setRoutes] = useState<(Route & { current_count?: number })[]>([]);
  const [form, setForm] = useState<RouteForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function authHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  }

  async function load() {
    const headers = await authHeader();
    const res = await fetch(`${API}/api/routes`, { headers });
    if (res.ok) setRoutes(await res.json() as Route[]);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const headers = await authHeader();
    const res = await fetch(`${API}/api/routes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json() as { error: string }).error);
    } else {
      setForm(EMPTY_FORM);
      await load();
    }
    setSaving(false);
  }

  async function deactivate(id: string) {
    const headers = await authHeader();
    await fetch(`${API}/api/routes/${id}`, { method: 'DELETE', headers });
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Manage Routes</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-medium text-gray-900 mb-4">Add New Route</h2>
        <form onSubmit={create} className="grid grid-cols-2 gap-4">
          {[
            { name: 'route_name', label: 'Route Name', type: 'text' },
            { name: 'bus_number', label: 'Bus Number', type: 'text' },
            { name: 'driver_name', label: 'Driver Name', type: 'text' },
            { name: 'driver_phone', label: 'Driver Phone', type: 'tel' },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                required
                type={f.type}
                value={form[f.name as keyof RouteForm]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              required
              type="number"
              min={1}
              max={60}
              value={form.capacity}
              onChange={(e) => setForm((prev) => ({ ...prev, capacity: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
          <div className="col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-brand-500 hover:bg-brand-700 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              {['Route', 'Bus', 'Driver', 'Occupancy', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {routes.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.route_name}</td>
                <td className="px-4 py-3 text-gray-600">{r.bus_number}</td>
                <td className="px-4 py-3 text-gray-600">{r.driver_name}</td>
                <td className="px-4 py-3">
                  <span className={(r.current_count ?? 0) >= r.capacity ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    {r.current_count ?? 0} / {r.capacity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deactivate(r.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {routes.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No routes yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
