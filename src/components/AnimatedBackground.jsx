import React from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

function AnimatedBackground() {
  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  return (
    <div className="animated-bg">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          background: { color: 'transparent' },
          fpsLimit: 60,
          interactivity: {
            events: {
              onHover: { enable: true, mode: 'repulse' },
              resize: true,
            },
          },
          particles: {
            color: { value: '#ffffff' },
            number: { value: 80, density: { enable: true, area: 800 } },
            shape: { type: 'circle' },
            opacity: { value: 0.4 },
            size: { value: 3, random: true },
            links: {
              enable: true,
              distance: 150,
              color: '#ffffff',
              opacity: 0.3,
              width: 1,
            },
            move: {
              enable: true,
              speed: 2,
              direction: 'none',
              random: false,
              straight: false,
              outModes: { default: 'out' },
            },
          },
        }}
      />
    </div>
  );
}

export default AnimatedBackground;
