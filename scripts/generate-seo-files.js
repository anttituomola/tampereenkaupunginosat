import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://tampereenkaupunginosat.fi';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Ensure dist exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('dist directory not found. Run vite build first.');
  process.exit(1);
}

// Load district info
const infoPath = path.join(__dirname, '..', 'public', 'district-info.json');
const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));

// robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');

// sitemap.xml
const staticRoutes = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/view', priority: '0.9', changefreq: 'weekly' },
  { url: '/locate', priority: '0.8', changefreq: 'weekly' },
  { url: '/kaupunginosat', priority: '0.9', changefreq: 'weekly' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
];

const districtRoutes = info.map(district => ({
  url: `/kaupunginosa/${district.id}`,
  priority: '0.7',
  changefreq: 'monthly',
}));

const allRoutes = [...staticRoutes, ...districtRoutes];

const today = new Date().toISOString().split('T')[0];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');

console.log(`Generated robots.txt and sitemap.xml with ${allRoutes.length} URLs in ${DIST_DIR}`);
