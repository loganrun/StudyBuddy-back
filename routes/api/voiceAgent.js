import { AccessToken} from "livekit-server-sdk";
import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
//import OpenAI from 'openai';
//import Groq from 'groq-sdk'
//import jwt from 'jsonwebtoken';
dotenv.config();

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const participantName = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

// function createParticipantToken(){
  
//     const at = new AccessToken(API_KEY, API_SECRET, {
      
//       ttl: 3600,
//     });
//     // const grant= new VideoGrant({
//     //   room: roomName,
//     //   roomJoin: true,
//     //   canPublish: true,
//     //   canPublishData: true,
//     //   canSubscribe: true,
//     // });
//     at.addGrant({roomJoin: true, room: roomName});
//     return at.toJwt();
//   }

const createToken = async () => {
  // If this room doesn't exist, it'll be automatically created when the first
  // participant joins
  //const roomName = 'quickstart-room';
  // Identifier to be used for participant.
  // It's available as LocalParticipant.identity with livekit-client SDK
  //const participantName = 'quickstart-username';

  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: participantName,
    // Token to expire after 10 minutes
    ttl: 3600,
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
};


router.get('/', async (req, res) => {
    // const roomName = req.query.roomName;
    // const participantIdentity = req.query.participantIdentity;
    console.log("reached")
    // console.log(participantIdentity)
    // console.log(roomName)

    
  try {
    
    const participantToken = await createToken(
        
        roomName
      );
      const data = {
        serverUrl: LIVEKIT_URL,
        roomName,
        participantToken: participantToken,
        //participantName: participantIdentity,
      };
    // const options = new AccessTokenOptions({
    //   identity: participantIdentity,
    //   ttl: 3600, // Token expiration time in seconds
    // });
    // const videoGrant = new VideoGrant({
    //   room: roomName,
    //   //allowedActions: ['publish', 'subscribe'],
    // });
    res.json(data)
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

export default router;

