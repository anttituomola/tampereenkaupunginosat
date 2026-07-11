import { useState, useEffect, useCallback } from 'react';
import type { District } from '../types';
import { MapView } from './MapView';
import { ScorePanel } from './ScorePanel';
import './LocateMode.css';

interface LocateModeProps {
  districts: District[];
}

const RECENT_DISTRICTS_COUNT = 10;
const NEXT_ROUND_DELAY = 2000; // 2 seconds

export function LocateMode({ districts }: LocateModeProps) {
  const [currentDistrict, setCurrentDistrict] = useState<District | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [recentDistricts, setRecentDistricts] = useState<string[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [previewDistrictId, setPreviewDistrictId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [forceFullViewCounter, setForceFullViewCounter] = useState(0);

  const generateQuestion = useCallback(() => {
    if (districts.length === 0) return;

    // Filter out recently used districts
    const availableDistricts = districts.filter(
      (d) => !recentDistricts.includes(d.id)
    );

    // If we've used too many districts, reset the recent list
    const districtsToUse = availableDistricts.length > 0
      ? availableDistricts
      : districts;

    // Pick a random district as the correct answer
    const correctDistrict =
      districtsToUse[Math.floor(Math.random() * districtsToUse.length)];

    setCurrentDistrict(correctDistrict);
    setSelectedDistrictId(null);
    setPreviewDistrictId(null);
    setShowCelebration(false);
    setShowCorrectAnswer(false);
    setIsWaiting(false);
  }, [districts, recentDistricts]);

  useEffect(() => {
    generateQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    document.title = 'Etsi kaupunginosa – Tampereen kaupunginosat';
    setMetaDescription('Harjoittele Tampereen kaupunginosien sijaintia etsintäpelissä. Etsi oikea alue kartalta annetun nimen perusteella.');
    return () => {
      document.title = 'Tampereen kaupunginosat';
      setMetaDescription('Tutustu Tampereen kaupunginosiin, opi niiden nimet ja sijainnit.');
    };
  }, []);

  const handleDistrictClick = useCallback((districtId: string) => {
    if (!currentDistrict || isWaiting) return;

    // First tap on a district zooms to it without selecting
    if (previewDistrictId !== districtId) {
      setPreviewDistrictId(districtId);
      return;
    }

    // Second tap on the same district confirms the selection
    const isCorrect = districtId === currentDistrict.id;
    setTotalQuestions((prev) => prev + 1);
    setSelectedDistrictId(districtId);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setShowCelebration(true);
    } else {
      setShowCorrectAnswer(true);
      // Trigger zoom out to full view before showing correct answer
      setForceFullViewCounter(prev => prev + 1);
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
  }, [currentDistrict, isWaiting, previewDistrictId, generateQuestion]);

  if (!currentDistrict) {
    return <div className="locate-mode-loading">Ladataan peliä...</div>;
  }

  const instructionText = previewDistrictId
    ? 'Täppää samaa aluetta uudelleen vahvistaaksesi valinnan'
    : 'Täppää aluetta ensin zoomataksesi lähelle ja uudelleen valitaksesi sen';

  return (
    <div className="locate-mode-container">
      <div className="locate-mode-content">
        <div className="locate-mode-instruction">
          <h2>Etsi kaupunginosa</h2>
          <p className="district-name-to-find">{currentDistrict.name}</p>
          {!isWaiting && (
            <p className="locate-mode-hint">{instructionText}</p>
          )}
        </div>
        <div className="locate-mode-map-wrapper">
          <MapView
            districts={districts}
            highlightedDistrictId={
              showCorrectAnswer || showCelebration
                ? currentDistrict.id
                : previewDistrictId
            }
            onDistrictClick={handleDistrictClick}
            selectedDistrictId={showCorrectAnswer ? currentDistrict.id : (showCelebration ? selectedDistrictId : null)}
            wrongDistrictId={showCorrectAnswer && selectedDistrictId !== currentDistrict.id ? selectedDistrictId : null}
            forceFullView={forceFullViewCounter}
          />
          {showCelebration && (
            <div className="celebration-message">
              <div className="celebration-content">
                <span className="celebration-icon">✓</span>
                <span>Oikein!</span>
              </div>
            </div>
          )}
        </div>
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
