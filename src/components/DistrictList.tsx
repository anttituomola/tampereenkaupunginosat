import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { DistrictInfo } from '../types';
import './DistrictList.css';

interface DistrictListProps {
  districtInfo: DistrictInfo[];
}

export function DistrictList({ districtInfo }: DistrictListProps) {
  useEffect(() => {
    document.title = 'Kaupunginosat – Tampereen kaupunginosat';
    setMetaDescription('Luettelo kaikista Tampereen kaupunginosista suuralueittain. Tutustu jokaiseen kaupunginosaan ja sen sijaintiin kartalla.');
    return () => {
      document.title = 'Tampereen kaupunginosat';
      setMetaDescription('Tutustu Tampereen kaupunginosiin, opi niiden nimet ja sijainnit.');
    };
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, DistrictInfo[]> = {};
    districtInfo.forEach(info => {
      if (!groups[info.suuralue]) {
        groups[info.suuralue] = [];
      }
      groups[info.suuralue].push(info);
    });
    // Sort districts alphabetically within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name, 'fi'));
    });
    return groups;
  }, [districtInfo]);

  const suuralueOrder = ['Keskinen', 'Koillinen', 'Kaakkoinen', 'Eteläinen', 'Lounainen', 'Luoteinen', 'Pohjoinen'];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tampereen kaupunginosat',
    itemListElement: districtInfo.map((info, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://tampereenkaupunginosat.fi/kaupunginosa/${info.id}`,
      name: info.name,
    })),
  };

  return (
    <article className="district-list">
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      <header className="district-list-header">
        <nav aria-label="Breadcrumb" className="district-list-breadcrumb">
          <Link to="/">Etusivu</Link>
          <span aria-hidden="true">/</span>
          <span className="current">Kaupunginosat</span>
        </nav>
        <h1>Kaikki Tampereen kaupunginosat</h1>
        <p>
          Tampere on jaettu {districtInfo.length} kaupunginosaan, jotka on ryhmitelty
          seitsemään suuralueeseen. Klikkaa kaupunginosaa nähdäksesi lisätietoja ja
          sijainnin kartalla.
        </p>
      </header>

      <div className="district-list-grid">
        {suuralueOrder.map(suuralue => {
          const items = grouped[suuralue];
          if (!items || items.length === 0) return null;
          return (
            <section key={suuralue} className="district-list-group">
              <h2>{suuralue} suuralue</h2>
              <ul>
                {items.map(info => (
                  <li key={info.id}>
                    <Link to={`/kaupunginosa/${info.id}`}>{info.name}</Link>
                    <span className="district-list-meta">
                      {info.population2020 !== null && `${info.population2020.toLocaleString('fi-FI')} as.`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
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
