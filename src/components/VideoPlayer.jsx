import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube'; // <-- Important import to enable YouTube support

function VideoPlayer({ socket, roomId }) {
  // References
  const videoNodeRef = useRef(null); // <video> element
  const playerRef = useRef(null);    // Video.js player instance
  const fileInputRef = useRef(null); // For selecting local files

  // Prevent local <-> remote event loops
  const isRemoteActionRef = useRef(false);

  // Store your current video source and link input
  const [videoSrc, setVideoSrc] = useState(null); // { src: ..., type: ... }
  const [videoLink, setVideoLink] = useState('');

  // Small threshold (in seconds) to ignore minor differences in currentTime
  const SYNC_THRESHOLD = 3;

  // ------------------------------------------------------------------
  // A) Create / Dispose the Video.js player exactly once
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!playerRef.current) {
      // Create the Video.js player
      playerRef.current = videojs(videoNodeRef.current, {
        controls: true, // show native controls
        autoplay: false,
        fluid: true,    // responsive sizing
      });

      // Attach local event listeners for sync
      attachLocalEventListeners(playerRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // ------------------------------------------------------------------
  // B) Whenever "videoSrc" changes, update the player's source
  // ------------------------------------------------------------------
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !videoSrc) return;
    player.src(videoSrc);
  }, [videoSrc]);

  // ------------------------------------------------------------------
  // C) Local event listeners => emit
  // ------------------------------------------------------------------
  function attachLocalEventListeners(player) {
    player.on('play', () => {
      console.log('[LOCAL] play event');
      if (isRemoteActionRef.current) {
        isRemoteActionRef.current = false;
        return;
      }
      emitVideoEvent('play', player.currentTime());
    });

    player.on('pause', () => {
      console.log('[LOCAL] pause event');
      if (isRemoteActionRef.current) {
        isRemoteActionRef.current = false;
        return;
      }
      emitVideoEvent('pause', player.currentTime());
    });

    player.on('seeked', () => {
      console.log('[LOCAL] seeked event');
      if (isRemoteActionRef.current) {
        isRemoteActionRef.current = false;
        return;
      }
      const newTime = player.currentTime();
      emitVideoEvent('seek', newTime);
    });
  }

  // ------------------------------------------------------------------
  // D) Socket: Listen for REMOTE play / pause / seek
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleRemotePlay = ({ currentTime }) => {
      console.log('[REMOTE] play ->', currentTime);
      const player = playerRef.current;
      if (!player) return;

      // Compare local vs remote times
      const diff = Math.abs(player.currentTime() - currentTime);
      console.log('[REMOTE] time diff:', diff);

      // If difference is big, we adjust
      if (diff > SYNC_THRESHOLD) {
        isRemoteActionRef.current = true;
        player.currentTime(currentTime);
      }

      // If currently paused, ensure we actually play
      if (player.paused()) {
        isRemoteActionRef.current = true;
        player.play().catch(err => {
          console.error('[REMOTE] play() error:', err);
          isRemoteActionRef.current = false;
        });
      }
    };

    const handleRemotePause = ({ currentTime }) => {
      console.log('[REMOTE] pause ->', currentTime);
      const player = playerRef.current;
      if (!player) return;

      const diff = Math.abs(player.currentTime() - currentTime);
      if (diff > SYNC_THRESHOLD) {
        isRemoteActionRef.current = true;
        player.currentTime(currentTime);
      }

      // If it’s playing, we pause
      if (!player.paused()) {
        isRemoteActionRef.current = true;
        player.pause();
      }
    };

    const handleRemoteSeek = ({ currentTime }) => {
      console.log('[REMOTE] seek ->', currentTime);
      const player = playerRef.current;
      if (!player) return;

      const diff = Math.abs(player.currentTime() - currentTime);
      if (diff > SYNC_THRESHOLD) {
        isRemoteActionRef.current = true;
        player.currentTime(currentTime);
      }
    };

    // Attach these socket handlers
    socket.on('video:play', handleRemotePlay);
    socket.on('video:pause', handleRemotePause);
    socket.on('video:seek', handleRemoteSeek);

    return () => {
      socket.off('video:play', handleRemotePlay);
      socket.off('video:pause', handleRemotePause);
      socket.off('video:seek', handleRemoteSeek);
    };
  }, [socket]);

  // ------------------------------------------------------------------
  // E) Emit local events to server
  // ------------------------------------------------------------------
  function emitVideoEvent(type, currentTime) {
    if (!socket) return;
    console.log(`[LOCAL] Emitting ${type} -> ${currentTime}`);
    socket.emit(`video:${type}`, { roomId, currentTime });
  }

  // ------------------------------------------------------------------
  // F) Optional manual controls: skip/restart
  // ------------------------------------------------------------------
  const handlePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    isRemoteActionRef.current = false;
    player.play();
    emitVideoEvent('play', player.currentTime());
  };

  const handlePause = () => {
    const player = playerRef.current;
    if (!player) return;
    isRemoteActionRef.current = false;
    player.pause();
    emitVideoEvent('pause', player.currentTime());
  };

  const handleSkip = (secs) => {
    const player = playerRef.current;
    if (!player) return;
    isRemoteActionRef.current = false;
    const newTime = player.currentTime() + secs;
    player.currentTime(newTime);
    emitVideoEvent('seek', newTime);
  };

  const handleRestart = () => {
    const player = playerRef.current;
    if (!player) return;
    console.log('[LOCAL] Restarting video');
    isRemoteActionRef.current = false;
    player.currentTime(0);
    emitVideoEvent('seek', 0);
  };

  // ------------------------------------------------------------------
  // G) Local File selection
  // ------------------------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[LOCAL] File Selected:', file.name);
    const url = URL.createObjectURL(file);
    setVideoSrc({ src: url, type: 'video/mp4' }); // typical local MP4
  };

  // ------------------------------------------------------------------
  // H) Link selection (YouTube or direct MP4 link)
  // ------------------------------------------------------------------
  const handleVideoLink = () => {
    // Basic detection
    const linkLower = videoLink.toLowerCase();
    if (linkLower.includes('youtube.com') || linkLower.includes('youtu.be')) {
      // Use the videojs-youtube plugin
      setVideoSrc({ src: videoLink, type: 'video/youtube' });
    } else {
      // Assume it's direct (MP4, etc.)
      setVideoSrc({ src: videoLink, type: 'video/mp4' });
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="video-player">
      {/* The container for Video.js */}
      <div className="video-container" data-vjs-player>
        <video
          ref={videoNodeRef}
          className="video-js vjs-big-play-centered"
        />
      </div>

      <div style={{ marginTop: '15px' }}>
        {/* Local File Selection */}
        <button
          className="glass-button"
          onClick={() => fileInputRef.current?.click()}
          style={{ marginBottom: '10px', padding: '6px 12px', fontSize: '0.8rem' }}
        >
          Select Local File
        </button>
        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <br />

        {/* Video Link Input */}
        <input
          type="text"
          placeholder="Paste YouTube or direct video link"
          value={videoLink}
          onChange={(e) => setVideoLink(e.target.value)}
          style={{ width: '60%', marginRight: '10px', marginTop: '10px' }}
        />
        <button
          className="glass-button"
          onClick={handleVideoLink}
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          Load Link
        </button>
      </div>

      {/* Additional manual controls */}
      <div style={{ marginTop: '15px' }}>
        <button className="glass-button" onClick={() => handleSkip(-10)}>
          Backward 10s
        </button>
        <button className="glass-button" onClick={handlePlay} style={{ marginLeft: '10px' }}>
          Play
        </button>
        <button className="glass-button" onClick={handlePause} style={{ marginLeft: '10px' }}>
          Pause
        </button>
        <button className="glass-button" onClick={() => handleSkip(10)} style={{ marginLeft: '10px' }}>
          Forward 10s
        </button>
        <button className="glass-button" onClick={handleRestart} style={{ marginLeft: '10px' }}>
          Restart
        </button>
      </div>
    </div>
  );
}

export default VideoPlayer;