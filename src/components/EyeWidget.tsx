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
  const animationRef = useRef<number>(0);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [stareProgress, setStareProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const lastAngle = useRef<number | null>(null);
  const totalRotation = useRef<number>(0);
  const rotationDirection = useRef<number>(0);
  const stareStartTime = useRef<number>(Date.now());
  const lastMoveTime = useRef<number>(Date.now());
  const isOverCanvas = useRef<boolean>(false);

  // Mobile-specific refs
  const touchStartTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const tapCount = useRef<number>(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const width = 120;
  const height = 120;
  const centerX = width / 2;
  const centerY = height / 2;
  const requiredRotation = Math.PI * 2;
  const stareThreshold = 10000; // 10 seconds for desktop
  const longPressThreshold = 3000; // 3 seconds for mobile
  const tapThreshold = 5; // 5 taps to trigger

  // Unified position update function
  const updatePosition = (clientX: number, clientY: number, isTouch: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasCenterX = rect.left + centerX;
    const canvasCenterY = rect.top + centerY;

    mousePos.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    // Check if position is over canvas
    const wasOver = isOverCanvas.current;
    isOverCanvas.current =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;

    // Track stare/hold time (desktop: stare, mobile: long press handled separately)
    if (isOverCanvas.current && !isTouch) {
      const now = Date.now();
      const timeSinceLastMove = now - lastMoveTime.current;

      if (timeSinceLastMove < 100) {
        stareStartTime.current = now;
      }

      lastMoveTime.current = now;

      const stareDuration = now - stareStartTime.current;
      const stareProgress = Math.min(stareDuration / stareThreshold, 1);
      setStareProgress(stareProgress);

      if (stareProgress >= 1 && !isTriggered) {
        triggerEasterEgg();
      }
    } else if (wasOver && !isOverCanvas.current && !isTouch) {
      setStareProgress(0);
      stareStartTime.current = Date.now();
    }

    // Calculate angle from center for rotation tracking
    const dx = clientX - canvasCenterX;
    const dy = clientY - canvasCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const currentAngle = Math.atan2(dy, dx);

    // Rotation tracking (works for both mouse and touch)
    if (distance > 30 && distance < 300) {
      if (lastAngle.current !== null) {
        let angleDiff = currentAngle - lastAngle.current;

        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const direction = angleDiff > 0 ? 1 : -1;

        if (rotationDirection.current !== 0 &&
            direction !== rotationDirection.current &&
            Math.abs(angleDiff) > 0.5) {
          totalRotation.current = 0;
          rotationDirection.current = 0;
        } else {
          if (rotationDirection.current === 0) {
            rotationDirection.current = direction;
          }

          if (direction === rotationDirection.current && Math.abs(angleDiff) < 1) {
            totalRotation.current += Math.abs(angleDiff);

            const progress = Math.min(totalRotation.current / requiredRotation, 1);
            setRotationProgress(progress);

            if (progress >= 1 && !isTriggered) {
              triggerEasterEgg();
            }
          }
        }
      }

      lastAngle.current = currentAngle;
    } else if (distance < 30) {
      lastAngle.current = null;
      if (totalRotation.current > 0 && totalRotation.current < requiredRotation * 0.3) {
        totalRotation.current = 0;
        rotationDirection.current = 0;
        setRotationProgress(0);
      }
    } else {
      lastAngle.current = null;
    }
  };

  // Mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY, false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isTriggered]);

  // Touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartTime.current = Date.now();
        updatePosition(touch.clientX, touch.clientY, true);

        // Start long press timer
        longPressTimer.current = setTimeout(() => {
          const progress = 1;
          setStareProgress(progress);
          if (!isTriggered) {
            triggerEasterEgg();
          }
        }, longPressThreshold);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY, true);

        // Cancel long press if moved significantly
        if (longPressTimer.current) {
          const touchDuration = Date.now() - touchStartTime.current;
          if (touchDuration > 100) {
            // Update visual feedback for long press
            const progress = Math.min(touchDuration / longPressThreshold, 1);
            setStareProgress(progress);
          }
        }
      }
    };

    const handleTouchEnd = () => {
      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Reset stare progress if not triggered
      if (!isTriggered && stareProgress < 1) {
        setStareProgress(0);
      }

      lastAngle.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, [isTriggered, stareProgress]);

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

      const dx = mousePos.current.x - centerX;
      const dy = mousePos.current.y - centerY;
      const angle = Math.atan2(dy, dx);
      const maxDist = eyeRadiusX * 0.4;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
      const pupilX = centerX + Math.cos(angle) * dist * 0.5;
      const pupilY = centerY + Math.sin(angle) * dist * 0.3;

      const maxProgress = Math.max(rotationProgress, stareProgress);

      let eyeWhiteColor = '#fafaf9';
      let irisColor = '#737373';
      let pupilColor = '#262626';

      if (maxProgress >= 0.7) {
        irisColor = '#7c2d12';
        eyeWhiteColor = '#fef2f2';
      }

      const basePupilRadius = 8;
      const pupilRadius = basePupilRadius + maxProgress * 4;

      ctx.fillStyle = eyeWhiteColor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      const irisRadius = 15 + maxProgress * 3;
      ctx.shadowBlur = 0;
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, irisRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(pupilX - 2, pupilY - 2, pupilRadius * 0.25, 0, Math.PI * 2);
      ctx.fill();

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
    onEasterEggTrigger();

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
      onNormalClick();
    }
  };

  // Detect if mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-5px, 5px); }
          50% { transform: translate(5px, -5px); }
          75% { transform: translate(-5px, -5px); }
        }

        /* Mobile-optimized eye widget */
        @media (max-width: 640px) {
          .eye-widget-container {
            bottom: 1.5rem !important;
            right: 1.5rem !important;
          }

          .eye-widget-canvas {
            width: 140px !important;
            height: 140px !important;
            transform-origin: center;
          }
        }

        /* Better touch feedback */
        .eye-widget-canvas:active {
          transform: scale(0.95);
        }
      `}</style>

      <div className="eye-widget-container fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleClick}
          className="eye-widget-canvas cursor-pointer rounded-2xl bg-neutral-50 border border-neutral-200/50 shadow-lg sm:shadow-sm transition-all duration-200 touch-none"
          style={{
            opacity: isTriggered ? 0.6 : 1,
          }}
        />

        {/* Instructions - different for mobile vs desktop */}
        {rotationProgress === 0 && stareProgress === 0 && !isTriggered && (
          <div className="absolute -top-12 sm:-top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <p className="text-xs sm:text-[10px] text-neutral-400 text-center font-medium sm:font-normal">
              {isMobile ? 'Hold or circle to unlock' : 'Two secrets hidden'}
            </p>
          </div>
        )}

        {/* Progress indicator */}
        {(rotationProgress > 0 || stareProgress > 0) && Math.max(rotationProgress, stareProgress) < 1 && !isTriggered && (
          <div className="absolute -top-14 sm:-top-10 left-1/2 transform -translate-x-1/2 text-center">
            <div className="w-20 sm:w-16 h-1 sm:h-0.5 bg-neutral-200 rounded-full overflow-hidden mb-1.5 sm:mb-1">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.max(rotationProgress, stareProgress) * 100}%`,
                  backgroundColor: '#737373',
                }}
              />
            </div>
            <p className="text-xs sm:text-[10px] text-neutral-400 font-medium sm:font-normal">
              {Math.round(Math.max(rotationProgress, stareProgress) * 100)}%
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default EyeWidget;
