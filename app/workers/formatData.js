function formatData(e) {
  const thisData = e.data;

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

  postMessage(thisData);
}

onmessage = formatData;
