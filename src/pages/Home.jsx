import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  //rmid=null;

  //for existing room
  const handleJoin = () => {
    if (roomId.trim()) {
      navigate("/room/" + roomId);
      console.log("handeljoin");
    }
   // console.log("handeljoin2", {roomId});
  };
  //for generated room
  const handleJoin2 = (rmId) => {
    if(rmId){
      navigate("/room/" + rmId);
      return;
    }
    // if (roomId.trim()) {
    //   navigate("/room/" + roomId);
    //   console.log("handeljoin");
    // }
    // console.log("handeljoin2", {roomId});
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
        />
        <button className='glass-button' onClick={handleJoin}>Join</button>

        <h2>Create a Room</h2>
        <button className='glass-button' onClick={()=>{
          handleJoin2(generateRandomAlphaNumeric());
        //  setTimeout(()=>{
          
        //  },2);
          console.log("working");
        }}>Join</button>
      </div>
    </div>
  );
}

export default Home;
