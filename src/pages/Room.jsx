import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import ChatSection from '../components/ChatSection';
import VideoPlayer from '../components/VideoPlayer';
import UserVideoFeed from '../components/UserVideoFeed';

// GLOBAL socket instance to avoid repeated unmounting/creation.
let socket = null;

function Room() {
  const { roomId } = useParams();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      console.log('[DEBUG FRONTEND] Creating global socket connection');
      socket = io('http://localhost:4000', {
        transports: ['websocket'],
        pingTimeout: 1800000,
        pingInterval: 25000,
      });
    }

    if (!isConnected) {
      socket.connect(); 
      socket.emit('joinRoom', roomId);
      setIsConnected(true);
    }

    return () => {
      // We do NOT disconnect here, to keep the socket global.
      console.log('[DEBUG FRONTEND] Room component unmounted, socket remains connected');
    };
  }, [roomId, isConnected]);

  return (
    <div className="page room-page">
      <h2>Room: {roomId}</h2>
      <div className="video-chat-container">
        <div className="video-container">
          {/* Pass socket and roomId to enable synchronized video */}
          <VideoPlayer socket={socket} roomId={roomId} />
          <UserVideoFeed />
        </div>
        <ChatSection socket={socket} roomId={roomId} />
      </div>
    </div>
  );
}

export default Room;
