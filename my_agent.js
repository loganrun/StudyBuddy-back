// Import necessary functions and classes from @livekit/agents
// Removed type-only imports like JobProcess, JobContext
import {
    AutoSubscribe,
    WorkerOptions,
    cli,
    defineAgent,
    llm,
    pipeline,
  } from '@livekit/agents';
  // Import agent plugins
  import * as deepgram from '@livekit/agents-plugin-deepgram';
  import * as livekit from '@livekit/agents-plugin-livekit';
  import * as openai from '@livekit/agents-plugin-openai';
  import * as silero from '@livekit/agents-plugin-silero';
  // Import Node.js built-in module helpers
  import { fileURLToPath } from 'node:url';
  // Import zod for schema definition (runtime dependency)
  import { z } from 'zod';
  
  // Define the LiveKit Agent
  export default defineAgent({
    /**
     * Prewarm function: Executed once before the agent starts processing jobs.
     * Used here to load the VAD model.
     * @param {object} proc - The job process object (similar to JobProcess type).
     */
    prewarm: async (proc) => {
      // Load the Silero VAD model and store it in user data for the process
      proc.userData = proc.userData || {}; // Ensure userData exists
      proc.userData.vad = await silero.VAD.load();
      console.log('VAD model loaded during prewarm.');
    },
    /**
     * Entry function: The main logic for the agent when a job starts.
     * @param {object} ctx - The job context object (similar to JobContext type).
     */
    entry: async (ctx) => {
      // Retrieve the preloaded VAD model from user data.
      // Assumes prewarm has successfully populated this.
      // Removed the non-null assertion (!) and type assertion (as silero.VAD) from TS.
      const vad = ctx.proc.userData.vad;
      if (!vad) {
          throw new Error("VAD model not found in process user data. Prewarm might have failed.");
      }
  
      // Define the initial system prompt for the LLM
      const initialContext = new llm.ChatContext().append({
        role: llm.ChatRole.SYSTEM,
        text:
          'You are a voice assistant created by LiveKit. Your interface with users will be voice. ' +
          'You should use short and concise responses, and avoiding usage of unpronounceable ' +
          'punctuation.',
      });
  
      // Connect the agent to the room, subscribing only to audio tracks
      await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);
      console.log('Agent connected to room, waiting for participant...');
      // Wait for a participant to join the room
      const participant = await ctx.waitForParticipant();
      console.log(`Participant ${participant.identity} joined. Starting agent logic.`);
  
      // Define available functions for the LLM
      // Removed the ': llm.FunctionContext' type annotation from TS.
      const fncCtx = {
        weather: {
          description: 'Get the weather in a location',
          // Define parameters using zod schema for runtime validation
          parameters: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          /**
           * Executes the weather function.
           * @param {object} params - Parameters matching the zod schema.
           * @param {string} params.location - The location provided by the LLM.
           * @returns {Promise<string>} A promise resolving to the weather information string.
           */
          execute: async ({ location }) => {
            console.debug(`Executing weather function for location: ${location}`);
            try {
              // Fetch weather data from wttr.in
              const response = await fetch(`https://wttr.in/${location}?format=%C+%t`);
              if (!response.ok) {
                // Handle non-successful HTTP responses
                throw new Error(`Weather API request failed with status: ${response.status}`);
              }
              const weather = await response.text();
              // Format the response string for the LLM
              return `The weather in ${location} right now is ${weather}.`;
            } catch (error) {
              console.error(`Error fetching weather for ${location}:`, error);
              // Provide an error message back to the LLM/user
              return `Sorry, I couldn't retrieve the weather for ${location}. ${error.message}`;
            }
          },
        },
        // Add other functions here if needed
      };
  
      // Create the voice pipeline agent instance
      const agent = new pipeline.VoicePipelineAgent(
        vad,                        // Voice Activity Detection model
        new deepgram.STT(),         // Speech-to-Text engine (Deepgram)
        new openai.LLM(),           // Large Language Model engine (OpenAI)
        new openai.TTS(),           // Text-to-Speech engine (OpenAI)
        {                           // Pipeline options:
          chatCtx: initialContext,  // Initial chat context/system prompt
          fncCtx,                   // Function context (available tools)
          turnDetector: new livekit.turnDetector.EOUModel(), // End-of-utterance detection
        },
      );
  
      console.log('Starting the voice pipeline agent...');
      // Start the agent's processing loop for the connected participant
      agent.start(ctx.room, participant);
  
      // Send an initial greeting message
      await agent.say('Hey, how can I help you today', true); // 'true' indicates it's interruptible
      console.log('Initial greeting sent.');
    },
  });
  
  // --- Start the Agent Worker ---
  // Use the CLI helper to run the agent application
  // This reads connection details (URL, API Key/Secret) from environment variables
  // or command-line arguments.
  console.log('Starting LiveKit Agent worker...');
  cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
  