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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

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
    setShowCelebration(false);
    setShowCorrectAnswer(false);
    setIsWaiting(false);
  }, [districts, recentDistricts]);

  useEffect(() => {
    generateQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleDistrictClick = useCallback((districtId: string) => {
    if (!currentDistrict || isWaiting) return;

    const isCorrect = districtId === currentDistrict.id;
    setTotalQuestions((prev) => prev + 1);
    setSelectedDistrictId(districtId);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setShowCelebration(true);
    } else {
      setShowCorrectAnswer(true);
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
  }, [currentDistrict, isWaiting, generateQuestion]);

  if (!currentDistrict) {
    return <div className="locate-mode-loading">Ladataan peliä...</div>;
  }

  return (
    <div className="locate-mode-container">
      <div className="locate-mode-content">
        <div className="locate-mode-instruction">
          <h2>Etsi kaupunginosa</h2>
          <p className="district-name-to-find">{currentDistrict.name}</p>
        </div>
        <div className="locate-mode-map-wrapper">
          <MapView
            districts={districts}
            highlightedDistrictId={null}
            onDistrictClick={handleDistrictClick}
            selectedDistrictId={showCorrectAnswer ? currentDistrict.id : (showCelebration ? selectedDistrictId : null)}
            wrongDistrictId={showCorrectAnswer && selectedDistrictId !== currentDistrict.id ? selectedDistrictId : null}
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

