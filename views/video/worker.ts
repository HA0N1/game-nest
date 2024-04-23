import * as mediasoup from 'mediasoup';
import { Worker, Router } from 'mediasoup/node/lib/types';

import { config } from './config';

const workers: Array<{
  worker: Worker;
  router: Router;
}> = [];

let nextMediasoupWorkerIdx = 0;

const createWorker = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
  });

  worker.on('died', () => {
    console.error('워커 쥬금 [pid:&d]', worker.pid);
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });

  const router = await worker.createRouter(config.mediasoup.router);
  // Store the worker and router for later use
  workers.push({ worker, router });
};

export { createWorker };