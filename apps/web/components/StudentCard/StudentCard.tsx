import type { Student, StudentLocation } from '@sla/shared';

interface Props {
  student: Student;
  location?: StudentLocation | null;
  routeName?: string;
}

export default function StudentCard({ student, location, routeName }: Props) {
  const confidence = location?.geocode_confidence ?? 0;
  const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low';
  const confidenceClass = confidence >= 0.8
    ? 'text-green-700 bg-green-50'
    : confidence >= 0.5
    ? 'text-yellow-700 bg-yellow-50'
    : 'text-red-700 bg-red-50';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{student.name}</p>
          <p className="text-xs text-gray-500">Grade {student.grade}</p>
        </div>
        {routeName && (
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{routeName}</span>
        )}
      </div>

      {location && (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span>Distance: <strong>{location.road_distance_km?.toFixed(1)} km</strong></span>
          <span>Travel: <strong>{location.travel_time_minutes} min</strong></span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${confidenceClass}`}>
            {confidenceLabel} confidence
          </span>
          <span className="text-gray-400 capitalize">{location.geocode_source}</span>
        </div>
      )}
    </div>
  );
}
