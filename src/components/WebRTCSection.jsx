import React, { useState, useEffect, useRef } from 'react';

function WebRTCSection({ socket, roomId }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peersRef = useRef({});
  
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // 1) Get local camera & mic
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
      })
      .catch(err => console.error('[WebRTC] Media Error:', err));

    // 2) Listen for server events
    const handleOffer = async ({ fromSocketId, offer }) => {
      const pc = createOrGetPeerConnection(fromSocketId);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtcAnswer', { toSocketId: fromSocketId, answer });
    };
    socket.on('webrtcOffer', handleOffer);

    const handleAnswer = async ({ fromSocketId, answer }) => {
      const pc = peersRef.current[fromSocketId];
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    };
    socket.on('webrtcAnswer', handleAnswer);

    const handleCandidate = ({ fromSocketId, candidate }) => {
      const pc = peersRef.current[fromSocketId];
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    };
    socket.on('webrtcIceCandidate', handleCandidate);

    // If a new user joined the call, create an Offer
    const handleUserJoinedCall = (fromSocketId) => {
      createOfferForNewUser(fromSocketId);
    };
    socket.on('user-joined-call', handleUserJoinedCall);

    return () => {
      socket.off('webrtcOffer', handleOffer);
      socket.off('webrtcAnswer', handleAnswer);
      socket.off('webrtcIceCandidate', handleCandidate);
      socket.off('user-joined-call', handleUserJoinedCall);

      Object.values(peersRef.current).forEach(pc => pc.close());
    };
  }, [socket]);

  // 3) Once local stream is ready, auto join the call
  useEffect(() => {
    if (localStream && socket) {
      socket.emit('join-call', roomId);
    }
  }, [localStream, socket, roomId]);

  // Keep track of local stream changes (mute/unmute) in all PCs
  useEffect(() => {
    if (!localStream) return;
    for (let pc of Object.values(peersRef.current)) {
      pc.getSenders().forEach(sender => pc.removeTrack(sender));
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }
  }, [localStream]);

  // Helper: either retrieve or create a new RTCPeerConnection
  const createOrGetPeerConnection = (remoteId) => {
    let pc = peersRef.current[remoteId];
    if (pc) return pc;

    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('webrtcIceCandidate', {
          toSocketId: remoteId,
          candidate: e.candidate
        });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStreams(prev => ({ ...prev, [remoteId]: e.streams[0] }));
    };

    peersRef.current[remoteId] = pc;
    return pc;
  };

  // Called when a new user is announced by server => we create an offer
  const createOfferForNewUser = async (remoteId) => {
    const pc = createOrGetPeerConnection(remoteId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtcOffer', { toSocketId: remoteId, offer });
    } catch (err) {
      console.error('[WebRTC] createOffer error:', err);
    }
  };

  // Toggles
  const toggleVideo = () => {
    if (!localStream) return;
    const newState = !videoOn;
    setVideoOn(newState);
    localStream.getVideoTracks().forEach(track => {
      track.enabled = newState;
    });
  };

  const toggleAudio = () => {
    if (!localStream) return;
    const newState = !audioOn;
    setAudioOn(newState);
    localStream.getAudioTracks().forEach(track => {
      track.enabled = newState;
    });
  };

  return (
    <div className="webrtc-section">
      <div className="video-thumbnails">
        {/* Local thumbnail */}
        {localStream && (
          <video
            className="user-video"
            ref={(ref) => { if (ref) ref.srcObject = localStream; }}
            autoPlay
            muted
          />
        )}

        {/* Remote thumbnails */}
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <video
            key={id}
            className="user-video"
            autoPlay
            ref={ref => { if (ref) ref.srcObject = stream; }}
          />
        ))}
      </div>

      <div className="webrtc-controls">
        <button className="glass-button" onClick={toggleVideo}>
          {videoOn ? 'Video Off' : 'Video On'}
        </button>
        <button className="glass-button" onClick={toggleAudio}>
          {audioOn ? 'Mute' : 'Unmute'}
        </button>
      </div>
    </div>
  );
}

export default WebRTCSection;
