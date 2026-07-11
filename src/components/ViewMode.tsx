import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { District } from '../types';
import { MapView } from './MapView';
import './ViewMode.css';

interface ViewModeProps {
  districts: District[];
}

export function ViewMode({ districts }: ViewModeProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
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
    const district = districts.find(d => d.id === districtId);
    if (district) {
      setSelectedDistrict(district);
    }
  }, [districts]);

  const handleClearSelection = useCallback(() => {
    setSelectedDistrict(null);
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

  useEffect(() => {
    document.title = 'Selaa kaupunginosia – Tampereen kaupunginosat';
    setMetaDescription('Selaa Tampereen kaupunginosia kartalla. Vie hiiri alueen päälle tai napauta sitä mobiilissa nähdäksesi nimen ja zoomataksesi lähelle.');
    return () => {
      document.title = 'Tampereen kaupunginosat';
      setMetaDescription('Tutustu Tampereen kaupunginosiin, opi niiden nimet ja sijainnit.');
    };
  }, []);

  return (
    <div className="view-mode-container">
      <div className="view-mode-content">
        <div className="view-mode-header">
          <h2>Selaa kaupunginosia</h2>
          <p className="mobile-hide">Vie hiiri kaupunginosan päälle nähdäksesi sen nimen</p>
          <p className="desktop-hide">Napauta kaupunginosaa zoomataksesi lähelle</p>
          {selectedDistrict && (
            <div className="selected-district-info">
              <h3>{selectedDistrict.name}</h3>
              <Link
                to={`/kaupunginosa/${selectedDistrict.id}`}
                className="district-info-link"
              >
                Lisätietoja →
              </Link>
              <button
                className="clear-selection-button"
                onClick={handleClearSelection}
                type="button"
              >
                Näytä koko kartta
              </button>
            </div>
          )}
        </div>
        <div
          className="view-mode-map-wrapper"
          ref={mapWrapperRef}
          onMouseMove={handleMapMouseMove}
        >
          <MapView
            districts={districts}
            highlightedDistrictId={selectedDistrict?.id ?? null}
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

function setMetaDescription(content: string) {
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.content = content;
}
