import { remote } from 'electron';
import { join, resolve } from 'path';

const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();
const biomhandlerPath = join(appPath, '/..', '/biomhandler', '/dist', '/biomhandler');

function loadFile(filepath, success, failure) {
  const worker = new Worker(resolve(appPath, 'worker.js'));
  worker.postMessage({
    biomhandlerPath,
    filepath,
  });
  worker.onmessage = (e) => {
    if (e.data.status === 'success') {
      success(e.data.data);
    } else {
      failure();
    }
  };
}

export default loadFile;
