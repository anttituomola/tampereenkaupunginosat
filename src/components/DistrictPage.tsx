import { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { District, DistrictInfo } from '../types';
import { MapView } from './MapView';
import './DistrictPage.css';

interface DistrictPageProps {
  districts: District[];
  districtInfo: DistrictInfo[];
}

export function DistrictPage({ districts, districtInfo }: DistrictPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const district = useMemo(() =>
    districts.find(d => d.id === id) || null,
    [districts, id]
  );

  const info = useMemo(() =>
    districtInfo.find(i => i.id === id) || null,
    [districtInfo, id]
  );

  useEffect(() => {
    if (district && info) {
      document.title = `${district.name} – Tampereen kaupunginosat`;
      setMetaDescription(info.description);
    } else {
      document.title = 'Kaupunginosaa ei löytynyt – Tampereen kaupunginosat';
      setMetaDescription('Etsimääsi Tampereen kaupunginosaa ei löytynyt.');
    }
    return () => {
      document.title = 'Tampereen kaupunginosat';
      setMetaDescription('Tutustu Tampereen kaupunginosiin, opi niiden nimet ja sijainnit.');
    };
  }, [district, info]);

  if (!district || !info) {
    return (
      <div className="district-page district-page-not-found">
        <h1>Kaupunginosaa ei löytynyt</h1>
        <p>Valitsemaasi kaupunginosaa ei löydy tietokannasta.</p>
        <Link to="/" className="district-page-back">
          ← Takaisin etusivulle
        </Link>
      </div>
    );
  }

  const canonicalUrl = `https://tampereenkaupunginosat.fi/kaupunginosa/${district.id}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${district.name}, Tampere`,
    description: info.description,
    containedInPlace: {
      '@type': 'City',
      name: 'Tampere',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '61.4978',
      longitude: '23.7610',
    },
  };

  return (
    <article className="district-page">
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      <header className="district-page-header">
        <nav aria-label="Breadcrumb" className="district-breadcrumb">
          <Link to="/">Etusivu</Link>
          <span aria-hidden="true">/</span>
          <Link to="/view">Selaa</Link>
          <span aria-hidden="true">/</span>
          <span className="current">{district.name}</span>
        </nav>
        <h1>{district.name}</h1>
        <p className="district-subtitle">
          {info.suuralueDisplay} · {info.suunnittelualue}
        </p>
      </header>

      <section className="district-page-map" aria-label="Kaupunginosan sijainti">
        <MapView
          districts={districts}
          highlightedDistrictId={district.id}
        />
      </section>

      <section className="district-page-info">
        <h2>Tietoja alueesta</h2>
        <p className="district-description">{info.description}</p>
        <dl className="district-stats">
          <div>
            <dt>Suuralue</dt>
            <dd>{info.suuralueDisplay}</dd>
          </div>
          <div>
            <dt>Suunnittelualue</dt>
            <dd>{info.suunnittelualue}</dd>
          </div>
          <div>
            <dt>Pinta-ala</dt>
            <dd>{info.areaHa} ha</dd>
          </div>
          {info.population2020 !== null && (
            <div>
              <dt>Asukkaita (2020)</dt>
              <dd>{info.population2020.toLocaleString('fi-FI')}</dd>
            </div>
          )}
        </dl>

        <div className="district-page-actions">
          <Link to="/" className="district-page-back">
            ← Takaisin visaan
          </Link>
          <button
            className="district-page-random"
            onClick={() => {
              const random = districts[Math.floor(Math.random() * districts.length)];
              navigate(`/kaupunginosa/${random.id}`);
            }}
            type="button"
          >
            Satunnainen kaupunginosa
          </button>
        </div>
      </section>

      <footer className="district-page-footer">
        <p>
          <strong>Lähde:</strong>{' '}
          <a
            href="https://www.tampere.fi/sites/default/files/2022-04/Tampereen-kaupunki-tilastollinen-vuosikirja-2018-2020-FINAL.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tampereen kaupungin tilastollinen vuosikirja 2018–2020
          </a>
          {info.population2020 === null && ' (uudempi alue, tilastotietoja ei saatavilla vuosikirjasta)'}
        </p>
      </footer>

      <link rel="canonical" href={canonicalUrl} />
    </article>
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
