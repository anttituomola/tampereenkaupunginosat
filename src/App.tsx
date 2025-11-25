import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { District } from './types';
import { Game } from './components/Game';
import { ViewMode } from './components/ViewMode';
import { LocateMode } from './components/LocateMode';
import { About } from './components/About';
import { NotFound } from './components/NotFound';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import './App.css';

function App() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDistricts() {
      try {
        const response = await fetch('/tampere-districts.json');
        if (!response.ok) {
          throw new Error('Failed to load districts data');
        }
        const data: District[] = await response.json();
        setDistricts(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadDistricts();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <h1>Tampereen kaupunginosavisa</h1>
        <p>Ladataan kaupunginosia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h1>Tampereen kaupunginosavisa</h1>
        <p>Virhe: {error}</p>
        <p>Varmista, että tampere-districts.json on public-kansiossa.</p>
      </div>
    );
  }

  if (districts.length === 0) {
    return (
      <div className="app-error">
        <h1>Tampereen kaupunginosavisa</h1>
        <p>Kaupunginosatietoja ei saatavilla.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>Tampereen kaupunginosavisa</h1>
          <p>Tunnetko tampereen kaupunginosat?</p>
          <Navigation />
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Game districts={districts} />} />
            <Route path="/view" element={<ViewMode districts={districts} />} />
            <Route path="/locate" element={<LocateMode districts={districts} />} />
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
