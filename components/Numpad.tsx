import React from 'react';

interface NumpadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  onPlayClick?: () => void;
}

const NumpadButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string, 'aria-label': string }> = ({ onClick, children, className, ...props }) => (
  <button
    onClick={onClick}
    className={`bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-xl font-bold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500 h-12 active:bg-slate-600 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Numpad: React.FC<NumpadProps> = ({ onDigit, onBackspace, onSubmit, submitDisabled, onPlayClick }) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const handleDigitClick = (digit: string) => {
    onPlayClick?.();
    onDigit(digit);
  }

  const handleBackspaceClick = () => {
    onPlayClick?.();
    onBackspace();
  }
  
  const handleSubmitClick = () => {
      // The 'guess' sound is played separately in GameScreen, so no SFX here.
      onSubmit();
  }

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto" role="grid">
      {digits.map(digit => (
        <NumpadButton key={digit} onClick={() => handleDigitClick(digit)} aria-label={`Number ${digit}`}>{digit}</NumpadButton>
      ))}
      <NumpadButton onClick={handleBackspaceClick} className="text-yellow-400" aria-label="Backspace">⌫</NumpadButton>
      <NumpadButton onClick={() => handleDigitClick('0')} aria-label="Number 0">0</NumpadButton>
      <button
        onClick={handleSubmitClick}
        disabled={submitDisabled}
        className="bg-cyan-600 hover:bg-cyan-500 rounded-lg text-lg font-bold transition-colors duration-150 text-white disabled:bg-slate-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-400 h-12 active:bg-cyan-700"
        aria-label="Submit"
      >
        OK
      </button>
    </div>
  );
};