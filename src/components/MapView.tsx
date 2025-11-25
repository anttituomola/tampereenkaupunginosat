import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { District } from '../types';
import './MapView.css';

interface MapViewProps {
  districts: District[];
  highlightedDistrictId?: string | null;
  onDistrictClick?: (districtId: string) => void;
  onDistrictHover?: (districtId: string | null) => void;
  selectedDistrictId?: string | null;
  wrongDistrictId?: string | null;
}

// SVG dimensions matching the basemap PNG (map_tampere.png)
const SVG_WIDTH = 4204;
const SVG_HEIGHT = 3613;
const ZOOM_PADDING = 300; // Padding around highlighted district
const MIN_ZOOM_RATIO = 0.5; // Minimum zoom area (50% of map)
const ZOOM_STEP = 0.2; // Zoom step (20% per click)

/**
 * Calculate bounding box from SVG path string
 */
function getPathBounds(pathString: string) {
  // Match all coordinate pairs (M, L commands, and also handle lowercase)
  const coords = pathString.match(/[MLml]\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g);
  if (!coords || coords.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasValidCoords = false;

  coords.forEach(coord => {
    const match = coord.match(/[MLml]\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/);
    if (match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      
      // Only process valid numbers
      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hasValidCoords = true;
      }
    }
  });

  // Return null if no valid coordinates were found
  if (!hasValidCoords || minX === Infinity || minY === Infinity) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

export function MapView({ 
  districts, 
  highlightedDistrictId, 
  onDistrictClick,
  onDistrictHover,
  selectedDistrictId,
  wrongDistrictId
}: MapViewProps) {
  const [manualZoom, setManualZoom] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [animatedViewBox, setAnimatedViewBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const animationRef = useRef<number | null>(null);
  const startViewBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const targetViewBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Pinch zoom state
  const pinchStartRef = useRef<{ 
    distance: number; 
    center: { x: number; y: number }; 
    screenCenter: { x: number; y: number };
    viewBox: { x: number; y: number; width: number; height: number } 
  } | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Full viewBox (initial state)
  const fullViewBox = useMemo(() => ({
    x: 0,
    y: 0,
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
  }), []);

  // Calculate automatic viewBox based on highlighted district
  const autoViewBox = useMemo(() => {
    if (!highlightedDistrictId) {
      return { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
    }

    const highlightedDistrict = districts.find(d => d.id === highlightedDistrictId);
    if (!highlightedDistrict) {
      return { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
    }

    const bounds = getPathBounds(highlightedDistrict.path);
    if (!bounds) {
      return { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
    }

    // Clamp bounds to SVG dimensions to handle any out-of-bounds coordinates
    const clampedMinX = Math.max(0, Math.min(bounds.minX, SVG_WIDTH));
    const clampedMinY = Math.max(0, Math.min(bounds.minY, SVG_HEIGHT));
    const clampedMaxX = Math.max(0, Math.min(bounds.maxX, SVG_WIDTH));
    const clampedMaxY = Math.max(0, Math.min(bounds.maxY, SVG_HEIGHT));

    // If bounds are invalid or outside the map, show full view
    if (clampedMinX >= clampedMaxX || clampedMinY >= clampedMaxY ||
        clampedMinX >= SVG_WIDTH || clampedMinY >= SVG_HEIGHT ||
        clampedMaxX <= 0 || clampedMaxY <= 0) {
      return { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
    }

    // Calculate dimensions and center
    const width = clampedMaxX - clampedMinX;
    const height = clampedMaxY - clampedMinY;
    const centerX = (clampedMinX + clampedMaxX) / 2;
    const centerY = (clampedMinY + clampedMaxY) / 2;

    // Calculate zoomed viewBox with padding
    const paddedWidth = Math.max(width + ZOOM_PADDING * 2, SVG_WIDTH * MIN_ZOOM_RATIO);
    const paddedHeight = Math.max(height + ZOOM_PADDING * 2, SVG_HEIGHT * MIN_ZOOM_RATIO);

    // Calculate desired viewBox centered on the district
    let viewX = centerX - paddedWidth / 2;
    let viewY = centerY - paddedHeight / 2;
    let viewWidth = paddedWidth;
    let viewHeight = paddedHeight;

    // Clamp to ensure viewBox stays within SVG bounds
    if (viewX < 0) {
      viewX = 0;
    } else if (viewX + viewWidth > SVG_WIDTH) {
      viewX = SVG_WIDTH - viewWidth;
      // If still negative, center the district in the view
      if (viewX < 0) {
        viewX = 0;
        viewWidth = SVG_WIDTH;
      }
    }

    if (viewY < 0) {
      viewY = 0;
    } else if (viewY + viewHeight > SVG_HEIGHT) {
      viewY = SVG_HEIGHT - viewHeight;
      // If still negative, center the district in the view
      if (viewY < 0) {
        viewY = 0;
        viewHeight = SVG_HEIGHT;
      }
    }

    // Ensure the district is visible - if not, expand the viewBox
    if (clampedMinX < viewX || clampedMaxX > viewX + viewWidth) {
      // Expand horizontally to include the district
      const neededWidth = Math.max(viewWidth, clampedMaxX - clampedMinX + ZOOM_PADDING * 2);
      viewWidth = Math.min(neededWidth, SVG_WIDTH);
      viewX = Math.max(0, Math.min(SVG_WIDTH - viewWidth, centerX - viewWidth / 2));
    }

    if (clampedMinY < viewY || clampedMaxY > viewY + viewHeight) {
      // Expand vertically to include the district
      const neededHeight = Math.max(viewHeight, clampedMaxY - clampedMinY + ZOOM_PADDING * 2);
      viewHeight = Math.min(neededHeight, SVG_HEIGHT);
      viewY = Math.max(0, Math.min(SVG_HEIGHT - viewHeight, centerY - viewHeight / 2));
    }

    // Final safety check - ensure viewBox is valid
    if (viewWidth <= 0 || viewHeight <= 0 || viewX < 0 || viewY < 0 ||
        viewX + viewWidth > SVG_WIDTH || viewY + viewHeight > SVG_HEIGHT) {
      return { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
    }

    return { x: viewX, y: viewY, width: viewWidth, height: viewHeight };
  }, [districts, highlightedDistrictId]);

  // Animation function using easeInOutCubic
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Animate viewBox transition
  const animateViewBox = useCallback((
    start: { x: number; y: number; width: number; height: number },
    target: { x: number; y: number; width: number; height: number },
    duration: number = 1000
  ) => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startViewBoxRef.current = start;
    targetViewBoxRef.current = target;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!startTimeRef.current || !startViewBoxRef.current || !targetViewBoxRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      const current = {
        x: startViewBoxRef.current.x + (targetViewBoxRef.current.x - startViewBoxRef.current.x) * eased,
        y: startViewBoxRef.current.y + (targetViewBoxRef.current.y - startViewBoxRef.current.y) * eased,
        width: startViewBoxRef.current.width + (targetViewBoxRef.current.width - startViewBoxRef.current.width) * eased,
        height: startViewBoxRef.current.height + (targetViewBoxRef.current.height - startViewBoxRef.current.height) * eased,
      };

      setAnimatedViewBox(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        setAnimatedViewBox(null);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Reset to auto zoom when district changes and trigger initial zoom animation
  useEffect(() => {
    if (highlightedDistrictId) {
      setManualZoom(null);
      
      // Start with full view
      const startBox = fullViewBox;
      setAnimatedViewBox(startBox);
      
      // After 1 second, animate to the highlighted district
      const timer = setTimeout(() => {
        animateViewBox(startBox, autoViewBox, 1000);
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      setAnimatedViewBox(fullViewBox);
    }
  }, [highlightedDistrictId, fullViewBox, autoViewBox, animateViewBox]);

  // Use manual zoom if set, otherwise use animated viewBox or auto zoom
  const currentViewBox = manualZoom || animatedViewBox || autoViewBox;
  const viewBoxString = `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`;

  // Get the center point to zoom around (highlighted district center if available, otherwise viewBox center)
  const zoomCenter = useMemo(() => {
    if (highlightedDistrictId) {
      const highlightedDistrict = districts.find(d => d.id === highlightedDistrictId);
      if (highlightedDistrict) {
        const bounds = getPathBounds(highlightedDistrict.path);
        if (bounds) {
          return {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2,
          };
        }
      }
    }
    // Fallback to current viewBox center
    return {
      x: currentViewBox.x + currentViewBox.width / 2,
      y: currentViewBox.y + currentViewBox.height / 2,
    };
  }, [districts, highlightedDistrictId, currentViewBox]);

  const handleZoomIn = useCallback(() => {
    const newWidth = currentViewBox.width * (1 - ZOOM_STEP);
    const newHeight = currentViewBox.height * (1 - ZOOM_STEP);
    
    // Don't zoom in too much
    if (newWidth < SVG_WIDTH * 0.1 || newHeight < SVG_HEIGHT * 0.1) return;

    // Zoom around the highlighted district center (or current center)
    let newX = Math.max(0, Math.min(SVG_WIDTH - newWidth, zoomCenter.x - newWidth / 2));
    let newY = Math.max(0, Math.min(SVG_HEIGHT - newHeight, zoomCenter.y - newHeight / 2));
    
    // If a district is highlighted, ensure it stays visible
    if (highlightedDistrictId) {
      const highlightedDistrict = districts.find(d => d.id === highlightedDistrictId);
      if (highlightedDistrict) {
        const bounds = getPathBounds(highlightedDistrict.path);
        if (bounds) {
          // Clamp bounds to SVG dimensions
          const clampedMinX = Math.max(0, Math.min(bounds.minX, SVG_WIDTH));
          const clampedMinY = Math.max(0, Math.min(bounds.minY, SVG_HEIGHT));
          const clampedMaxX = Math.max(0, Math.min(bounds.maxX, SVG_WIDTH));
          const clampedMaxY = Math.max(0, Math.min(bounds.maxY, SVG_HEIGHT));
          
          // Adjust viewBox to ensure district is visible
          if (clampedMinX < newX) {
            newX = Math.max(0, clampedMinX - ZOOM_PADDING);
          } else if (clampedMaxX > newX + newWidth) {
            newX = Math.min(SVG_WIDTH - newWidth, clampedMaxX + ZOOM_PADDING - newWidth);
          }
          
          if (clampedMinY < newY) {
            newY = Math.max(0, clampedMinY - ZOOM_PADDING);
          } else if (clampedMaxY > newY + newHeight) {
            newY = Math.min(SVG_HEIGHT - newHeight, clampedMaxY + ZOOM_PADDING - newHeight);
          }
        }
      }
    }
    
    setManualZoom({ x: newX, y: newY, width: newWidth, height: newHeight });
  }, [currentViewBox, zoomCenter, highlightedDistrictId, districts]);

  const handleZoomOut = useCallback(() => {
    const newWidth = currentViewBox.width * (1 + ZOOM_STEP);
    const newHeight = currentViewBox.height * (1 + ZOOM_STEP);
    
    // Don't zoom out beyond full view
    if (newWidth > SVG_WIDTH || newHeight > SVG_HEIGHT) {
      setManualZoom(null);
      return;
    }

    // Zoom around the highlighted district center (or current center)
    let newX = Math.max(0, Math.min(SVG_WIDTH - newWidth, zoomCenter.x - newWidth / 2));
    let newY = Math.max(0, Math.min(SVG_HEIGHT - newHeight, zoomCenter.y - newHeight / 2));
    
    // If a district is highlighted, ensure it stays visible
    if (highlightedDistrictId) {
      const highlightedDistrict = districts.find(d => d.id === highlightedDistrictId);
      if (highlightedDistrict) {
        const bounds = getPathBounds(highlightedDistrict.path);
        if (bounds) {
          // Clamp bounds to SVG dimensions
          const clampedMinX = Math.max(0, Math.min(bounds.minX, SVG_WIDTH));
          const clampedMinY = Math.max(0, Math.min(bounds.minY, SVG_HEIGHT));
          const clampedMaxX = Math.max(0, Math.min(bounds.maxX, SVG_WIDTH));
          const clampedMaxY = Math.max(0, Math.min(bounds.maxY, SVG_HEIGHT));
          
          // Adjust viewBox to ensure district is visible
          if (clampedMinX < newX) {
            newX = Math.max(0, clampedMinX - ZOOM_PADDING);
          } else if (clampedMaxX > newX + newWidth) {
            newX = Math.min(SVG_WIDTH - newWidth, clampedMaxX + ZOOM_PADDING - newWidth);
          }
          
          if (clampedMinY < newY) {
            newY = Math.max(0, clampedMinY - ZOOM_PADDING);
          } else if (clampedMaxY > newY + newHeight) {
            newY = Math.min(SVG_HEIGHT - newHeight, clampedMaxY + ZOOM_PADDING - newHeight);
          }
        }
      }
    }
    
    setManualZoom({ x: newX, y: newY, width: newWidth, height: newHeight });
  }, [currentViewBox, zoomCenter, highlightedDistrictId, districts]);

  const handleResetZoom = useCallback(() => {
    setManualZoom(null);
  }, []);

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Convert screen coordinates to SVG coordinates
  const screenToSvg = useCallback((screenX: number, screenY: number, viewBox: { x: number; y: number; width: number; height: number }, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const svgX = viewBox.x + (screenX - rect.left) / rect.width * viewBox.width;
    const svgY = viewBox.y + (screenY - rect.top) / rect.height * viewBox.height;
    return { x: svgX, y: svgY };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getTouchDistance(touch1, touch2);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      if (mapWrapperRef.current) {
        const svgCenter = screenToSvg(centerX, centerY, currentViewBox, mapWrapperRef.current);
        pinchStartRef.current = {
          distance,
          center: svgCenter,
          screenCenter: { x: centerX, y: centerY },
          viewBox: { ...currentViewBox }
        };
      }
    }
  }, [currentViewBox, getTouchDistance, screenToSvg]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current && mapWrapperRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getTouchDistance(touch1, touch2);
      // When fingers move apart (distance increases), zoom in (decrease viewBox)
      const scale = pinchStartRef.current.distance / currentDistance;
      
      const startViewBox = pinchStartRef.current.viewBox;
      const newWidth = startViewBox.width * scale;
      const newHeight = startViewBox.height * scale;
      
      // Limit zoom levels
      if (newWidth < SVG_WIDTH * 0.1 || newHeight < SVG_HEIGHT * 0.1) return;
      if (newWidth > SVG_WIDTH || newHeight > SVG_HEIGHT) return;
      
      // Get current pinch center in screen coordinates
      const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
      const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
      
      const rect = mapWrapperRef.current.getBoundingClientRect();
      
      // Calculate pan delta (movement of fingers) in screen coordinates
      const panDeltaX = currentCenterX - pinchStartRef.current.screenCenter.x;
      const panDeltaY = currentCenterY - pinchStartRef.current.screenCenter.y;
      
      // Convert pan delta from screen pixels to SVG coordinates using the NEW viewBox size
      // Moving fingers right should move map left, so we invert
      const svgPanDeltaX = -(panDeltaX / rect.width) * newWidth;
      const svgPanDeltaY = -(panDeltaY / rect.height) * newHeight;
      
      // Calculate what SVG point was under the initial pinch center
      const initialSvgPoint = pinchStartRef.current.center;
      
      // Calculate the relative position of the initial pinch center within the viewport (0 to 1)
      const initialScreenX = pinchStartRef.current.screenCenter.x;
      const initialScreenY = pinchStartRef.current.screenCenter.y;
      const relativeX = (initialScreenX - rect.left) / rect.width;
      const relativeY = (initialScreenY - rect.top) / rect.height;
      
      // Calculate new viewBox position:
      // 1. Start from keeping the initial SVG point fixed (zoom centering)
      // 2. Apply pan delta (finger movement)
      let newX = initialSvgPoint.x - (relativeX * newWidth) + svgPanDeltaX;
      let newY = initialSvgPoint.y - (relativeY * newHeight) + svgPanDeltaY;
      
      // Clamp to SVG bounds
      newX = Math.max(0, Math.min(SVG_WIDTH - newWidth, newX));
      newY = Math.max(0, Math.min(SVG_HEIGHT - newHeight, newY));
      
      setManualZoom({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [getTouchDistance, screenToSvg]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2 && pinchStartRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    pinchStartRef.current = null;
  }, []);

  const handleDistrictClick = useCallback((districtId: string) => {
    if (onDistrictClick) {
      onDistrictClick(districtId);
    }
  }, [onDistrictClick]);

  const handleDistrictHover = useCallback((districtId: string | null) => {
    if (onDistrictHover) {
      onDistrictHover(districtId);
    }
  }, [onDistrictHover]);

  // Determine if we're in locate mode (has click handler but no highlight)
  const isLocateMode = onDistrictClick !== undefined && !highlightedDistrictId;

  return (
    <div className="map-container">
      <div 
        className={`map-wrapper ${isLocateMode ? 'locate-mode' : ''}`}
        ref={mapWrapperRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          viewBox={viewBoxString}
          className="map-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Basemap PNG as background */}
          <image
            href="/map_tampere.png"
            x="0"
            y="0"
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            preserveAspectRatio="none"
          />
          
          {/* Districts overlay */}
          {districts.map((district) => {
            const isHighlighted = district.id === highlightedDistrictId;
            const isSelected = district.id === selectedDistrictId;
            const isWrong = district.id === wrongDistrictId;
            
            let className = 'district-path';
            if (isWrong) {
              className += ' wrong';
            } else if (isHighlighted) {
              className += ' highlighted';
            } else if (isSelected) {
              className += ' selected';
            }
            
            return (
              <path
                key={district.id}
                d={district.path}
                className={className}
                onClick={() => handleDistrictClick(district.id)}
                onMouseEnter={() => handleDistrictHover(district.id)}
                onMouseLeave={() => handleDistrictHover(null)}
                style={{ cursor: onDistrictClick ? 'pointer' : onDistrictHover ? 'pointer' : 'default' }}
              />
            );
          })}
        </svg>
        
        {/* Zoom controls */}
        <div className="zoom-controls">
          <button
            className="zoom-button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <button
            className="zoom-button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
          <button
            className="zoom-button zoom-reset"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
            title="Reset to full view"
          >
            ⌂
          </button>
        </div>
      </div>
    </div>
  );
}
