import './utils/checkEnvVar.ts';

import fs from 'node:fs';
import path from 'node:path';

import OpenAI from 'openai';
import type {
  InputAudioBufferAppendEvent,
  RealtimeServerEvent,
} from 'openai/resources/beta/realtime/realtime.mjs';
import { pino } from 'pino';
import WebSocket, { WebSocketServer } from 'ws';

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:HH:MM:ss.l',
      singleLine: true,
    },
  },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const webSocketServer = new WebSocketServer({ port: Number(process.env.PORT) });

webSocketServer.on('connection', (socket) => {
  logger.info('Socket open');

  let ws: WebSocket | null = null;
  let wsConnected = false;
  let buf = Buffer.from('');
  let fsStream: fs.WriteStream | null = null;

  socket.on('message', async (data: Buffer) => {
    // const dataBase64 = data.toString('base64');
    // process.stdout.write('M');

    switch (data.toString()) {
      case 'START': {
        logger.debug('Client message: START');

        // Create a file for debugging.
        // We can use scripts/play-pcm.py to play the audio
        fsStream = fs.createWriteStream(
          path.resolve(import.meta.dirname, '..', 'sample.raw'),
        );

        const response =
          await openai.beta.realtime.transcriptionSessions.create({
            input_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'gpt-4o-transcribe',
              prompt:
                'Audio is probably in Chinese Simplified and English. Use formal expression if possible.',
            },
            turn_detection: {
              type: 'server_vad',
            },
          });

        logger.debug(response, 'OpenAI transcriptionSessions.create response');

        ws = new WebSocket(
          'wss://api.openai.com/v1/realtime?intent=transcription',
          {
            headers: {
              'Authorization': `Bearer ${response.client_secret.value}`,
              'OpenAI-Beta': 'realtime=v1',
            },
          },
        );

        ws.on('open', async () => {
          logger.debug('Connected to OpenAI WebSocket realtime');
          wsConnected = true;
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString()) as RealtimeServerEvent;
          logger.debug('OpenAI server event ' + message.type);

          switch (message.type) {
            case 'conversation.item.input_audio_transcription.delta': {
              logger.debug(message.delta);
              if (message.delta) {
                socket.send(message.delta);
              }
              break;
            }
            case 'conversation.item.input_audio_transcription.completed': {
              logger.debug(message.transcript);
              break;
            }
            case 'error': {
              logger.error(message, 'error');
              break;
            }
          }
        });
        break;
      }
      case 'STOP': {
        logger.debug('Client message: STOP');

        fsStream?.end();

        wsConnected = false;
        ws?.close();
        ws = null;
        break;
      }
      default: {
        if (!wsConnected) {
          return;
        }

        fsStream?.write(data);

        if (buf.byteLength < 2 * 24000) {
          buf = Buffer.concat([buf, data]);
        } else {
          logger.debug('Sending buffer for transcribing');

          const payload: InputAudioBufferAppendEvent = {
            type: 'input_audio_buffer.append',
            audio: buf.toString('base64'),
          };

          ws!.send(JSON.stringify(payload));

          buf = Buffer.from('');
        }

        break;
      }
    }
  });
});

webSocketServer.on('error', (err) => {
  logger.error({ err }, 'Socket error');
});

webSocketServer.on('close', () => {
  logger.info('Socket closed');
});

webSocketServer.on('listening', () => {
  logger.info(`WebSocket server starts listening at ${process.env.PORT}`);
});
