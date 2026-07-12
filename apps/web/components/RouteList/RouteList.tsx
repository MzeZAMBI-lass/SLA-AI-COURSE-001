import type { Route } from '@sla/shared';

interface Props {
  routes: (Route & { current_count?: number })[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function RouteList({ routes, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          selectedId === null
            ? 'bg-brand-500 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        All Routes
      </button>
      {routes.map((r) => {
        const count = r.current_count ?? 0;
        const pct = Math.round((count / r.capacity) * 100);
        const isSelected = r.id === selectedId;
        return (
          <button
            key={r.id}
            onClick={() => onSelect(isSelected ? null : r.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg ${
              isSelected ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{r.route_name}</span>
              <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {count}/{r.capacity}
              </span>
            </div>
            <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-400' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
              {r.driver_name} · {r.bus_number}
            </p>
          </button>
        );
      })}
    </div>
  );
}
