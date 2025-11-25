import { useState, useCallback, useRef } from 'react';
import type { District } from '../types';
import { MapView } from './MapView';
import './ViewMode.css';

interface ViewModeProps {
  districts: District[];
}

export function ViewMode({ districts }: ViewModeProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const handleDistrictHover = useCallback((districtId: string | null) => {
    if (districtId) {
      const district = districts.find(d => d.id === districtId);
      setHoveredDistrict(district || null);
    } else {
      setHoveredDistrict(null);
      setTooltipPosition(null);
    }
  }, [districts]);

  const handleDistrictClick = useCallback((districtId: string) => {
    // Click handler kept for MapView compatibility, but no toast shown
  }, []);

  const handleMapMouseMove = useCallback((e: React.MouseEvent) => {
    if (hoveredDistrict && mapWrapperRef.current) {
      const rect = mapWrapperRef.current.getBoundingClientRect();
      setTooltipPosition({ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      });
    }
  }, [hoveredDistrict]);

  return (
    <div className="view-mode-container">
      <div className="view-mode-content">
        <div className="view-mode-header">
          <h2>Selaa kaupunginosia</h2>
          <p className="mobile-hide">Vie hiiri kaupunginosan päälle nähdäksesi sen nimen</p>
        </div>
        <div 
          className="view-mode-map-wrapper"
          ref={mapWrapperRef}
          onMouseMove={handleMapMouseMove}
        >
        <MapView
          districts={districts}
          highlightedDistrictId={null}
          onDistrictHover={handleDistrictHover}
          onDistrictClick={handleDistrictClick}
        />
        {hoveredDistrict && tooltipPosition && (
          <div
            className="district-tooltip"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            {hoveredDistrict.name}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

