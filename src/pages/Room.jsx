// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import io from 'socket.io-client';
// import ChatSection from '../components/ChatSection';
// import WebRTCSection from '../components/WebRTCSection';
// import VideoPlayer from '../components/VideoPlayer';

// // Reuse or create a global socket instance
// let socket = null;

// function Room() {
//   const { roomId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   // If a username was passed via navigation
//   const username = location.state?.username;

//   const [isConnected, setIsConnected] = useState(false);
//   const [isApproved, setIsApproved] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   // For host: track each join request with a countdown timer
//   // Each request has: { id, username, timeLeft, intervalId }
//   const [pendingRequests, setPendingRequests] = useState([]);

//   // For displaying temporary join notifications in the queue box
//   const [joinNotifications, setJoinNotifications] = useState([]);

//   // For joinee: flag to show permission denied pop-up
//   const [showDeniedPopup, setShowDeniedPopup] = useState(false);

//   useEffect(() => {
//     // Create or reuse the socket
//     if (!socket) {
//       socket = io('http://localhost:4000', {
//         transports: ['websocket'],
//         pingTimeout: 1800000,
//         pingInterval: 25000,
//       });
//     }

//     if (!isConnected) {
//       socket.connect();
//       socket.emit('updateUsername', { username });
//       socket.emit('joinRoom', roomId);
//       setIsConnected(true);
//     }

//     // Listen for join approval (joinee)
//     const handleJoinApproved = () => {
//       console.log('[DEBUG FRONTEND] joinApproved received');
//       setIsApproved(true);
//       setIsLoading(false);
//     };
//     socket.on('joinApproved', handleJoinApproved);

//     // Listen for join denial (joinee)
//     const handleJoinDenied = () => {
//       console.log('[DEBUG FRONTEND] joinDenied received');
//       setShowDeniedPopup(true);
//       // Show the denial pop-up for a few seconds (3 seconds) before redirecting
//       setTimeout(() => {
//         navigate('/');
//       }, 3000);
//     };
//     socket.on('joinDenied', handleJoinDenied);

//     // If disconnected before approval, treat as denial
//     const handleDisconnect = (reason) => {
//       console.log('[DEBUG FRONTEND] Disconnected, reason =', reason);
//       if (!isApproved) {
//         setShowDeniedPopup(true);
//         setTimeout(() => {
//           navigate('/');
//         }, 3000);
//       }
//     };
//     socket.on('disconnect', handleDisconnect);

//     // Host: When a join request is received, add it with a 30-second timer
//     const handleJoinRequest = ({ newUserId, newUsername }) => {
//       console.log(`[DEBUG] Host sees joinRequest from: ${newUsername}`);

//       const newRequest = {
//         id: newUserId,
//         username: newUsername,
//         timeLeft: 30,
//         intervalId: null,
//       };

//       // Start an interval to decrement timeLeft every second
//       const intervalId = setInterval(() => {
//         setPendingRequests((prev) =>
//           prev
//             .map((req) => {
//               if (req.id === newUserId) {
//                 if (req.timeLeft <= 1) {
//                   clearInterval(req.intervalId);
//                   // Auto-deny the request when timer runs out
//                   socket.emit('denyJoin', { newUserId });
//                   return null;
//                 }
//                 return { ...req, timeLeft: req.timeLeft - 1 };
//               }
//               return req;
//             })
//             .filter(Boolean)
//         );
//       }, 1000);

//       newRequest.intervalId = intervalId;
//       setPendingRequests((prev) => [...prev, newRequest]);
//     };
//     socket.on('joinRequest', handleJoinRequest);

//     // Minimal loading fallback
//     const timer = setTimeout(() => {
//       if (isApproved) {
//         setIsLoading(false);
//       }
//     }, 1000);

//     return () => {
//       clearTimeout(timer);
//       socket.off('joinApproved', handleJoinApproved);
//       socket.off('joinDenied', handleJoinDenied);
//       socket.off('disconnect', handleDisconnect);
//       socket.off('joinRequest', handleJoinRequest);
//     };
//   }, [roomId, username, isConnected, isApproved, navigate]);

//   // Host: Approve join request manually and show notification
//   const handleApproveJoin = (requestId) => {
//     const req = pendingRequests.find((r) => r.id === requestId);
//     if (req) {
//       clearInterval(req.intervalId);
//       socket.emit('approveJoin', { newUserId: requestId });
//       // Add a join notification to be displayed for 3 seconds
//       const notification = `${req.username} has joined the room`;
//       setJoinNotifications((prev) => [...prev, notification]);
//       setTimeout(() => {
//         setJoinNotifications((prev) =>
//           prev.filter((msg) => msg !== notification)
//         );
//       }, 3000);
//     }
//     setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
//   };

//   // Host: Deny join request manually
//   const handleDenyJoin = (requestId) => {
//     const req = pendingRequests.find((r) => r.id === requestId);
//     if (req) {
//       clearInterval(req.intervalId);
//       socket.emit('denyJoin', { newUserId: requestId });
//     }
//     setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
//   };

//   // While waiting for approval, show a loading screen (for joinees)
//   if (isLoading && !showDeniedPopup) {
//     return (
//       <div className="loading-screen">
//         <div className="loading-spinner" />
//         <div className="loading-text">Waiting for acceptance...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="page room-page">
//       <div className="leave-button-container">
//         <button
//           className="glass-button red-glass"
//           onClick={() => {
//             socket.emit('chatMessage', {
//               roomId,
//               message: `${username} has left the room`,
//             });
//             socket.disconnect();
//             navigate('/');
//           }}
//         >
//           Leave
//         </button>
//       </div>

//       {/* Joinee Permission Denied pop-up */}
//       {showDeniedPopup && (
//         <div className="join-requests-container">
//           <div className="join-request-popup">
//             <p>
//               <strong>Permission Denied</strong>
//             </p>
//             <p>You’ll be redirected to the homepage shortly...</p>
//           </div>
//         </div>
//       )}

//       <div className="room-header">
//         <h2>{`Room: ${roomId}`}</h2>
//       </div>

//       <div className="main-layout">
//         <div className="video-area">
//           <div className="top-thumbnails">
//             <WebRTCSection socket={socket} roomId={roomId} />
//           </div>
//           <div className="big-video">
//             <VideoPlayer socket={socket} roomId={roomId} />
//           </div>
//         </div>

//         <div className="chat-area">
//           <ChatSection socket={socket} roomId={roomId} username={username} />
//           {/* Waiting queue box for join requests and join notifications */}
//           {(pendingRequests.length > 0 || joinNotifications.length > 0) && (
//             <div className="join-requests-queue">
//               {joinNotifications.map((msg, idx) => (
//                 <div className="join-notification" key={`notif-${idx}`}>
//                   <p>{msg}</p>
//                 </div>
//               ))}
//               {pendingRequests.map((req) => (
//                 <div className="join-request-item" key={req.id}>
//                   <p>
//                     <strong>{req.username}</strong> wants to join.{" "}
//                     <span className="countdown">({req.timeLeft}s)</span>
//                   </p>
//                   <div className="request-buttons">
//                     <button
//                       className="glass-button"
//                       onClick={() => handleApproveJoin(req.id)}
//                     >
//                       Accept
//                     </button>
//                     <button
//                       className="glass-button"
//                       onClick={() => handleDenyJoin(req.id)}
//                       style={{ marginLeft: '10px' }}
//                     >
//                       Decline
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Room;

import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import ChatSection from '../components/ChatSection';
import WebRTCSection from '../components/WebRTCSection';
import VideoPlayer from '../components/VideoPlayer';

// Reuse or create a global socket instance
let socket = null;

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // If a username was passed via navigation
  const username = location.state?.username;

  const [isConnected, setIsConnected] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // For host: track each join request with a countdown timer
  // Each request: { id, username, timeLeft, intervalId }
  const [pendingRequests, setPendingRequests] = useState([]);

  // For displaying temporary join/leave notifications in the queue box
  const [joinNotifications, setJoinNotifications] = useState([]);

  // For joinee: flag to show permission denied pop-up
  const [showDeniedPopup, setShowDeniedPopup] = useState(false);

  useEffect(() => {
    // Create or reuse the socket
    if (!socket) {
      //socket = io('https://piquant-sneaky-acoustic.glitch.me', {
      socket = io('http://localhost:4000', {
        transports: ['websocket'],
        pingTimeout: 1800000,
        pingInterval: 25000,
      });
    }

    if (!isConnected) {
      socket.connect();
      socket.emit('updateUsername', { username });
      socket.emit('joinRoom', roomId);
      setIsConnected(true);
    }

    // Listen for join approval (joinee)
    const handleJoinApproved = () => {
      console.log('[DEBUG FRONTEND] joinApproved received');
      setIsApproved(true);
      setIsLoading(false);
    };
    socket.on('joinApproved', handleJoinApproved);

    // Listen for join denial (joinee)
    const handleJoinDenied = () => {
      console.log('[DEBUG FRONTEND] joinDenied received');
      setShowDeniedPopup(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    };
    socket.on('joinDenied', handleJoinDenied);

    // If disconnected before approval, treat as denial
    const handleDisconnect = (reason) => {
      console.log('[DEBUG FRONTEND] Disconnected, reason =', reason);
      if (!isApproved) {
        setShowDeniedPopup(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };
    socket.on('disconnect', handleDisconnect);

    // Host: When a join request is received, add it with a 30-second timer
    const handleJoinRequest = ({ newUserId, newUsername }) => {
      console.log(`[DEBUG] Host sees joinRequest from: ${newUsername}`);

      const newRequest = {
        id: newUserId,
        username: newUsername,
        timeLeft: 30,
        intervalId: null,
      };

      const intervalId = setInterval(() => {
        setPendingRequests((prev) =>
          prev
            .map((req) => {
              if (req.id === newUserId) {
                if (req.timeLeft <= 1) {
                  clearInterval(req.intervalId);
                  // Auto-deny the request when timer runs out
                  socket.emit('denyJoin', { newUserId });
                  return null;
                }
                return { ...req, timeLeft: req.timeLeft - 1 };
              }
              return req;
            })
            .filter(Boolean)
        );
      }, 1000);

      newRequest.intervalId = intervalId;
      setPendingRequests((prev) => [...prev, newRequest]);
    };
    socket.on('joinRequest', handleJoinRequest);

    // Listen for "has left the room" messages to show leave notifications.
    // (Assuming ChatSection filters out join/leave messages.)
    const handleLeaveNotification = (msg) => {
      if (msg.message === 'has left the room') {
        const notification = `${msg.username} has left the room`;
        setJoinNotifications((prev) => [...prev, notification]);
        setTimeout(() => {
          setJoinNotifications((prev) =>
            prev.filter((n) => n !== notification)
          );
        }, 3000);
      }
    };
    socket.on('roomMessage', handleLeaveNotification);

    // Minimal loading fallback
    const timer = setTimeout(() => {
      if (isApproved) {
        setIsLoading(false);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      socket.off('joinApproved', handleJoinApproved);
      socket.off('joinDenied', handleJoinDenied);
      socket.off('disconnect', handleDisconnect);
      socket.off('joinRequest', handleJoinRequest);
      socket.off('roomMessage', handleLeaveNotification);
    };
  }, [roomId, username, isConnected, isApproved, navigate]);

  // Host: Approve join request manually and show join notification
  const handleApproveJoin = (requestId) => {
    const req = pendingRequests.find((r) => r.id === requestId);
    if (req) {
      clearInterval(req.intervalId);
      socket.emit('approveJoin', { newUserId: requestId });
      const notification = `${req.username} has joined the room`;
      setJoinNotifications((prev) => [...prev, notification]);
      setTimeout(() => {
        setJoinNotifications((prev) =>
          prev.filter((msg) => msg !== notification)
        );
      }, 3000);
    }
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // Host: Deny join request manually
  const handleDenyJoin = (requestId) => {
    const req = pendingRequests.find((r) => r.id === requestId);
    if (req) {
      clearInterval(req.intervalId);
      socket.emit('denyJoin', { newUserId: requestId });
    }
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  if (isLoading && !showDeniedPopup) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Waiting for acceptance...</div>
      </div>
    );
  }

  return (
    <div className="page room-page">
      <div className="leave-button-container">
        <button
          className="glass-button red-glass"
          onClick={() => {
            // When leaving, emit a leave message
            socket.emit('chatMessage', {
              roomId,
              message: `${username} has left the room`,
            });
            socket.disconnect();
            navigate('/');
          }}
        >
          Leave
        </button>
      </div>

      {showDeniedPopup && (
        <div className="join-requests-container">
          <div className="join-request-popup">
            <p>
              <strong>Permission Denied</strong>
            </p>
            <p>You’ll be redirected to the homepage shortly...</p>
          </div>
        </div>
      )}

      <div className="room-header">
        <h2>{`Room: ${roomId}`}</h2>
      </div>

      <div className="main-layout">
        <div className="video-area">
          <div className="top-thumbnails">
            <WebRTCSection socket={socket} roomId={roomId} />
          </div>
          <div className="big-video">
            <VideoPlayer socket={socket} roomId={roomId} />
          </div>
        </div>

        <div className="chat-area">
          <ChatSection socket={socket} roomId={roomId} username={username} />
          {/* Waiting queue box for join requests and join/leave notifications */}
          {(pendingRequests.length > 0 || joinNotifications.length > 0) && (
            <div className="join-requests-queue">
              {joinNotifications.map((msg, idx) => (
                <div className="join-notification" key={`notif-${idx}`}>
                  <p>{msg}</p>
                </div>
              ))}
              {pendingRequests.map((req) => (
                <div className="join-request-item" key={req.id}>
                  <p>
                    <strong>{req.username}</strong> wants to join.{' '}
                    <span className="countdown">({req.timeLeft}s)</span>
                  </p>
                  <div className="request-buttons">
                    <button
                      className="glass-button"
                      onClick={() => handleApproveJoin(req.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="glass-button"
                      onClick={() => handleDenyJoin(req.id)}
                      style={{ marginLeft: '10px' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Room;
