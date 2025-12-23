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
  const [isTriggered, setIsTriggered] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const lastAngle = useRef<number | null>(null);
  const totalRotation = useRef<number>(0);
  const rotationDirection = useRef<number>(0); // 1 for clockwise, -1 for counter-clockwise

  const width = 120;
  const height = 120;
  const centerX = width / 2;
  const centerY = height / 2;
  const requiredRotation = Math.PI * 2; // 360 degrees in radians

  // Track mouse position and rotation
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

      // Calculate angle from center
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
        // Too close to center, reset
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

      // Color based on rotation progress
      let eyeWhiteColor = '#ffffff';
      let irisColor = '#4a5568'; // Gray
      let pupilColor = '#1a202c';
      let glowColor = '#cbd5e0';

      if (rotationProgress >= 0.33 && rotationProgress < 0.66) {
        irisColor = '#9333ea'; // Purple
        glowColor = '#a855f7';
      } else if (rotationProgress >= 0.66) {
        irisColor = '#dc2626'; // Red
        glowColor = '#ef4444';
        eyeWhiteColor = '#fee2e2'; // Slightly red white
      }

      // Pupil size increases with progress
      const basePupilRadius = 8;
      const pupilRadius = basePupilRadius + rotationProgress * 8;

      // Draw eye white
      ctx.fillStyle = eyeWhiteColor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw iris with glow
      const irisRadius = 15 + rotationProgress * 5;
      ctx.shadowBlur = 10 + rotationProgress * 20;
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
  }, [rotationProgress]);

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
        setRotationProgress(0);
        totalRotation.current = 0;
        rotationDirection.current = 0;
        lastAngle.current = null;
      }, 2000);
    }, 500);
  };

  const handleClick = () => {
    if (rotationProgress === 0) {
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
            filter: `brightness(${1 + rotationProgress * 0.2})`,
          }}
        />

        {/* Instructions */}
        {rotationProgress === 0 && !isTriggered && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-xs text-neutral-500 text-center">
              👁️ Rotate around me...<br />
              <span className="text-[10px]">Draw a circle</span>
            </p>
          </div>
        )}

        {/* Progress indicator */}
        {rotationProgress > 0 && rotationProgress < 1 && !isTriggered && (
          <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
            <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full transition-all"
                style={{
                  width: `${rotationProgress * 100}%`,
                  backgroundColor:
                    rotationProgress < 0.33
                      ? '#9ca3af'
                      : rotationProgress < 0.66
                      ? '#9333ea'
                      : '#dc2626',
                }}
              />
            </div>
            <p className="text-[10px] text-neutral-500">
              {Math.round(rotationProgress * 100)}%
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
