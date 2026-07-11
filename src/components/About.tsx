import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

export function About() {
  useEffect(() => {
    document.title = 'Tietoja – Tampereen kaupunginosat';
    setMetaDescription('Tietoa Tampereen kaupunginosat -sivustosta, sen tietolähteistä ja toiminnoista.');
    return () => {
      document.title = 'Tampereen kaupunginosat';
      setMetaDescription('Tutustu Tampereen kaupunginosiin, opi niiden nimet ja sijainnit.');
    };
  }, []);

  return (
    <div className="about-container">
      <div className="about-content">
        <h1>Tietoja sivustosta</h1>

        <section className="about-section">
          <h2>Mikä on Tampereen kaupunginosat?</h2>
          <p>
            Tampereen kaupunginosat on ilmainen verkkosovellus, jonka avulla voit
            oppia tuntemaan Tampereen {117} kaupunginosan nimet ja sijainnit.
            Sivusto tarjoaa vuorovaikutteisen kartan, visan ja omat tietosivut
            jokaiselle kaupunginosalle.
          </p>
          <p>
            Tutustu kaikkiin kaupunginosiin <Link to="/kaupunginosat">luettelosta</Link>
            {' '}tai harjoittele sijainteja <Link to="/locate">etsintäpelissä</Link>.
          </p>
        </section>

        <section className="about-section">
          <h2>Miksi tämä sovellus?</h2>
          <p>
            Muutin Tampereelle vuonna 2023, mutta en ole vielä oppinut 
            uuden kotikaupunkini kaupunginosien nimiä kovin hyvin. Tämän 
            sovelluksen tarkoituksena on auttaa minua (ja muita) oppimaan 
            Tampereen kaupunginosien nimet ja sijainnit.
          </p>
        </section>

        <section className="about-section">
          <h2>Avoimet tietolähteet</h2>
          <p>
            Tämä sovellus käyttää luotettavia avoimia tietolähteitä:
          </p>
          <ul>
            <li>
              <strong>Tampereen kaupungin dataportaali:</strong> Kaupunginosien 
              rajaukset ja nimet. Tilastoalueet vastaavat pääosin kaupunginosia.
            </li>
            <li>
              <strong>Tampereen kaupungin tilastollinen vuosikirja 2018–2020:</strong>{' '}
              Väestö- ja pinta-alatiedot suuralueittain ja kaupunginosittain.
            </li>
            <li>
              <strong>Maanmittauslaitos:</strong> Tiet, järvet ja muut 
              karttaelementit
            </li>
          </ul>
          <p>
            Kiitämme näitä organisaatioita avoimien tietojen tarjoamisesta!
          </p>
        </section>

        <section className="about-section">
          <h2>Pelitilat</h2>
          <ul>
            <li>
              <strong>Visa:</strong> Valitse oikea kaupunginosa kolmesta 
              vaihtoehdosta
            </li>
            <li>
              <strong>Selaa:</strong> Vie hiiri kaupunginosan päälle nähdäksesi 
              sen nimen. Mobiilissa napauta kaupunginosaa zoomataksesi lähelle.
            </li>
            <li>
              <strong>Etsi:</strong> Klikkaa kartalta oikeaa kaupunginosaa 
              annetun nimen perusteella
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Kehittäjä</h2>
          <p>
            Tämän sovelluksen on kehittänyt{' '}
            <a href="https://www.anttituomola.fi/" target="_blank" rel="noopener noreferrer">
              Antti Tuomola
            </a>.
          </p>
        </section>
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
