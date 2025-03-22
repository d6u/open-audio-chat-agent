import fs from 'node:fs/promises';
import path from 'node:path';

import OpenAI from 'openai';
import type {
  InputAudioBufferAppendEvent,
  RealtimeServerEvent,
} from 'openai/resources/beta/realtime/realtime.mjs';
import WebSocket from 'ws';

const audioPath = process.argv[2];
if (!audioPath) {
  console.error('Please provide an audio file path as argument');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const data = await fs.readFile(path.resolve(audioPath));

console.log(data.length);
console.log(data.byteLength);
console.log(data.byteOffset);

const int16Array = new Int16Array(
  data.buffer,
  data.byteOffset,
  data.length / 2,
);

console.log(int16Array.length);

for (const e in int16Array) {
  console.log(e);
}

const response = await openai.beta.realtime.transcriptionSessions.create({
  input_audio_format: 'pcm16',
  input_audio_transcription: {
    model: 'gpt-4o-mini-transcribe',
  },
  turn_detection: {
    type: 'server_vad',
  },
});

console.log(response);

const ws = new WebSocket(
  'wss://api.openai.com/v1/realtime?intent=transcription',
  {
    headers: {
      'Authorization': `Bearer ${response.client_secret.value}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  },
);

ws.on('open', async () => {
  console.log('Connected to openai ws.');

  let offset = 0;

  while (offset < int16Array.length) {
    console.log('Sending audio samples.');

    const s1 = int16Array.slice(offset, offset + 1 * 24000);
    offset += 1 * 24000;

    const payload: InputAudioBufferAppendEvent = {
      type: 'input_audio_buffer.append',
      audio: Buffer.from(s1.buffer).toString('base64'),
    };
    ws.send(JSON.stringify(payload));

    // Simulate realtime speech
    await new Promise((r) => setTimeout(r, 1000));
  }
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString()) as RealtimeServerEvent;
  console.log('message', message.type);

  switch (message.type) {
    case 'conversation.item.input_audio_transcription.delta': {
      console.log('>>', message.delta);
      break;
    }
    case 'conversation.item.input_audio_transcription.completed': {
      console.log('>>>>', message.transcript);
      break;
    }
    case 'error': {
      console.log('error', message);
      break;
    }
  }
});
