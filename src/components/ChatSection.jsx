import React, { useState, useEffect } from 'react';

function ChatSection({ socket, roomId }) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handleRoomMessage = (msg) => {
      console.log('[DEBUG FRONTEND] Received roomMessage:', msg);
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('roomMessage', handleRoomMessage);

    return () => {
      socket.off('roomMessage', handleRoomMessage);
    };
  }, [socket]);

  const sendMessage = () => {
    if (inputMsg.trim()) {
      console.log('[DEBUG FRONTEND] Sending chatMessage:', inputMsg);
      socket.emit('chatMessage', { roomId, message: inputMsg });
      setInputMsg('');
    }
  };

  // Press Enter to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-section">
      <h3>Chat</h3>
      <div className="messages">
        {messages.map((m, idx) => (
          <div key={idx} className="message">
            {m}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={handleKeyDown} // <-- Press Enter to send
        />
        <button className='glass-button' onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatSection;
