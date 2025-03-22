import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';
import {
  AudioLines,
  CircleAlert,
  Mic,
  MicOff,
  Play,
  Square,
  Volume2,
  VolumeOff,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from './components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  playRecording,
  startRecording,
  stopRecording,
} from './states/actions/microphone';
import {
  MicPermissionState,
  WebSocketState,
  audioBufferAtom,
  mediaDevicesAtom,
  micPermissionStateAtom,
  selectedMediaDeviceIdAtom,
  webSocketStateAtom,
} from './states/atoms';

function InputBlocks() {
  const micPermissionState = useAtomValue(micPermissionStateAtom);
  const devices = useAtomValue(mediaDevicesAtom);
  const webSocketState = useAtomValue(webSocketStateAtom);
  const audioBuffer = useAtomValue(audioBufferAtom);

  const [selectedMediaDeviceId, setSelectedMediaDeviceId] = useAtom(
    selectedMediaDeviceIdAtom,
  );

  const [micOn, setMicOn] = useState(true);
  const [mute, setMute] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="h-50 border-t border-t-gray-200">
      {(() => {
        switch (micPermissionState) {
          case MicPermissionState.UNKNOWN:
            return null;
          case MicPermissionState.ALLOW:
            return (
              <div className="flex h-full flex-col items-center">
                <div className="flex grow items-center gap-6">
                  <Button
                    className="size-20"
                    disabled={webSocketState !== WebSocketState.CONNECTED}
                    variant={recording ? 'ghost' : 'default'}
                    onClick={() => {
                      if (recording) {
                        stopRecording();
                      } else {
                        startRecording();
                      }

                      setRecording((prev) => !prev);
                    }}
                  >
                    <AudioLines
                      className={clsx('size-10', {
                        'stroke-red-500': recording,
                      })}
                    />
                  </Button>
                  <Button
                    className="size-20"
                    disabled={audioBuffer == null}
                    variant="outline"
                    onClick={() => {
                      if (!playing) {
                        setPlaying(true);
                        playRecording(() => {
                          setPlaying(false);
                        });
                      }
                    }}
                  >
                    {playing ? (
                      <Square className={clsx('size-10')} />
                    ) : (
                      <Play className={clsx('size-10')} />
                    )}
                  </Button>
                </div>
                <div className="flex flex-row gap-1 p-3">
                  <Select
                    value={selectedMediaDeviceId}
                    onValueChange={setSelectedMediaDeviceId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => {
                        return (
                          <SelectItem
                            value={device.deviceId}
                            key={device.deviceId}
                          >
                            {device.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMicOn((prev) => !prev);
                    }}
                  >
                    {micOn ? <Mic /> : <MicOff />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMute((prev) => !prev);
                    }}
                  >
                    {mute ? <VolumeOff /> : <Volume2 />}
                  </Button>
                </div>
              </div>
            );
          case MicPermissionState.DENY:
            return (
              <div className="flex h-full flex-row items-center justify-center gap-2">
                <CircleAlert className="size-9 stroke-red-500" />
                <h1 className="text-2xl">No audio permission</h1>
              </div>
            );
          case MicPermissionState.NO_AUDIO:
            return (
              <div className="flex h-full items-center justify-center">
                <h1 className="text-2xl">No audio devices available</h1>
              </div>
            );
        }
      })()}
    </div>
  );
}

export default InputBlocks;
