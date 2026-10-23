import React, { useEffect, useRef, useState } from "react";

/**
 * InteractiveMascot Component
 * - Dual-layer 3D character tracking:
 *   1. Head rotates and tilts in 3D perspective (Yaw, Pitch, Roll) around the neck collar pivot
 *   2. Glowing cyan visor eyes follow with an additional parallax layer
 * - Organic blinking animation (every 3-6s, lasting ~140ms)
 * - Click / tap reaction with cheerful head nod, widened glowing eyes, and ambient visor pulse
 * - Full responsive and reduced-motion support
 */
export default function InteractiveMascot({ className = "" }) {
  const containerRef = useRef(null);
  const headRef = useRef(null);
  const eyesRef = useRef(null);

  const [isBlinking, setIsBlinking] = useState(false);
  const [isHappy, setIsHappy] = useState(false);

  // Mutable refs to drive smooth 60fps tracking without triggering React re-renders
  const stateRef = useRef({
    // Eyes displacement targets and current values
    targetEyeX: 0,
    targetEyeY: 0,
    currentEyeX: 0,
    currentEyeY: 0,
    // Head 3D transform targets and current values (Yaw, Pitch, Roll, Translate)
    targetRotY: 0,
    targetRotX: 0,
    targetRotZ: 0,
    targetHeadX: 0,
    targetHeadY: 0,
    currentRotY: 0,
    currentRotX: 0,
    currentRotZ: 0,
    currentHeadX: 0,
    currentHeadY: 0,
    isBlinking: false,
    isHappy: false,
    reducedMotion: false,
  });

  // Keep stateRef in sync with React state
  useEffect(() => {
    stateRef.current.isBlinking = isBlinking;
  }, [isBlinking]);

  useEffect(() => {
    stateRef.current.isHappy = isHappy;
  }, [isHappy]);

  const blinkTimerRef = useRef(null);
  const happyTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Mouse / Touch move calculation
  const updateTargetPos = (clientX, clientY) => {
    if (!containerRef.current || stateRef.current.reducedMotion) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Mascot face center is at roughly 50% X and 35.5% Y of the container
    const faceCenterX = rect.left + rect.width * 0.5;
    const faceCenterY = rect.top + rect.height * 0.355;

    const deltaX = clientX - faceCenterX;
    const deltaY = clientY - faceCenterY;

    // Viewport-relative scaling
    const maxRadiusX = Math.max(window.innerWidth * 0.45, 300);
    const maxRadiusY = Math.max(window.innerHeight * 0.45, 300);

    const normX = Math.max(-1, Math.min(1, deltaX / maxRadiusX));
    const normY = Math.max(-1, Math.min(1, deltaY / maxRadiusY));

    // Eyes displacement inside visor (clamped to keep within dark screen)
    stateRef.current.targetEyeX = normX * 6.8;
    stateRef.current.targetEyeY = normY * 4.2;

    // Head 3D Rotations:
    // - Yaw (rotateY): turns head left/right towards cursor (-8.5deg to +8.5deg)
    // - Pitch (rotateX): tilts head up/down towards cursor (-6deg to +6deg)
    // - Roll (rotateZ): natural slight tilt towards the look direction (-2deg to +2deg)
    stateRef.current.targetRotY = normX * 8.5;
    stateRef.current.targetRotX = -normY * 6.0;
    stateRef.current.targetRotZ = normX * 2.0;

    // Head subtle translation shift
    stateRef.current.targetHeadX = normX * 6.5;
    stateRef.current.targetHeadY = normY * 3.8;
  };

  const resetTargets = () => {
    const s = stateRef.current;
    s.targetEyeX = 0;
    s.targetEyeY = 0;
    s.targetRotY = 0;
    s.targetRotX = 0;
    s.targetRotZ = 0;
    s.targetHeadX = 0;
    s.targetHeadY = 0;
  };

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    stateRef.current.reducedMotion = mediaQuery.matches;

    const handleMediaChange = (e) => {
      stateRef.current.reducedMotion = e.matches;
      if (e.matches) {
        resetTargets();
      }
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    // Blinking schedule: 3-6s random interval
    const scheduleNextBlink = () => {
      const interval = 3000 + Math.random() * 3000;
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 140);
      }, interval);
    };

    scheduleNextBlink();

    // Mouse and Touch listeners
    const onMouseMove = (e) => updateTargetPos(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        updateTargetPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", resetTargets);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", resetTargets);

    // Smooth physics loop (lerp)
    const animate = () => {
      const s = stateRef.current;

      // Eye lerp (slightly faster for eye lead, factor 0.12)
      s.currentEyeX += (s.targetEyeX - s.currentEyeX) * 0.12;
      s.currentEyeY += (s.targetEyeY - s.currentEyeY) * 0.12;

      // Head lerp (slightly heavier with realistic mass/inertia, factor 0.08)
      s.currentHeadX += (s.targetHeadX - s.currentHeadX) * 0.08;
      s.currentHeadY += (s.targetHeadY - s.currentHeadY) * 0.08;
      s.currentRotY += (s.targetRotY - s.currentRotY) * 0.08;
      s.currentRotX += (s.targetRotX - s.currentRotX) * 0.08;
      s.currentRotZ += (s.targetRotZ - s.currentRotZ) * 0.08;

      // Apply 3D Head Transform
      if (headRef.current) {
        if (s.reducedMotion) {
          headRef.current.style.transform = "none";
        } else {
          const happyBounceY = s.isHappy ? -7 : 0;
          const happyScale = s.isHappy ? 1.025 : 1.0;
          headRef.current.style.transform = `perspective(1000px) translate3d(${s.currentHeadX.toFixed(2)}px, ${(s.currentHeadY + happyBounceY).toFixed(2)}px, 0) rotateY(${s.currentRotY.toFixed(2)}deg) rotateX(${s.currentRotX.toFixed(2)}deg) rotateZ(${s.currentRotZ.toFixed(2)}deg) scale(${happyScale})`;
        }
      }

      // Apply Eyes Transform inside the visor
      if (eyesRef.current) {
        const scaleY = s.isBlinking ? 0.08 : (s.isHappy ? 1.15 : 1.0);
        const scaleX = s.isHappy ? 1.08 : 1.0;
        eyesRef.current.style.transform = `translate3d(${s.currentEyeX.toFixed(2)}px, ${s.currentEyeY.toFixed(2)}px, 0) scale(${scaleX}, ${scaleY})`;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", resetTargets);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", resetTargets);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
      if (happyTimerRef.current) clearTimeout(happyTimerRef.current);
    };
  }, []);

  // Click / Tap reaction
  const handleInteraction = () => {
    setIsHappy(true);
    if (happyTimerRef.current) clearTimeout(happyTimerRef.current);
    happyTimerRef.current = setTimeout(() => {
      setIsHappy(false);
    }, 1500);
  };

  return (
    <div
      ref={containerRef}
      className={`mascot-interactive-container ${isHappy ? "is-happy" : ""} ${className}`}
      onClick={handleInteraction}
      role="button"
      tabIndex={0}
      title="Click me!"
      aria-label="Interactive LDRP-AI Robot Mascot"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleInteraction();
        }
      }}
    >
      {/* 3D Moving Head & Body Wrapper */}
      <div ref={headRef} className="mascot-head-wrapper">
        {/* Base Robot: Shell, Headphones, and Visor Glass */}
        <img
          src="/mascot_base.png"
          alt="LDRP-AI Mascot Character"
          className="mascot-base-img"
          draggable={false}
        />

        {/* Dynamic Cursor-Following & Blinking Eyes */}
        <img
          ref={eyesRef}
          src="/mascot_eyes.png"
          alt=""
          aria-hidden="true"
          className={`mascot-eyes-layer ${isBlinking ? "blinking" : ""} ${isHappy ? "happy" : ""}`}
          draggable={false}
        />

        {/* Visor Cyan Ambient Glow Pulse on Interaction */}
        <div
          className={`mascot-face-pulse ${isHappy ? "active" : ""}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
