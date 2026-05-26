import { useState, useEffect } from "react";

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useHeroBgColor() {
  const [heroBgColor, setHeroBgColor] = useState<string | undefined>();
  const [heroIsDarkText, setHeroIsDarkText] = useState<boolean>(true);

  useEffect(() => {
    const handleHeroBgChange = (e: any) => {
      setHeroBgColor(e.detail.bgColor);
      setHeroIsDarkText(e.detail.isDarkText);
    };
    window.addEventListener('hero-bg-change', handleHeroBgChange);
    
    // Cleanup
    return () => window.removeEventListener('hero-bg-change', handleHeroBgChange);
  }, []);

  const heroBgRgba = heroBgColor ? hexToRgba(heroBgColor, 0.15) : undefined;
  const heroBgSolid = heroBgColor;

  return { heroBgColor: heroBgSolid, heroBgRgba, heroIsDarkText };
}
