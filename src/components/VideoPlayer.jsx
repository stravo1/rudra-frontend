import React, { useRef, useEffect, useState } from 'react';

function VideoPlayer({ socket, roomId }) {
  const videoRef = useRef(null);
  const lastSeekEmittedRef = useRef(0);
  const [videoSrc, setVideoSrc] = useState(null);


  useEffect(() => {
    if (!socket) return;

    // Another client started playing the video
    const handleRemotePlay = ({ currentTime }) => {
      console.log('[DEBUG - VideoPlayer] Received video:play, time=', currentTime);
      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.currentTime = currentTime;
        if (videoEl.paused) {
          videoEl.play().catch(err => console.error('[DEBUG] play() error:', err));
        }
      }
    };

    // Another client paused the video
    const handleRemotePause = ({ currentTime }) => {
      console.log('[DEBUG - VideoPlayer] Received video:pause, time=', currentTime);
      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.currentTime = currentTime;
        if (!videoEl.paused) {
          videoEl.pause();
        }
      }
    };

    // Another client sought the video
    const handleRemoteSeek = ({ currentTime }) => {
      console.log('[DEBUG - VideoPlayer] Received video:seek, time=', currentTime);
      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.currentTime = currentTime;
        lastSeekEmittedRef.current = currentTime;
      }
    };

    socket.on('video:play', handleRemotePlay);
    socket.on('video:pause', handleRemotePause);
    socket.on('video:seek', handleRemoteSeek);

    return () => {
      socket.off('video:play', handleRemotePlay);
      socket.off('video:pause', handleRemotePause);
      socket.off('video:seek', handleRemoteSeek);
    };
  }, [socket]);

  // Local triggers

  const handlePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl || !socket) return;

    console.log('[DEBUG - VideoPlayer] Emitting video:play');
    socket.emit('video:play', { roomId, currentTime: videoEl.currentTime });
    videoEl.play().catch(err => console.error('[DEBUG] local play() error:', err));
  };

  const handlePause = () => {
    const videoEl = videoRef.current;
    if (!videoEl || !socket) return;

    console.log('[DEBUG - VideoPlayer] Emitting video:pause');
    socket.emit('video:pause', { roomId, currentTime: videoEl.currentTime });
    videoEl.pause();
  };

  const handleSkip = (seconds) => {
    const videoEl = videoRef.current;
    if (!videoEl || !socket) return;

    videoEl.currentTime += seconds;
    console.log('[DEBUG - VideoPlayer] Emitting video:seek (skip)', videoEl.currentTime);
    socket.emit('video:seek', { roomId, currentTime: videoEl.currentTime });
    lastSeekEmittedRef.current = videoEl.currentTime;
  };

  const handleSeeked = () => {
    const videoEl = videoRef.current;
    if (!videoEl || !socket) return;

    const newTime = videoEl.currentTime;
    const diff = Math.abs(newTime - lastSeekEmittedRef.current);
    if (diff > 0.2) {
      console.log('[DEBUG - VideoPlayer] Emitting video:seek (onSeeked)', newTime);
      socket.emit('video:seek', { roomId, currentTime: newTime });
      lastSeekEmittedRef.current = newTime;
    } else {
      console.log('[DEBUG - VideoPlayer] onSeeked called, diff < 0.2s, skipping emit');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const url = URL.createObjectURL(file); // Create a temporary URL
      setVideoSrc(url);
    }
  };
  return (
    <div className="video-player">
      <h3>Synchronized Video Player</h3>
      <p>Play a local video from /public folder</p>
      {videoSrc && (
      <video
        ref={videoRef}
        width="400"
        controls
        onSeeked={handleSeeked}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* Use the same filename that you placed in public/. */}
        Your browser does not support HTML5 video.

      </video>)}
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="mb-4 p-2 border border-gray-300 rounded"
      />
      <div style={{ marginTop: '10px' }}>
        <button className='glass-button' onClick={handlePlay}>Play</button>
        <button className='glass-button' onClick={handlePause} style={{ marginLeft: '10px' }}>Pause</button>
        <button className='glass-button' onClick={() => handleSkip(10)} style={{ marginLeft: '10px' }}>Forward 10s</button>
        <button className='glass-button' onClick={() => handleSkip(-10)} style={{ marginLeft: '10px' }}>Backward 10s</button>
      </div>
    </div>
  );
}


const VideoUploader = () => {
 

  return (
    <div className="flex flex-col items-center p-4">
      

      {videoSrc && (
        <video
          controls
          src={videoSrc}
          className="w-3/4 border border-gray-500 rounded-lg"
        />
      )}
    </div>
  );
};



export default VideoPlayer;



