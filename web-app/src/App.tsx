import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import InputBlocks from './InputBlocks';
import { initMicPermissionAndDevices } from './states/actions/microphone';
import { connectSocket } from './states/actions/websocket';
import { transcribedTextAtom } from './states/atoms';

function App() {
  useEffect(() => {
    connectSocket();
    initMicPermissionAndDevices();
  }, []);

  const transcribedText = useAtomValue(transcribedTextAtom);

  return (
    <>
      <div className="flex h-[100vh] flex-col">
        <div className="m-3 w-[800px] grow self-center rounded-xl bg-blue-50 p-3 text-base">
          {transcribedText}
        </div>
        <InputBlocks />
      </div>
    </>
  );
}

export default App;
