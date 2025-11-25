import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG dimensions from your basemap PNG (higher resolution)
const SVG_WIDTH = 3153;
const SVG_HEIGHT = 2709;

// Extent from map.svg.pgw world file
// Top-left corner: (24473349.57141841202974319, 6846085.21167887561023235)
// Pixel size: 11.45642816537462494 meters per pixel
// Bottom-right: top-left + (width * pixel_size, -height * pixel_size)
const PIXEL_SIZE = 11.45642816537462494;
const MIN_X = 24473349.57141841202974319;
const MAX_X = MIN_X + (SVG_WIDTH * PIXEL_SIZE);
const MIN_Y = 6846085.21167887561023235 - (SVG_HEIGHT * PIXEL_SIZE);
const MAX_Y = 6846085.21167887561023235;

console.log(`SVG dimensions: ${SVG_WIDTH} x ${SVG_HEIGHT}`);
console.log(`EPSG:3067 extent:`);
console.log(`  MIN_X: ${MIN_X}`);
console.log(`  MAX_X: ${MAX_X}`);
console.log(`  MIN_Y: ${MIN_Y}`);
console.log(`  MAX_Y: ${MAX_Y}`);

// Load GeoJSON
const geojsonPath = path.join(__dirname, '..', 'KH_TILASTO.json');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

/**
 * Convert EPSG:3067 coordinate to SVG coordinate
 */
function projectToSVG(x, y) {
  // Normalize to 0-1 range
  const nx = (x - MIN_X) / (MAX_X - MIN_X);
  const ny = (y - MIN_Y) / (MAX_Y - MIN_Y);
  
  // Map to SVG pixels and flip Y (SVG Y increases downward)
  const sx = nx * SVG_WIDTH;
  const sy = SVG_HEIGHT - (ny * SVG_HEIGHT);
  
  return [sx, sy];
}

/**
 * Convert a ring (array of coordinates) to SVG path string
 */
function ringToPath(ring) {
  if (ring.length === 0) return '';
  
  const pathParts = [];
  ring.forEach((coord, index) => {
    const [x, y] = projectToSVG(coord[0], coord[1]);
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
function polygonToPath(polygon) {
  const [outerRing, ...innerRings] = polygon;
  let path = ringToPath(outerRing);
  
  // Add inner rings (holes) if any
  innerRings.forEach(ring => {
    path += ' ' + ringToPath(ring);
  });
  
  return path;
}

/**
 * Convert MultiPolygon to SVG path string
 */
function multipolygonToPath(multipolygon) {
  return multipolygon.map(polygon => polygonToPath(polygon)).join(' ');
}

/**
 * Simplify path by removing duplicate consecutive points
 */
function simplifyPath(pathString) {
  return pathString.replace(/(\d+\.\d+)\s+\1/g, '$1');
}

// Process districts
const districts = geojson.features.map(feature => {
  const geometry = feature.geometry;
  let pathString = '';
  
  if (geometry.type === 'MultiPolygon') {
    pathString = multipolygonToPath(geometry.coordinates);
  } else if (geometry.type === 'Polygon') {
    pathString = polygonToPath(geometry.coordinates);
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

console.log(`\nProcessed ${districts.length} districts`);
console.log(`Output written to: ${outputPath}`);

