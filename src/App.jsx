import React from 'react';
import AppRouter from './router';
import AnimatedBackground from "./AnimatedBackground";

function App() {
  return (
    <div className="app-container">
      <h1>Video Sharing + Chat</h1>
      {/* If you want animated background visible, uncomment below: */}
      {<AnimatedBackground />}
      <AppRouter />
    </div>
  );
}

export default App;
