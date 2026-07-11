import { useState, useEffect, useCallback } from 'react';
import type { District } from '../types';
import { MapView } from './MapView';
import { OptionsPanel } from './OptionsPanel';
import { ScorePanel } from './ScorePanel';
import './Game.css';

interface GameProps {
  districts: District[];
}

const RECENT_DISTRICTS_COUNT = 10;
const NEXT_ROUND_DELAY = 2000; // 2 seconds

export function Game({ districts }: GameProps) {
  const [currentDistrict, setCurrentDistrict] = useState<District | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [recentDistricts, setRecentDistricts] = useState<string[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);

  const generateQuestion = useCallback(() => {
    if (districts.length < 3) return;

    // Filter out recently used districts
    const availableDistricts = districts.filter(
      (d) => !recentDistricts.includes(d.id)
    );
    
    // If we've used too many districts, reset the recent list
    const districtsToUse = availableDistricts.length >= 3 
      ? availableDistricts 
      : districts;

    // Pick a random district as the correct answer
    const correctDistrict =
      districtsToUse[Math.floor(Math.random() * districtsToUse.length)];

    // Pick two random distractors
    const distractors: District[] = [];
    while (distractors.length < 2) {
      const randomDistrict =
        districts[Math.floor(Math.random() * districts.length)];
      if (
        randomDistrict.id !== correctDistrict.id &&
        !distractors.some((d) => d.id === randomDistrict.id)
      ) {
        distractors.push(randomDistrict);
      }
    }

    // Create options array
    const newOptions = [
      correctDistrict.name,
      distractors[0].name,
      distractors[1].name,
    ];

    setCurrentDistrict(correctDistrict);
    setOptions(newOptions);
    setIsWaiting(false);
  }, [districts, recentDistricts]);

  useEffect(() => {
    generateQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    document.title = 'Tampereen kaupunginosat – Visa, kartta ja tiedot';
    setMetaDescription('Testaa tietosi Tampereen kaupunginosista vuorovaikutteisessa visassa. Tutustu myös karttaan ja jokaisen kaupunginosan omaan sivuun.');
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tampereen kaupunginosat',
    url: 'https://tampereenkaupunginosat.fi/',
    description: 'Vuorovaikutteinen sivusto Tampereen kaupunginosien oppimiseen.',
    publisher: {
      '@type': 'Person',
      name: 'Antti Tuomola',
    },
  };

  const handleAnswer = (selectedName: string) => {
    if (!currentDistrict) return;

    const isCorrect = selectedName === currentDistrict.name;
    setTotalQuestions((prev) => prev + 1);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Add to recent districts
    setRecentDistricts((prev) => {
      const updated = [...prev, currentDistrict.id];
      // Keep only the last N districts
      return updated.slice(-RECENT_DISTRICTS_COUNT);
    });

    // Wait before next round
    setIsWaiting(true);
    setTimeout(() => {
      generateQuestion();
    }, NEXT_ROUND_DELAY);
  };

  if (!currentDistrict) {
    return <div className="game-loading">Loading game...</div>;
  }

  return (
    <div className="game-container">
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      <div className="game-content">
        <MapView
          districts={districts}
          highlightedDistrictId={currentDistrict.id}
        />
        <OptionsPanel
          options={options}
          correctAnswer={currentDistrict.name}
          onSelect={handleAnswer}
          disabled={isWaiting}
        />
      </div>
      <ScorePanel score={score} total={totalQuestions} />
      {isWaiting && (
        <div className="next-round-indicator">Seuraava kysymys kohta...</div>
      )}
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
