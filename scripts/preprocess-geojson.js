import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const PADDING = 20; // Padding around the map

// Load GeoJSON
const geojsonPath = path.join(__dirname, '..', 'KH_TILASTO.json');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

/**
 * Calculate bounding box from all features
 */
function calculateBounds(features) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  features.forEach(feature => {
    const coords = feature.geometry.coordinates;
    
    function processCoords(coords) {
      if (typeof coords[0] === 'number') {
        // Single coordinate pair
        const [x, y] = coords;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      } else {
        // Nested array
        coords.forEach(coord => processCoords(coord));
      }
    }
    
    processCoords(coords);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Project coordinates to SVG space
 */
function projectToSVG(x, y, bounds, viewport) {
  const { minX, minY, maxX, maxY } = bounds;
  const { width, height, padding } = viewport;
  
  const dataWidth = maxX - minX;
  const dataHeight = maxY - minY;
  
  // Calculate scale to fit with padding
  const scaleX = (width - 2 * padding) / dataWidth;
  const scaleY = (height - 2 * padding) / dataHeight;
  const scale = Math.min(scaleX, scaleY); // Use smaller scale to maintain aspect ratio
  
  // Center the map
  const scaledWidth = dataWidth * scale;
  const scaledHeight = dataHeight * scale;
  const offsetX = (width - scaledWidth) / 2;
  const offsetY = (height - scaledHeight) / 2;
  
  // Transform coordinates
  const svgX = offsetX + (x - minX) * scale;
  // Flip Y-axis (SVG Y increases downward, geographic Y increases upward)
  const svgY = height - (offsetY + (y - minY) * scale);
  
  return [svgX, svgY];
}

/**
 * Convert a ring (array of coordinates) to SVG path string
 */
function ringToPath(ring, bounds, viewport) {
  if (ring.length === 0) return '';
  
  const pathParts = [];
  ring.forEach((coord, index) => {
    const [x, y] = projectToSVG(coord[0], coord[1], bounds, viewport);
    if (index === 0) {
      pathParts.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
    } else {
      pathParts.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  });
  pathParts.push('Z');
  return pathParts.join(' ');
}

/**
 * Convert a polygon to SVG path string
 */
function polygonToPath(polygon, bounds, viewport) {
  const [outerRing, ...innerRings] = polygon;
  let path = ringToPath(outerRing, bounds, viewport);
  
  // Add inner rings (holes) if any
  innerRings.forEach(ring => {
    path += ' ' + ringToPath(ring, bounds, viewport);
  });
  
  return path;
}

/**
 * Convert MultiPolygon to SVG path string
 */
function multipolygonToPath(multipolygon, bounds, viewport) {
  return multipolygon.map(polygon => polygonToPath(polygon, bounds, viewport)).join(' ');
}

/**
 * Simplify path by removing duplicate consecutive points
 */
function simplifyPath(pathString) {
  // Basic simplification: remove duplicate consecutive points
  // This is a simple approach; more advanced simplification could use Douglas-Peucker
  return pathString.replace(/(\d+\.\d+)\s+\1/g, '$1');
}

// Process features
const bounds = calculateBounds(geojson.features);
const viewport = {
  width: SVG_WIDTH,
  height: SVG_HEIGHT,
  padding: PADDING
};

const districts = geojson.features.map(feature => {
  const geometry = feature.geometry;
  let pathString = '';
  
  if (geometry.type === 'MultiPolygon') {
    pathString = multipolygonToPath(geometry.coordinates, bounds, viewport);
  } else if (geometry.type === 'Polygon') {
    pathString = polygonToPath(geometry.coordinates, bounds, viewport);
  }
  
  // Simplify path
  pathString = simplifyPath(pathString);
  
  return {
    id: feature.id || feature.properties?.TUNNUS || `district-${feature.properties?.NIMI}`,
    name: feature.properties?.NIMI || 'Unknown',
    path: pathString
  };
});

// Output JSON
const outputPath = path.join(__dirname, '..', 'public', 'tampere-districts.json');
fs.writeFileSync(outputPath, JSON.stringify(districts, null, 2), 'utf8');

console.log(`Processed ${districts.length} districts`);
console.log(`Bounds: ${bounds.minX}, ${bounds.minY} to ${bounds.maxX}, ${bounds.maxY}`);
console.log(`Output written to: ${outputPath}`);

