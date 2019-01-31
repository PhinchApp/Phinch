const spawn = require('child_process').spawn;

function uint8arrayToString(data) {
  return String.fromCharCode.apply(null, data);
}

function formatData(data) {
  const thisData = data;

  const sequenceReads = {};
  thisData.data.forEach((d) => {
    if (sequenceReads[d[1]]) {
      sequenceReads[d[1]] += d[2];
    } else {
      sequenceReads[d[1]] = d[2];
    }
  });

  thisData.columns = thisData.columns.map((c, i) => {
    c.metadata.phinchID = i;
    const reads = (sequenceReads[i] === undefined) ? 0 : sequenceReads[i];
    Object.keys(c.metadata).forEach(k => {
      if (c.metadata[k] === '') {
        c.metadata[k] = '__empty__';
      }
    });
    return {
      biomid: i + 1,
      id: c.id,
      sampleName: c.id,
      phinchName: c.phinchName || (c.metadata.phinchName ? c.metadata.phinchName : c.id),
      metadata: c.metadata,
      reads,
    };
  });

  thisData.rows = thisData.rows.map((r, i) => {
    r.metadata.phinchID = i;
    return r;
  });

  return thisData;
}

function loadBiomFile(e) {
  // console.log(e);
  const { biomhandlerPath, filepath } = e.data;
  const python = spawn(biomhandlerPath, [filepath]);
  let json = '';
  python.stdout.on('data', (data) => {
    json += uint8arrayToString(data);
  });
  python.stdout.on('end', () => {
    try {
      const data = formatData(JSON.parse(json));
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
    // close(); /* eslint-disable-line no-restricted-globals */
  });
  python.on('error', (error) => {
    console.warn(error);
    postMessage({
      status: 'failure',
    });
    // close(); /* eslint-disable-line no-restricted-globals */
  });
}

onmessage = loadBiomFile;
