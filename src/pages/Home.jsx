import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Create or reuse your global socket
  //const socket = io('https://piquant-sneaky-acoustic.glitch.me', {
  const socket = io('http://localhost:4000', {
  transports: ['websocket'],
  pingTimeout: 1800000,
  pingInterval: 25000,
});

function generateRandomAlphaNumeric() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateUsername = (newUsername) => {
    setUsername(newUsername);
    socket.emit('updateUsername', { username: newUsername });
  };

  const handleJoin = () => {
    if (!username.trim()) {
      alert("Please enter a username before joining.");
      return;
    }
    setLoading(true);

    setTimeout(() => {
      if (roomId.trim()) {
        navigate("/room/" + roomId, { state: { username } });
        setLoading(false);
      }
    }, 1000);
  };

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert("Please enter a username before creating a room.");
      return;
    }
    setLoading(true);

    const newRoomId = generateRandomAlphaNumeric();
    setTimeout(() => {
      navigate("/room/" + newRoomId, { state: { username } });
      setLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="page home-page">
      <div className="home-form">
        <h2>Join a Room</h2>
        <input 
          type="text" 
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <br />
        <div className="username-input">
          <input
            required
            type="text"
            placeholder="Enter your username..."
            value={username}
            onChange={(e) => updateUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <center>
          <button className="glass-button" onClick={handleJoin}>Join</button>
          <br /><br />
          <button className="glass-button" onClick={handleCreateRoom}>
            Create a new Room
          </button>
        </center>
      </div>
    </div>
  );
}

export default Home;
