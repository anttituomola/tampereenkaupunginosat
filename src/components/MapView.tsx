import type { District } from '../types';
import './MapView.css';

interface MapViewProps {
  districts: District[];
  highlightedDistrictId: string | null;
}

export function MapView({ districts, highlightedDistrictId }: MapViewProps) {
  return (
    <div className="map-container">
      <svg
        viewBox="0 0 800 600"
        className="map-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {districts.map((district) => (
          <path
            key={district.id}
            d={district.path}
            className={`district-path ${
              district.id === highlightedDistrictId ? 'highlighted' : ''
            }`}
          />
        ))}
      </svg>
    </div>
  );
}

