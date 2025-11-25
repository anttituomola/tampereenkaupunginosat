import { useState, useEffect } from 'react';
import './OptionsPanel.css';

interface OptionsPanelProps {
  options: string[];
  correctAnswer: string;
  onSelect: (selected: string) => void;
  disabled?: boolean;
}

export function OptionsPanel({
  options,
  correctAnswer,
  onSelect,
  disabled = false,
}: OptionsPanelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  useEffect(() => {
    // Shuffle options when they change
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
    setSelectedOption(null);
  }, [options]);

  const handleClick = (option: string) => {
    if (disabled || selectedOption !== null) return;

    setSelectedOption(option);
    onSelect(option);
  };

  const getButtonClass = (option: string) => {
    if (selectedOption === null) return 'option-button';
    
    if (option === correctAnswer) {
      return 'option-button correct';
    }
    
    if (option === selectedOption && option !== correctAnswer) {
      return 'option-button incorrect';
    }
    
    return 'option-button disabled';
  };

  return (
    <div className="options-panel">
      {shuffledOptions.map((option) => (
        <button
          key={option}
          className={getButtonClass(option)}
          onClick={() => handleClick(option)}
          disabled={disabled || selectedOption !== null}
        >
          {option}
        </button>
      ))}
    </div>
  );
}


