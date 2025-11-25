import './About.css';

export function About() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h1>Tietoja</h1>
        
        <section className="about-section">
          <h2>Miksi tämä sovellus?</h2>
          <p>
            Muutin Tampereelle jo vuonna 2023, mutta en ole vielä oppinut 
            uuden kotikaupunkini kaupunginosien nimiä kovin hyvin. Tämän 
            sovelluksen tarkoituksena on auttaa minua (ja muita) oppimaan 
            Tampereen kaupunginosien nimet ja sijainnit.
          </p>
        </section>

        <section className="about-section">
          <h2>Avoimet tietolähteet</h2>
          <p>
            Tämä sovellus käyttää avoimia tietolähteitä:
          </p>
          <ul>
            <li>
              <strong>Tampere open data:</strong> Kaupunginosien rajaukset 
              ja nimet
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
              sen nimen
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


