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
  const [rotationProgress, setRotationProgress] = useState(0);
  const [stareProgress, setStareProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const lastAngle = useRef<number | null>(null);
  const totalRotation = useRef<number>(0);
  const rotationDirection = useRef<number>(0); // 1 for clockwise, -1 for counter-clockwise
  const stareStartTime = useRef<number>(Date.now());
  const lastMoveTime = useRef<number>(Date.now());
  const isOverCanvas = useRef<boolean>(false);

  const width = 120;
  const height = 120;
  const centerX = width / 2;
  const centerY = height / 2;
  const requiredRotation = Math.PI * 2; // 360 degrees in radians
  const stareThreshold = 10000; // 10 seconds

  // Track mouse position, rotation, and stare time
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasCenterX = rect.left + centerX;
      const canvasCenterY = rect.top + centerY;

      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Check if mouse is over canvas
      const wasOver = isOverCanvas.current;
      isOverCanvas.current =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      // Track stare time when hovering over canvas without much movement
      if (isOverCanvas.current) {
        const now = Date.now();
        const timeSinceLastMove = now - lastMoveTime.current;

        // If mouse moved significantly, reset stare timer
        if (timeSinceLastMove < 100) {
          stareStartTime.current = now;
        }

        lastMoveTime.current = now;

        // Calculate stare progress
        const stareDuration = now - stareStartTime.current;
        const stareProgress = Math.min(stareDuration / stareThreshold, 1);
        setStareProgress(stareProgress);

        // Trigger Easter egg when stare complete
        if (stareProgress >= 1 && !isTriggered) {
          triggerEasterEgg();
        }
      } else if (wasOver && !isOverCanvas.current) {
        // Reset stare when leaving canvas
        setStareProgress(0);
        stareStartTime.current = Date.now();
      }

      // Calculate angle from center for rotation tracking
      const dx = e.clientX - canvasCenterX;
      const dy = e.clientY - canvasCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const currentAngle = Math.atan2(dy, dx);

      // Check if mouse is near the canvas (within reasonable tracking distance)
      if (distance > 30 && distance < 300) {
        if (lastAngle.current !== null) {
          let angleDiff = currentAngle - lastAngle.current;

          // Normalize angle difference to [-π, π]
          if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

          // Detect direction (clockwise or counter-clockwise)
          const direction = angleDiff > 0 ? 1 : -1;

          // If direction changes significantly, reset
          if (rotationDirection.current !== 0 &&
              direction !== rotationDirection.current &&
              Math.abs(angleDiff) > 0.5) {
            totalRotation.current = 0;
            rotationDirection.current = 0;
          } else {
            // Set or maintain direction
            if (rotationDirection.current === 0) {
              rotationDirection.current = direction;
            }

            // Accumulate rotation if moving in consistent direction
            if (direction === rotationDirection.current && Math.abs(angleDiff) < 1) {
              totalRotation.current += Math.abs(angleDiff);

              // Calculate progress (0 to 1)
              const progress = Math.min(totalRotation.current / requiredRotation, 1);
              setRotationProgress(progress);

              // Trigger Easter egg when complete
              if (progress >= 1 && !isTriggered) {
                triggerEasterEgg();
              }
            }
          }
        }

        lastAngle.current = currentAngle;
      } else if (distance < 30) {
        // Too close to center, reset rotation
        lastAngle.current = null;
        if (totalRotation.current > 0 && totalRotation.current < requiredRotation * 0.3) {
          totalRotation.current = 0;
          rotationDirection.current = 0;
          setRotationProgress(0);
        }
      } else {
        // Too far away, maintain progress but stop tracking angle
        lastAngle.current = null;
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

      // Use the maximum progress from either mechanic
      const maxProgress = Math.max(rotationProgress, stareProgress);

      // Subtle color transitions - calm neutrals to deep red
      let eyeWhiteColor = '#fafaf9'; // Warm off-white
      let irisColor = '#737373'; // Neutral gray
      let pupilColor = '#262626';

      // Very subtle progression - only change at high progress
      if (maxProgress >= 0.7) {
        irisColor = '#7c2d12'; // Deep brown-red
        eyeWhiteColor = '#fef2f2'; // Barely tinted
      }

      // Minimal pupil size change
      const basePupilRadius = 8;
      const pupilRadius = basePupilRadius + maxProgress * 4;

      // Draw eye white (no border)
      ctx.fillStyle = eyeWhiteColor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw iris - no glow, just solid color
      const irisRadius = 15 + maxProgress * 3;
      ctx.shadowBlur = 0;
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, irisRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw pupil
      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(pupilX - 2, pupilY - 2, pupilRadius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Minimal outline
      ctx.strokeStyle = '#d4d4d4';
      ctx.lineWidth = 1;
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
  }, [rotationProgress, stareProgress]);

  const triggerEasterEgg = () => {
    setIsTriggered(true);

    // Trigger callback immediately (no shake)
    onEasterEggTrigger();

    // Reset after delay
    setTimeout(() => {
      setIsTriggered(false);
      setRotationProgress(0);
      setStareProgress(0);
      totalRotation.current = 0;
      rotationDirection.current = 0;
      lastAngle.current = null;
      stareStartTime.current = Date.now();
    }, 1500);
  };

  const handleClick = () => {
    if (rotationProgress === 0 && stareProgress === 0) {
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

      <div className="fixed bottom-6 right-6 z-50">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleClick}
          className="cursor-pointer rounded-2xl bg-neutral-50 border border-neutral-200/50 shadow-sm transition-all duration-300"
          style={{
            opacity: isTriggered ? 0.6 : 1,
          }}
        />

        {/* Subtle instructions - only show initially */}
        {rotationProgress === 0 && stareProgress === 0 && !isTriggered && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-[10px] text-neutral-400 text-center">
              Two secrets hidden
            </p>
          </div>
        )}

        {/* Minimal progress indicator */}
        {(rotationProgress > 0 || stareProgress > 0) && Math.max(rotationProgress, stareProgress) < 1 && !isTriggered && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-center">
            <div className="w-16 h-0.5 bg-neutral-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.max(rotationProgress, stareProgress) * 100}%`,
                  backgroundColor: '#737373',
                }}
              />
            </div>
            <p className="text-[10px] text-neutral-400">
              {Math.round(Math.max(rotationProgress, stareProgress) * 100)}%
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default EyeWidget;
