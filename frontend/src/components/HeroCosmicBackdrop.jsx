import React, { useMemo } from "react";

// 1. Background Stars in deep space (behind clouds)
const BACKGROUND_STARS = [
  // Upper Left Sky
  { id: "bg-s1", left: "6%", top: "12%", size: 2, color: "cyan", delay: "0.2s", dur: "3.6s" },
  { id: "bg-s2", left: "14%", top: "20%", size: 3, color: "blue", delay: "1.1s", dur: "4.4s", isSparkle: true },
  { id: "bg-s3", left: "22%", top: "9%", size: 1.5, color: "white", delay: "2.3s", dur: "3.8s" },
  { id: "bg-s4", left: "28%", top: "18%", size: 2, color: "violet", delay: "0.7s", dur: "4.0s" },
  { id: "bg-s5", left: "10%", top: "34%", size: 1.5, color: "cyan", delay: "1.8s", dur: "3.5s" },
  { id: "bg-s6", left: "4%", top: "24%", size: 2, color: "white", delay: "2.8s", dur: "4.2s" },

  // Center Upper Cosmos
  { id: "bg-s7", left: "38%", top: "7%", size: 1.5, color: "white", delay: "0.5s", dur: "3.9s" },
  { id: "bg-s8", left: "50%", top: "4%", size: 2, color: "cyan", delay: "1.6s", dur: "4.5s" },
  { id: "bg-s9", left: "62%", top: "6%", size: 1.5, color: "blue", delay: "2.1s", dur: "3.7s" },

  // Upper Right Sky
  { id: "bg-s10", left: "74%", top: "10%", size: 1.5, color: "white", delay: "0.4s", dur: "4.1s" },
  { id: "bg-s11", left: "85.5%", top: "3.5%", size: 3.5, color: "cyan", delay: "1.2s", dur: "4.8s", isSparkle: true },
  { id: "bg-s12", left: "91%", top: "14%", size: 2, color: "blue", delay: "0.9s", dur: "3.6s" },
  { id: "bg-s13", left: "96%", top: "22%", size: 1.5, color: "white", delay: "2.4s", dur: "4.3s" },
  { id: "bg-s14", left: "70%", top: "21%", size: 2, color: "violet", delay: "1.7s", dur: "3.9s" },
];

// 2. Foreground Stars & Radiant Diamond Glints (directly over / framing the clouds like in reference)
const FOREGROUND_STARS = [
  // Prominent Left Diamond Glint (matches the bright cyan flare on left cloud billow in reference)
  {
    id: "fg-left-flare",
    left: "3.2%",
    top: "39%",
    size: "large",
    color: "cyan",
    delay: "0.1s",
    dur: "4.2s",
    isSparkle: true,
  },
  // Left cloud rim sparkles
  {
    id: "fg-left-rim-1",
    left: "8.5%",
    top: "23%",
    size: "medium",
    color: "blue",
    delay: "1.5s",
    dur: "4.6s",
    isSparkle: true,
  },
  {
    id: "fg-left-rim-2",
    left: "17%",
    top: "46%",
    size: "small",
    color: "cyan",
    delay: "0.8s",
    dur: "3.6s",
    isSparkle: true,
  },
  {
    id: "fg-left-low",
    left: "5.5%",
    top: "66%",
    size: 2,
    color: "white",
    delay: "2.0s",
    dur: "3.8s",
  },
  {
    id: "fg-left-mote",
    left: "12%",
    top: "58%",
    size: 1.8,
    color: "cyan",
    delay: "1.3s",
    dur: "4.1s",
  },

  // Prominent Right Bottom Diamond Glint (matches bright glint on right cloud rim in reference)
  {
    id: "fg-right-flare",
    left: "94%",
    top: "82%",
    size: "large",
    color: "cyan",
    delay: "0.4s",
    dur: "4.5s",
    isSparkle: true,
  },
  // Right cloud rim sparkles
  {
    id: "fg-right-rim-1",
    left: "81%",
    top: "26%",
    size: "medium",
    color: "blue",
    delay: "1.8s",
    dur: "5.0s",
    isSparkle: true,
  },
  {
    id: "fg-right-rim-2",
    left: "91%",
    top: "32%",
    size: "small",
    color: "violet",
    delay: "0.6s",
    dur: "3.7s",
    isSparkle: true,
  },
  {
    id: "fg-right-mid",
    left: "88%",
    top: "54%",
    size: 2.2,
    color: "cyan",
    delay: "2.2s",
    dur: "4.3s",
  },
  {
    id: "fg-right-mote",
    left: "83%",
    top: "47%",
    size: 1.6,
    color: "blue",
    delay: "1.0s",
    dur: "3.5s",
  },
];

// Helper component for rich 4-point diamond sparkle stars with optical flare spikes
function SparkleStar({ star }) {
  const isLarge = star.size === "large";
  const sizePx = isLarge ? 34 : star.size === "medium" ? 22 : 16;

  return (
    <div
      className={`cosmic-sparkle-star sparkle-${star.color} ${isLarge ? "sparkle-large" : ""}`}
      style={{
        left: star.left,
        top: star.top,
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        animationDelay: star.delay,
        animationDuration: star.dur,
      }}
    >
      <svg viewBox="0 0 40 40" className="sparkle-svg" fill="currentColor">
        {/* Main 4-point elongated diamond flare */}
        <path d="M20 0 L22.2 17.5 L39.5 20 L22.2 22.5 L20 40 L17.8 22.5 L0.5 20 L17.8 17.5 Z" />
        {/* Secondary diagonal micro-flare rays for astronomical refraction look */}
        <path
          d="M20 8.5 L21.6 18.2 L30.5 20 L21.6 21.8 L20 31.5 L18.4 21.8 L9.5 20 L18.4 18.2 Z"
          transform="rotate(45 20 20)"
          opacity="0.45"
        />
        {/* White-hot center star core */}
        <circle cx="20" cy="20" r="2.8" fill="#FFFFFF" />
      </svg>
      {/* Radial optical halo glow */}
      <div className="sparkle-halo" />
      {/* Horizontal anamorphic lens flare beam for prominent glints */}
      {isLarge && <div className="sparkle-lens-flare" />}
    </div>
  );
}

// Helper component for pinpoint twinkling stars
function PinpointStar({ star }) {
  return (
    <span
      className={`cosmic-pinpoint-star star-color-${star.color}`}
      style={{
        left: star.left,
        top: star.top,
        width: `${star.size}px`,
        height: `${star.size}px`,
        animationDelay: star.delay,
        animationDuration: star.dur,
      }}
    />
  );
}

export default function HeroCosmicBackdrop() {
  const bgStars = useMemo(() => BACKGROUND_STARS, []);
  const fgStars = useMemo(() => FOREGROUND_STARS, []);

  return (
    <div className="hero-cosmic-backdrop" aria-hidden="true">
      {/* 1. Deep Space Star Layer (behind clouds) */}
      <div className="hero-stars-layer hero-stars-background">
        {bgStars.map((star) =>
          star.isSparkle ? (
            <SparkleStar key={star.id} star={star} />
          ) : (
            <PinpointStar key={star.id} star={star} />
          )
        )}
      </div>

      {/* 2. Effective Multi-Layer Moving Atmospheric Clouds */}
      <div className="hero-luminous-clouds-wrap">
        {/* Ambient breathing luminous background glow silhouette */}
        <div className="hero-cloud-ambient-shadow">
          <img
            src="/Luminous%20Clouds.png"
            alt=""
            className="hero-luminous-clouds-img cloud-ambient-blur"
            draggable={false}
            loading="eager"
          />
        </div>

        {/* Drifting atmospheric cyan/blue mist puffs for realistic fluid motion */}
        <div className="hero-cloud-mist hero-cloud-mist-left" />
        <div className="hero-cloud-mist hero-cloud-mist-right" />

        {/* Main high-resolution crisp luminous clouds with organic billow float */}
        <div className="hero-cloud-main-layer">
          <img
            src="/Luminous%20Clouds.png"
            alt="Luminous Clouds"
            className="hero-luminous-clouds-img cloud-crisp-main"
            draggable={false}
            loading="eager"
          />
        </div>
      </div>

      {/* 3. Foreground Radiant Sparkles & Diamond Glints (shining in front of / on cloud edges) */}
      <div className="hero-stars-layer hero-stars-foreground">
        {fgStars.map((star) =>
          star.isSparkle ? (
            <SparkleStar key={star.id} star={star} />
          ) : (
            <PinpointStar key={star.id} star={star} />
          )
        )}
      </div>
    </div>
  );
}
