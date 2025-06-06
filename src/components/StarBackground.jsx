import { useEffect, useState } from "react";

export const StarBackground = () => {
  const [stars, setStars] = useState([]);
  const [comets, setComets] = useState([]);

  useEffect(() => {
    generateStars();
    generateComets();

    window.addEventListener("resize", generateStars);
    return () => window.removeEventListener("resize", generateStars);
  }, []);

  const generateStars = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const count = Math.floor((window.innerWidth * window.innerHeight) / 12000);

    const newStars = [];

    for (let i = 0; i < count; i++) {
      const orbitRadius = Math.random() * Math.min(centerX, centerY) * 0.9 + 20;
      const angle = Math.random() * 360;
      const size = Math.random() * 2 + 1;
      // slower speed: 5x slower than before
      const speed = ((Math.random() * 0.01 + 0.002) * (Math.random() > 0.5 ? 1 : -1));
      const glowColors = ["#fff", "#aaffff", "#ffd6a5", "#d6a5ff"];
      newStars.push({
        id: i,
        size,
        orbitRadius,
        angle,
        speed,
        glowColor: glowColors[Math.floor(Math.random() * glowColors.length)],
        floatOffset: Math.random() * 1000, // unique seed for vertical floating
      });
    }

    setStars(newStars);
  };

  const generateComets = () => {
    const count = 3;
    const newComets = [];
    for (let i = 0; i < count; i++) {
      newComets.push({
        id: i,
        xStart: Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.15,
        yStart: Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1,
        size: Math.random() * 3 + 2,
        delay: Math.random() * 15,
        duration: Math.random() * 3 + 3, // reduced from 7+ to 3+
        arcHeight: Math.random() * 100 + 50,
        arcWidth: Math.random() * 300 + 200,
      });
    }
    setComets(newComets);
  };


  return (
    <>
      <style>{`
        .star {
          position: absolute;
          border-radius: 50%;
          filter: drop-shadow(0 0 4px var(--glow-color));
          animation-name: pulseGlow;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          animation-timing-function: ease-in-out;
          will-change: transform, opacity;
        }
        @keyframes pulseGlow {
          0% { opacity: 0.5; filter: drop-shadow(0 0 4px var(--glow-color)) brightness(1); }
          50% { opacity: 1; filter: drop-shadow(0 0 10px var(--glow-color)) brightness(1.3); }
          100% { opacity: 0.5; filter: drop-shadow(0 0 4px var(--glow-color)) brightness(1); }
        }
        .comet {
          position: absolute;
          border-radius: 50% / 50%;
          background: linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0));
          filter: drop-shadow(0 0 10px white);
          animation-fill-mode: forwards;
          animation-timing-function: linear;
          will-change: transform, opacity;
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {stars.map(({ id, size, orbitRadius, angle, speed, glowColor, floatOffset }) => (
          <StarOrbitFloat
            key={id}
            size={size}
            orbitRadius={orbitRadius}
            initialAngle={angle}
            speed={speed}
            glowColor={glowColor}
            floatOffset={floatOffset}
          />
        ))}

        {comets.map(({ id, xStart, yStart, size, delay, duration, arcHeight, arcWidth }) => (
          <CometArc
            key={id}
            xStart={xStart}
            yStart={yStart}
            size={size}
            delay={delay}
            duration={duration}
            arcHeight={arcHeight}
            arcWidth={arcWidth}
          />
        ))}
      </div>
    </>
  );
};

// Star with orbit + vertical float animation
const StarOrbitFloat = ({
  size,
  orbitRadius,
  initialAngle,
  speed,
  glowColor,
  floatOffset,
}) => {
  const [angle, setAngle] = useState(initialAngle);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let rafId;
    let start;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;

      setAngle((prev) => (prev + speed * 360 * 0.016) % 360);
      setTime(elapsed);

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [speed]);

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const rad = (angle * Math.PI) / 180;

  // Orbit position
  const x = centerX + orbitRadius * Math.cos(rad) - size / 2;

  // Vertical floating with sine wave for gentle up/down motion (amplitude: 10px)
  const floatY = 10 * Math.sin((time / 500) + floatOffset);

  const y = centerY + orbitRadius * Math.sin(rad) - size / 2 + floatY;

  return (
    <div
      className="star"
      style={{
        width: size + "px",
        height: size + "px",
        left: x + "px",
        top: y + "px",
        backgroundColor: glowColor,
        filter: `drop-shadow(0 0 6px ${glowColor})`,
        animationDuration: `${2 + Math.random() * 3}s`,
      }}
    />
  );
};

// Comet flying in a curved arc path
const CometArc = ({
  xStart,
  yStart,
  size,
  delay,
  duration,
  arcHeight,
  arcWidth,
}) => {
  const [progress, setProgress] = useState(0); // from 0 to 1

  useEffect(() => {
    let rafId;
    let start;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;

      let p = (elapsed / (duration * 1000));
      if (p > 1) p = 1;

      setProgress(p);

      if (p < 1) rafId = requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => {
      rafId = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [delay, duration]);

  // Position along an arc using quadratic Bezier curve formula approximation:
  // x = xStart + arcWidth * progress
  // y = yStart - 4 * arcHeight * progress * (1 - progress)
  // This creates a smooth arc going up and down

  const x = xStart + arcWidth * progress - size * 5;
  const y = yStart - 4 * arcHeight * progress * (1 - progress);

  return (
    <div
      className="comet"
      style={{
        width: size * 10 + "px",
        height: size * 3 + "px",
        left: x + "px",
        top: y + "px",
        opacity: 1 - progress,
      }}
    />
  );
};
