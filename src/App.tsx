import { useState, useEffect } from 'react';
import type { District } from './types';
import { Game } from './components/Game';
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
        <h1>Tampere District Quiz</h1>
        <p>Loading districts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h1>Tampere District Quiz</h1>
        <p>Error: {error}</p>
        <p>Please make sure tampere-districts.json exists in the public folder.</p>
      </div>
    );
  }

  if (districts.length === 0) {
    return (
      <div className="app-error">
        <h1>Tampere District Quiz</h1>
        <p>No districts data available.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tampereen kaupunginosavisa</h1>
        <p>Tunnetko tampereen kaupunginosat?</p>
      </header>
      <main className="app-main">
        <Game districts={districts} />
      </main>
    </div>
  );
}

export default App;
