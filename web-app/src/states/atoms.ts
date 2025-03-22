import { atom } from 'jotai';

export const MicPermissionState = {
  UNKNOWN: 'UNKNOWN',
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  NO_AUDIO: 'NO_AUDIO',
} as const;

export type MicPermissionStateEnum =
  (typeof MicPermissionState)[keyof typeof MicPermissionState];

export const micPermissionStateAtom = atom<MicPermissionStateEnum>(
  MicPermissionState.UNKNOWN,
);

export const mediaStreamAtom = atom<MediaStream | null>(null);
export const audioContextAtom = atom<AudioContext | null>(null);
export const mediaDevicesAtom = atom<MediaDeviceInfo[]>([]);
export const selectedMediaDeviceIdAtom = atom<string>('');
export const audioBufferAtom = atom<AudioBuffer | null>(null);

export const WebSocketState = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
} as const;

export type WebSocketStateEnum =
  (typeof WebSocketState)[keyof typeof WebSocketState];

export const webSocketStateAtom = atom<WebSocketStateEnum>(
  WebSocketState.CONNECTING,
);

export const websocketClientAtom = atom<WebSocket | null>(null);

export const transcribedTextAtom = atom<string>('');
