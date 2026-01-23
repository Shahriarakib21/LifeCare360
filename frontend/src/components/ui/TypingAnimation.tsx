'use client';

import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
}

export default function TypingAnimation({ text, speed = 50, className = '', showCursor = true }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBlink, setShowBlink] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  // Blinking cursor effect
  useEffect(() => {
    if (!showCursor) return;
    const interval = setInterval(() => {
      setShowBlink((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, [showCursor]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && currentIndex < text.length && (
        <span className={`inline-block w-0.5 h-[1em] bg-current ml-1 ${showBlink ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>|</span>
      )}
    </span>
  );
}

