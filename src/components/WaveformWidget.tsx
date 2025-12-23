import React, { useRef, useEffect, useState } from 'react';

interface WaveformWidgetProps {
  onEasterEggTrigger: () => void;
  onNormalClick: () => void;
}

const WaveformWidget: React.FC<WaveformWidgetProps> = ({
  onEasterEggTrigger,
  onNormalClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isHovering, setIsHovering] = useState(false);
  const [traceProgress, setTraceProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);

  // Wave parameters
  const width = 80;
  const height = 40;
  const amplitude = 12;
  const frequency = 2;
  const cyclesNeeded = 3;

  // Tracking state
  const trackingRef = useRef({
    isTracking: false,
    lastX: 0,
    matchedPoints: 0,
    totalPointsNeeded: width * cyclesNeeded,
  });

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Calculate glow intensity based on trace progress
      const glowIntensity = Math.min(traceProgress / 100, 1);
      const baseAlpha = isHovering ? 0.8 : 0.6;
      const glowAlpha = baseAlpha + glowIntensity * 0.4;

      // Color transitions: cyan → purple → red as progress increases
      let color = '#00d9ff'; // Cyan
      if (glowIntensity > 0.33) color = '#9d4edd'; // Purple
      if (glowIntensity > 0.66) color = '#ff006e'; // Red

      // Draw glow
      ctx.shadowBlur = 10 + glowIntensity * 20;
      ctx.shadowColor = color;

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = glowAlpha;

      for (let x = 0; x < width; x++) {
        const y =
          height / 2 +
          Math.sin((x / width) * Math.PI * frequency + time) * amplitude;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      time += 0.05;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovering, traceProgress]);

  // Handle mouse move - trace detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate expected Y position on wave at mouseX
    const time = Date.now() / 1000;
    const expectedY =
      height / 2 +
      Math.sin((mouseX / width) * Math.PI * frequency + time * 0.05) * amplitude;

    // Check if cursor is close to the wave
    const distance = Math.abs(mouseY - expectedY);
    const threshold = 8; // pixels

    const tracking = trackingRef.current;

    if (distance < threshold && mouseX > tracking.lastX) {
      // User is tracing the wave correctly
      tracking.matchedPoints++;
      tracking.lastX = mouseX;

      // Update progress
      const progress = (tracking.matchedPoints / tracking.totalPointsNeeded) * 100;
      setTraceProgress(progress);

      // Check if Easter egg triggered
      if (progress >= 100 && !isTriggered) {
        setIsTriggered(true);
        triggerEasterEgg();
      }
    }

    // Reset if user moves backwards or strays too far
    if (mouseX < tracking.lastX - 10) {
      tracking.lastX = mouseX;
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    trackingRef.current = {
      isTracking: true,
      lastX: 0,
      matchedPoints: 0,
      totalPointsNeeded: width * cyclesNeeded,
    };
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Reset tracking after a delay
    setTimeout(() => {
      if (!isHovering) {
        trackingRef.current.matchedPoints = 0;
        trackingRef.current.lastX = 0;
        setTraceProgress(0);
      }
    }, 1000);
  };

  const triggerEasterEgg = () => {
    // Visual feedback: screen shake + explosion effect
    document.body.style.animation = 'shake 0.5s';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 500);

    // Call the callback after brief delay
    setTimeout(() => {
      onEasterEggTrigger();
      // Reset after triggering
      setTimeout(() => {
        setIsTriggered(false);
        setTraceProgress(0);
        trackingRef.current.matchedPoints = 0;
      }, 2000);
    }, 500);
  };

  const handleClick = () => {
    if (!isTriggered && traceProgress < 30) {
      // Normal click if not actively tracing
      onNormalClick();
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      <div
        className="fixed bottom-6 right-6 z-50 cursor-pointer transition-transform hover:scale-110"
        style={{ animation: 'float 3s ease-in-out infinite' }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="rounded-lg bg-black/10 backdrop-blur-sm p-2"
          style={{
            filter: `brightness(${1 + traceProgress / 100})`,
          }}
        />

        {/* Hint text on hover */}
        {isHovering && traceProgress < 20 && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-xs text-neutral-500 animate-pulse">
              trace the wave...
            </p>
          </div>
        )}

        {/* Progress indicator */}
        {traceProgress > 20 && traceProgress < 100 && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <p className="text-xs font-mono text-cyan-500">
              {Math.round(traceProgress)}%
            </p>
          </div>
        )}

        {/* Success message */}
        {isTriggered && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-sm font-bold text-red-500 animate-pulse">
              CRITICAL MODE ACTIVATED
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default WaveformWidget;
