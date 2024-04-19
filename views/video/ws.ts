import WebSocket from 'ws';
import { createWorker } from './worker';

let mediasoupRouter;
const WebsocketConnection = async (websock: WebSocket.Server) => {
  try {
    mediasoupRouter = await createWorker();
  } catch (error) {
    throw error;
  }
  // 메시지 보낼 때 서버가 클라이언트에게 보내는 메시지
  websock.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
      const jsonValidatation = IsJsonString(message);
      if (!jsonValidatation) {
        console.error('json error');
        return;
      }
      const event = JSON.parse(message);
    });
  });
  const IsJsonString = (str: string) => {
    try {
      JSON.parse(str);
    } catch (error) {
      return false;
    }
    return true;
  };
};
export { WebsocketConnection };
