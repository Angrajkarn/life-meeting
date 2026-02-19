import * as mediasoup from 'mediasoup';
import { types } from 'mediasoup';
import { config } from '../config';

const workerSettings: types.WorkerSettings = {
  logLevel: config.mediasoup.worker.logLevel as types.WorkerLogLevel,
  logTags: config.mediasoup.worker.logTags as types.WorkerLogTag[],
  rtcMinPort: config.mediasoup.worker.rtcMinPort,
  rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
};

export async function createWorker(): Promise<types.Worker> {
  const worker = await mediasoup.createWorker(workerSettings);

  worker.on('died', () => {
    console.error(`mediasoup Worker died, exiting in 2 seconds... [pid:${worker.pid}]`);
    setTimeout(() => process.exit(1), 2000);
  });

  return worker;
}
