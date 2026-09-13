import { useEffect, useRef, useCallback } from 'react';
import { createSparkParticles, createFlowerPetals, renderParticlesFrame } from '../utils/particles';

/**
 * Custom hook to manage background spiritual spark particles & flower petals rain
 * @returns {{canvasRef: React.RefObject<HTMLCanvasElement>, spawnFlowerPetalsRain: (count?: number) => void}}
 */
export function useSpiritualParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const flowerPetalsRef = useRef([]);
  const animFrameIdRef = useRef(null);

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesRef.current = createSparkParticles(canvas.width, canvas.height);
  }, []);

  const spawnFlowerPetalsRain = useCallback((count = 35) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newPetals = createFlowerPetals(canvas.width, count);
    flowerPetalsRef.current = [...flowerPetalsRef.current, ...newPetals];
  }, []);

  useEffect(() => {
    initParticles();
    window.addEventListener('resize', initParticles);

    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderParticlesFrame(
            ctx,
            canvas.width,
            canvas.height,
            particlesRef.current,
            flowerPetalsRef.current
          );
        }
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', initParticles);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [initParticles]);

  return {
    canvasRef,
    spawnFlowerPetalsRain
  };
}
