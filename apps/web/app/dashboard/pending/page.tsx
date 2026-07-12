'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import type { PendingAssignment } from '@sla/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function PendingPage() {
  const supabase = createBrowserClient();
  const [items, setItems] = useState<PendingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPending() {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API}/api/assignments/pending`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) setItems(await res.json() as PendingAssignment[]);
    setLoading(false);
  }

  async function confirm(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${API}/api/assignments/${id}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function flag(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${API}/api/assignments/${id}/flag`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Flagged for staff review' }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Supabase Realtime — new pending assignments appear without refresh
  useEffect(() => {
    fetchPending();
    const channel = supabase
      .channel('route_assignments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'route_assignments' }, () => {
        fetchPending();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        Pending Assignments
        {items.length > 0 && (
          <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No pending assignments — all caught up.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.student?.name}</p>
                  <p className="text-sm text-gray-500">
                    Grade {item.student?.grade} · Parent: {item.student?.parent_phone}
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {item.route_name}
                </span>
              </div>

              {item.student_location && (
                <div className="flex gap-6 text-sm text-gray-600">
                  <span>
                    Distance: <strong>{item.road_distance_km?.toFixed(1)} km</strong>
                  </span>
                  <span>
                    Travel time: <strong>{item.travel_time_minutes} min</strong>
                  </span>
                  <span>
                    Confidence:{' '}
                    <strong
                      className={item.student_location.geocode_confidence < 0.5 ? 'text-red-600' : 'text-green-600'}
                    >
                      {Math.round(item.student_location.geocode_confidence * 100)}%
                    </strong>
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => confirm(item.id)}
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-700 text-white text-sm rounded-lg"
                >
                  Confirm Assignment
                </button>
                <button
                  onClick={() => flag(item.id)}
                  className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                  Flag for Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
