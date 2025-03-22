import {
  WebSocketState,
  transcribedTextAtom,
  webSocketStateAtom,
  websocketClientAtom,
} from '../atoms';
import { store } from '../store';

export async function connectSocket() {
  const socket = new WebSocket(
    `${import.meta.env.VITE_API_SERVER_BASE_URL}/realtime`,
  );

  store.set(websocketClientAtom, socket);

  const onOpen = () => {
    console.log('Socket open');
    store.set(webSocketStateAtom, WebSocketState.CONNECTED);
  };

  socket.addEventListener('open', onOpen);

  socket.addEventListener('message', (event) => {
    store.set(transcribedTextAtom, (prev) => {
      return prev + event.data;
    });
  });
}
