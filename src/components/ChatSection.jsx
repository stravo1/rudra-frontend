import React, { useState, useEffect, useRef } from 'react';

function ChatSection({ socket, roomId, username }) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [showEmojis, setShowEmojis] = useState(false);
  const [showFrequentPopup, setShowFrequentPopup] = useState(false);
  const [emojiUsage, setEmojiUsage] = useState({});
  const [pendingUsage, setPendingUsage] = useState({});
const emojiList = [
  // 😀 Smiley Emojis
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','☺️','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴',
  // 😡 Angry, Fearful, etc.
  '😷','🤒','🤕','🤢','🤮','🤧','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','😤','😡','😠','🤬','😈','👿','💀','☠️','🤡','👹','👺','🤖',
  // ✨ Gestures
  '👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤏','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','💪','🦾','🖕','✍️','🤳',
  // 🧍 People
  '🧍','🧍‍♂️','🧍‍♀️','🧎','🧎‍♂️','🧎‍♀️','💇','💇‍♂️','💇‍♀️','💅','🕴️','💃','🕺','👯','👯‍♂️','👯‍♀️','🧖','🧖‍♂️','🧖‍♀️','🧗','🧗‍♂️','🧗‍♀️','🏃','🏃‍♂️','🏃‍♀️','👫','👭','👬',
  // 🐶 Animals
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄',
  // 🐛 More animals
  '🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🐢','🐍','🦎','🦂','🦀','🦞','🦐','🦑','🐙','🐡','🐠','🐟','🐳','🐋','🦈','🐊','🦥','🦦','🦨','🦘',
  // 🍏 Food & Drink
  '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕',
  // 🍜 More food
  '🌮','🌯','🥙','🧆','🥪','🥗','🍿','🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🍵','🧃','🥤','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾',
  // ⚽ Activities
  '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🏏','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🪂','⛸️','🥌','🎿','⛷️','🏂','🏋️','🏋️‍♂️','🏋️‍♀️','🤼','🤼‍♂️','🤼‍♀️','🤸','🤸‍♂️','🤸‍♀️','⛹️','⛹️‍♂️','⛹️‍♀️','🤺','🤾','🤾‍♂️','🤾‍♀️','🏌️','🏌️‍♂️','🏌️‍♀️','🏇','🧘','🧘‍♂️','🧘‍♀️',
  // 🚗 Travel & Places
  '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🛴','🚲','🛵','🏍️','🛺','🚔','🚨','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','💺','🚁','🚀','🛸','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢',
  // 💡 Objects
  '💌','🕳️','💣','🛒','🔪','🏺','🗺️','🧭','💈','💉','🩸','💊','🚪','🪑','🛏️','🛋️','🚽','🚿','🛁','🪒','🪞','🪟','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🪜','🔑','🗝️','🚬','⚰️','⚱️','🏏','🎁','🎈','🎏','🎀','🎊','🎉','🪄','🪅','🎎','🎐','🎃','🎄','🎆','🎇','🎑','🧨','✨','🎈',
  // 💟 Symbols
  '❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️',
  // 🚩 Flags
  '🏳️','🏴','🏴‍☠️','🏳️‍🌈','🏳️‍⚧️','🇮🇳','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇳🇿','🇯🇵','🇨🇳','🇰🇷','🇧🇷','🇫🇷','🇩🇪','🇪🇸','🇮🇹','🇷🇺','🇦🇪','🇸🇦','🇮🇱','🇵🇰','🇧🇩','🇳🇵','🇧🇹','🇱🇰','🇨🇭','🇮🇩','🇲🇾','🇸🇬','🇹🇭','🇵🇭','🇻🇳','🇿🇦','🇳🇬','🇲🇽','🇦🇷','🇨🇱','🇨🇴','🇵🇪','🇺🇾','🇵🇾','🇧🇴','🇪🇨','🇬🇹','🇨🇺','🇵🇷','🇵🇸','🇵🇹','🇹🇷','🇸🇪','🇳🇴','🇫🇮','🇩🇰','🇮🇪','🇦🇹','🇧🇪','🇳🇱','🇵🇱','🇨🇿','🇭🇺','🇷🇴','🇸🇰','🇸🇮','🇭🇷'
];

  useEffect(() => {
    if (!socket) return;

    const handleRoomMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        { username: msg.username, message: msg.message }
      ]);
    };

    socket.on('roomMessage', handleRoomMessage);
    return () => {
      socket.off('roomMessage', handleRoomMessage);
    };
  }, [socket]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.clientHeight <= container.scrollTop + 50;

    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    const trimmed = inputMsg.trim();
    if (trimmed) {
      socket.emit('chatMessage', { roomId, message: trimmed, username });
      setInputMsg('');
    }

    setEmojiUsage((prev) => {
      const merged = { ...prev };
      Object.entries(pendingUsage).forEach(([emoji, count]) => {
        merged[emoji] = (merged[emoji] || 0) + count;
      });
      return merged;
    });

    setPendingUsage({});
    setShowEmojis(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleEmojis = () => setShowEmojis(prev => !prev);

  const handleIconMouseEnter = () => {
    if (!showEmojis) setShowFrequentPopup(true);
  };
  const handleIconMouseLeave = () => setShowFrequentPopup(false);

  const handleEmojiClick = (emoji) => {
    setInputMsg(prev => prev + emoji);
    setPendingUsage(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));
  };

  const frequentlyUsed = Object.entries(emojiUsage)
    .sort((a, b) => b[1] - a[1])
    .map(([emoji]) => emoji)
    .slice(0, 5);

  return (
    <div className="chat-section">
      <h3>Chat</h3>

      <div ref={messagesContainerRef} className="messages">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`message ${m.username === username ? 'own' : 'other'}`}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {m.username !== username && (
              <div className="message-username"><strong>{m.username}</strong></div>
            )}
            <div className="message-text">{m.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="emoji-textarea-container">
          <textarea
            className="chat-textarea"
            rows={2}
            placeholder="Type a message..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <span
            className="emoji-icon"
            role="button"
            onClick={toggleEmojis}
            onMouseEnter={handleIconMouseEnter}
            onMouseLeave={handleIconMouseLeave}
          >😊</span>

          {showFrequentPopup && !showEmojis && frequentlyUsed.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '45px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px'
              }}
            >
              {frequentlyUsed.map((emoji, index) => (
                <span key={index} style={{ fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => handleEmojiClick(emoji)}>{emoji}</span>
              ))}
            </div>
          )}
        </div>

        <button className="glass-button" onClick={sendMessage}>Send</button>
      </div>

      {showEmojis && (
        <div style={{
          marginTop: '10px',
          background: 'rgba(0,0,0,0.7)',
          borderRadius: '10px',
          padding: '10px',
          maxWidth: '260px',
          maxHeight: '150px',
          overflowY: 'auto',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>All Emojis</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {emojiList.map((emoji, index) => (
              <span key={index} style={{ fontSize: '1.3rem', cursor: 'pointer' }} onClick={() => handleEmojiClick(emoji)}>
                {emoji}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSection;