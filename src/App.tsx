import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { District, DistrictInfo } from './types';
import { Game } from './components/Game';
import { ViewMode } from './components/ViewMode';
import { LocateMode } from './components/LocateMode';
import { About } from './components/About';
import { NotFound } from './components/NotFound';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { DistrictList } from './components/DistrictList';
import { DistrictPage } from './components/DistrictPage';
import './App.css';

function App() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtInfo, setDistrictInfo] = useState<DistrictInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [districtsResponse, infoResponse] = await Promise.all([
          fetch('/tampere-districts.json'),
          fetch('/district-info.json'),
        ]);

        if (!districtsResponse.ok) {
          throw new Error('Failed to load districts data');
        }
        if (!infoResponse.ok) {
          throw new Error('Failed to load district info data');
        }

        const districtsData: District[] = await districtsResponse.json();
        const infoData: DistrictInfo[] = await infoResponse.json();

        setDistricts(districtsData);
        setDistrictInfo(infoData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <h1>Tampereen kaupunginosat</h1>
        <p>Ladataan kaupunginosia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h1>Tampereen kaupunginosat</h1>
        <p>Virhe: {error}</p>
        <p>Varmista, että tampere-districts.json ja district-info.json ovat public-kansiossa.</p>
      </div>
    );
  }

  if (districts.length === 0) {
    return (
      <div className="app-error">
        <h1>Tampereen kaupunginosat</h1>
        <p>Kaupunginosatietoja ei saatavilla.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>Tampereen kaupunginosat</h1>
          <p>Tunnetko Tampereen kaupunginosat?</p>
          <Navigation />
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Game districts={districts} />} />
            <Route path="/view" element={<ViewMode districts={districts} />} />
            <Route path="/locate" element={<LocateMode districts={districts} />} />
            <Route path="/kaupunginosat" element={<DistrictList districtInfo={districtInfo} />} />
            <Route
              path="/kaupunginosa/:id"
              element={<DistrictPage districts={districts} districtInfo={districtInfo} />}
            />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
