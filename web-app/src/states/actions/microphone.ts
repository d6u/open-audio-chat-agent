import {
  MicPermissionState,
  WebSocketState,
  audioBufferAtom,
  audioContextAtom,
  mediaDevicesAtom,
  mediaStreamAtom,
  micPermissionStateAtom,
  selectedMediaDeviceIdAtom,
  webSocketStateAtom,
  websocketClientAtom,
} from '../atoms';
import { store } from '../store';
import getPcmProcessorUrl from './get-pcm-processor?url';

const WS_SEND = true;

let audioSamples2DArray: Float32Array[] = [];

export async function initMicPermissionAndDevices() {
  stopRecording();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    store.set(micPermissionStateAtom, MicPermissionState.ALLOW);

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputDevices = devices.filter(
      (device) => device.kind === 'audioinput',
    );
    const defaultDevice = audioInputDevices.find(
      (device) => device.deviceId === 'default',
    );

    store.set(mediaDevicesAtom, audioInputDevices);
    if (defaultDevice) {
      store.set(selectedMediaDeviceIdAtom, defaultDevice.deviceId);
    } else {
      store.set(selectedMediaDeviceIdAtom, audioInputDevices[0].deviceId);
    }

    // Stop the stream because we don't need to keep it open
    stream.getTracks().forEach((track) => track.stop());
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        store.set(micPermissionStateAtom, MicPermissionState.DENY);
      } else if (error.name === 'NotFoundError') {
        store.set(micPermissionStateAtom, MicPermissionState.NO_AUDIO);
      }
    } else {
      console.error('Handled error', error);
    }
  }
}

export async function startRecording() {
  let ws: WebSocket;
  if (WS_SEND) {
    ws = store.get(websocketClientAtom)!;
    ws.send('START');
  }

  const deviceId = store.get(selectedMediaDeviceIdAtom);
  const constraints: MediaStreamConstraints = {
    audio: {
      deviceId: { exact: deviceId },
      // sampleRate: 24000,
      // autoGainControl: true,
      // channelCount: 1,
      // noiseSuppression: true,
    },
    video: false,
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  store.set(mediaStreamAtom, stream);

  const audioContext = new AudioContext({
    sampleRate: 24000,
  });
  store.set(audioContextAtom, audioContext);
  const sourceNode = audioContext.createMediaStreamSource(stream);

  await audioContext.audioWorklet.addModule(getPcmProcessorUrl);
  const workletNode = new AudioWorkletNode(audioContext, 'get-pcm-processor');

  audioSamples2DArray = [];

  workletNode.port.onmessage = (event) => {
    const data = event.data as Float32Array;
    audioSamples2DArray.push(data);
    // console.log(data[0]);
    if (WS_SEND) {
      ws.send(new Int16Array(data.map((f) => f * 32768)));
    }
  };

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(1, audioContext.currentTime + 1);

  sourceNode
    .connect(gainNode)
    .connect(workletNode)
    .connect(audioContext.destination);
}

export async function stopRecording() {
  if (WS_SEND && store.get(webSocketStateAtom) === WebSocketState.CONNECTED) {
    const ws = store.get(websocketClientAtom)!;
    ws.send('STOP');
  }

  if (audioSamples2DArray.length) {
    const totalSamples = audioSamples2DArray.reduce(
      (sum, samples) => sum + samples.length,
      0,
    );

    const finalSamples = new Float32Array(totalSamples);
    let offset = 0;
    for (const samples of audioSamples2DArray) {
      for (let i = 0; i < samples.length; i++) {
        finalSamples[offset + i] = samples[i];
      }
      offset += samples.length;
    }

    console.log(totalSamples / 24000);

    const audioBuffer = new AudioBuffer({
      numberOfChannels: 1,
      sampleRate: 24000,
      length: finalSamples.length,
    });

    audioBuffer.getChannelData(0).set(finalSamples);

    store.set(audioBufferAtom, audioBuffer);
  }

  store
    .get(mediaStreamAtom)
    ?.getAudioTracks()
    .forEach((track) => {
      track.stop();
    });
  store.get(audioContextAtom)?.close();

  store.set(mediaStreamAtom, null);
  store.set(audioContextAtom, null);
}

export function playRecording(onEnded: () => void) {
  const audioBuffer = store.get(audioBufferAtom);

  if (!audioBuffer) {
    return;
  }

  console.log('play');

  const audioContext = new AudioContext({
    sampleRate: 24000,
  });

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  source.addEventListener('ended', onEnded);

  source.connect(audioContext.destination);
  source.loop = false;
  source.start();
}
