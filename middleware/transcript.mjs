import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import tmp from 'tmp';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
      apiKey: process.env.OPEN_API_KEY
});

ffmpeg.setFfmpegPath(ffmpegStatic);


async function audioConvert(file) {
  return new Promise((resolve, reject) => {
    tmp.file({ postfix: '.flac' }, async (err, tmpFilePath, fd, cleanupCallback) => {
      if (err) {
        reject(err);
        return;
      }

      const outputDirPath = path.dirname(tmpFilePath);

      ffmpeg()
        .input(`${file}`)
        .audioFrequency(16000) 
        .audioChannels(1) 
        .audioCodec("flac") 
        .outputOptions("-compression_level 8") 
        .output(tmpFilePath)
        .on("end", async () => {
          console.log("Conversion finished");
          resolve({ tmpFilePath, cleanupCallback });
        })
        .on("error", (err) => {
          console.error("Error:", err);
          reject(err);
        })
        .run();
    });
  });
}
async function getTranscript(filename) {
  // const data = fs.readFileSync(filename);
  // const response = await fetch(
  //   "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
  //   {
  //     headers: { Authorization: `Bearer ${process.env.Hugging_Face}` },
  //     method: "POST",
  //     body: data,
  //   }
  // );
  // const result = await response.json();
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filename),
    model: "whisper-1",
  });

  //console.log(transcription.text);

  return transcription;
}

export default async function transcript(url) {
  try {
    const { tmpFilePath, cleanupCallback } = await audioConvert(url);
    console.log(tmpFilePath);
    const postConvert = await getTranscript(tmpFilePath);
    cleanupCallback(); // Delete the temporary fil
    return postConvert;
  } catch (error) {
    console.error(error.message);
  }
}

// "https://api-inference.huggingface.co/models/facebook/wav2vec2-large-960h-lv60-self"