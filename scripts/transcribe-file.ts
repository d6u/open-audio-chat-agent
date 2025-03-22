import fs from 'node:fs';
import path from 'node:path';

import OpenAI from 'openai';

const audioPath = process.argv[2];
if (!audioPath) {
  console.error('Please provide an audio file path as argument');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream(path.resolve(audioPath)),
  // model: 'whisper-1',
  model: 'gpt-4o-mini-transcribe',
  response_format: 'json',
});

console.log(transcription);
