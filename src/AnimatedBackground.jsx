import Particles from "react-tsparticles";

const AnimatedBackground = () => {
  return (
    <Particles
      id="tsparticles"
      options={{
        fullScreen: { enable: true },
        particles: {
          number: { value: 100 },
          move: { enable: true, speed: 1 },
          size: { value: 3 },
          opacity: { value: 0.5 },
          links: { enable: true, opacity: 0.3 },
        },
      }}
    />
  );
};

export default AnimatedBackground;
