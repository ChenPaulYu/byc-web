import React, { useRef, useEffect, useState } from 'react';

interface EyeWidgetProps {
  onEasterEggTrigger: () => void;
  onNormalClick: () => void;
}

const EyeWidget: React.FC<EyeWidgetProps> = ({
  onEasterEggTrigger,
  onNormalClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [hoverProgress, setHoverProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const lastMoveTime = useRef<number>(Date.now());
  const hoverStartTime = useRef<number>(Date.now());
  const mousePos = useRef({ x: 0, y: 0 });

  const width = 120;
  const height = 120;
  const easterEggThreshold = 8000; // 8 seconds

  // Update mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Check if mouse is over canvas
      const isOver =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isOver) {
        const now = Date.now();
        const timeSinceLastMove = now - lastMoveTime.current;

        // If mouse hasn't moved much, accumulate hover time
        if (timeSinceLastMove > 100) {
          lastMoveTime.current = now;
          hoverStartTime.current = now;
        }

        const hoverDuration = now - hoverStartTime.current;
        const progress = Math.min(hoverDuration / easterEggThreshold, 1);
        setHoverProgress(progress);

        if (progress >= 1 && !isTriggered) {
          triggerEasterEgg();
        }
      } else {
        // Reset when mouse leaves
        setHoverProgress(0);
        hoverStartTime.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isTriggered]);

  // Draw eye
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const eyeRadiusX = 45;
    const eyeRadiusY = 30;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Calculate pupil position (follows mouse)
      const dx = mousePos.current.x - centerX;
      const dy = mousePos.current.y - centerY;
      const angle = Math.atan2(dy, dx);
      const maxDist = eyeRadiusX * 0.4;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
      const pupilX = centerX + Math.cos(angle) * dist * 0.5;
      const pupilY = centerY + Math.sin(angle) * dist * 0.3;

      // Color based on hover progress
      let eyeWhiteColor = '#ffffff';
      let irisColor = '#4a5568'; // Gray
      let pupilColor = '#1a202c';
      let glowColor = '#cbd5e0';

      if (hoverProgress >= 0.33 && hoverProgress < 0.66) {
        irisColor = '#9333ea'; // Purple
        glowColor = '#a855f7';
      } else if (hoverProgress >= 0.66) {
        irisColor = '#dc2626'; // Red
        glowColor = '#ef4444';
        eyeWhiteColor = '#fee2e2'; // Slightly red white
      }

      // Pupil size increases with progress
      const basePupilRadius = 8;
      const pupilRadius = basePupilRadius + hoverProgress * 8;

      // Draw eye white
      ctx.fillStyle = eyeWhiteColor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw iris with glow
      const irisRadius = 15 + hoverProgress * 5;
      ctx.shadowBlur = 10 + hoverProgress * 20;
      ctx.shadowColor = glowColor;
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, irisRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw pupil
      ctx.shadowBlur = 0;
      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw shine on pupil
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(pupilX - 3, pupilY - 3, pupilRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Draw eye outline
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hoverProgress]);

  const triggerEasterEgg = () => {
    setIsTriggered(true);

    // Screen shake
    document.body.style.animation = 'shake 0.5s';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 500);

    // Trigger callback
    setTimeout(() => {
      onEasterEggTrigger();

      // Reset after delay
      setTimeout(() => {
        setIsTriggered(false);
        setHoverProgress(0);
        hoverStartTime.current = Date.now();
      }, 2000);
    }, 500);
  };

  const handleClick = () => {
    if (hoverProgress === 0) {
      // No progress - open normal chatbot
      onNormalClick();
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-5px, 5px); }
          50% { transform: translate(5px, -5px); }
          75% { transform: translate(-5px, -5px); }
        }
      `}</style>

      <div
        className="fixed bottom-6 right-6 z-50"
        style={{
          animation: isTriggered ? 'shake 0.3s infinite' : 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleClick}
          className="cursor-pointer rounded-lg bg-white border-2 border-neutral-200 shadow-lg"
          style={{
            filter: `brightness(${1 + hoverProgress * 0.2})`,
          }}
        />

        {/* Instructions */}
        {hoverProgress === 0 && !isTriggered && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-xs text-neutral-500 text-center">
              👁️ Stare at me...<br />
              <span className="text-[10px]">Don't move your mouse</span>
            </p>
          </div>
        )}

        {/* Progress indicator */}
        {hoverProgress > 0 && hoverProgress < 1 && !isTriggered && (
          <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
            <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full transition-all"
                style={{
                  width: `${hoverProgress * 100}%`,
                  backgroundColor:
                    hoverProgress < 0.33
                      ? '#9ca3af'
                      : hoverProgress < 0.66
                      ? '#9333ea'
                      : '#dc2626',
                }}
              />
            </div>
            <p className="text-[10px] text-neutral-500">
              {Math.round(hoverProgress * 100)}%
            </p>
          </div>
        )}

        {/* Success message */}
        {isTriggered && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-sm font-bold text-red-600 animate-pulse">
              👁️ YOU SAW THROUGH ME!
            </p>
            <p className="text-xs text-center text-neutral-600">
              Initiating...
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default EyeWidget;
