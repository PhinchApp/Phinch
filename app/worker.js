const spawn = require('child_process').spawn;

function uint8arrayToString(data) {
  return String.fromCharCode.apply(null, data);
}

function loadBiomFile(e) {
  const { biomhandlerPath, filepath } = e.data;
  const python = spawn(biomhandlerPath, [filepath]);
  let json = '';
  python.stdout.on('data', (data) => {
    json += uint8arrayToString(data);
  });
  python.stdout.on('end', () => {
    try {
      const data = JSON.parse(json);
      postMessage({
        status: 'success',
        data,
      });
    } catch (error) {
      console.warn(error);
      postMessage({
        status: 'failure',
      });
    }
    close(); /* eslint-disable-line no-restricted-globals */
  });
  python.on('error', (error) => {
    console.warn(error);
    postMessage({
      status: 'failure',
    });
    close(); /* eslint-disable-line no-restricted-globals */
  });
}

onmessage = loadBiomFile;
