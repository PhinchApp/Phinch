import { remote } from 'electron';
import { spawn } from 'child_process';
import { join } from 'path';

const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();

function uint8arrayToString(data){
  return String.fromCharCode.apply(null, data);
}

function loadFile(filepath, success, failure) {
  const python = spawn(join(appPath, '/..', '/biomhandler', '/dist', '/biomhandler'), [filepath]);
  let json = '';
  python.stdout.on('data', (data) => {
    json += uint8arrayToString(data);
  });
  python.stdout.on('end', () => {
    try {
      const data = JSON.parse(json);
      success(data);
    } catch (e) {
      console.warn(e);
      failure();
    }
  });
  python.on('error', (error) => {
    console.warn(error);
    failure();
  });
}

export default loadFile;