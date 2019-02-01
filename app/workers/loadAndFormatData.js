const spawn = require('child_process').spawn;
const nest = require('d3-collection').nest;

function uint8arrayToString(data) {
  return String.fromCharCode.apply(null, data);
}

function filterFloat(value) {
  if (/^(-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
    return Number(value);
  }
  return null;
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

  const metadataKeys = [...new Set(thisData.columns
    .map(d => Object.keys(d.metadata))
    .reduce((a, v) => a.concat(v), []))]
    .filter(k => k !== 'phinchID')
    .sort();

  thisData.stateFilters = {};
  thisData.filters = {
    date: {},
    number: {},
    string: {},
  };

  metadataKeys.forEach(k => {
    const units = [];
    const entries = thisData.columns.map(d => {
      const [value, unit] = d.metadata[k].split(' ');
      if (unit !== undefined && !units.includes(unit)) {
        units.push(unit);
      }
      return {
        sampleName: d.sampleName,
        value: d.metadata[k],
        splitValue: value,
        unit,
      };
    });

    const values = nest()
      .key(d => d.value)
      .entries(entries)
      .map((d, i) => ({
        index: i,
        value: d.key,
        splitValue: d.values.map(v => v.splitValue)[0],
        count: d.values.length,
        samples: d.values.map(v => v.sampleName),
      }));

    const unit = units.length ? units[0] : '';
    let groupKey = 'string';
    let filterValues = values;

    if (k.toLowerCase().trim().includes('date')) {
      groupKey = 'date';
      filterValues = values.map(d => {
        if (k.toLowerCase().trim().includes('date')) {
          d.value = new Date(d.value);
        }
        return d;
      }).filter(v => !v.value.toString().toLowerCase().trim().includes('invalid date'));
    } else if (k.toLowerCase().trim().includes('year')) {
      groupKey = 'date';
      filterValues = values.map((v) => {
        v.value = filterFloat(v.splitValue);
        return v;
      }).filter(v => v.value !== null);
    } else if (filterFloat(values.filter(v => v.splitValue !== 'no_data')[0].splitValue) !== null) {
      groupKey = 'number';
      filterValues = values.map((v) => {
        v.value = filterFloat(v.splitValue);
        return v;
      }).filter(v => v.value !== null);
    }

    filterValues = filterValues
      .sort((a, b) => a.value.valueOf() - b.value.valueOf())
      .map((d, i) => {
        d.index = i;
        return d;
      });

    let range = {
      min: filterValues[0],
      max: filterValues[filterValues.length - 1],
    };
    if (groupKey === 'string') {
      range = {};
      filterValues.forEach(v => {
        range[v.value] = true;
      });
    }

    thisData.stateFilters[k] = {
      key: k,
      unit,
      range,
      type: groupKey,
      values: filterValues,
      expanded: false,
    };

    thisData.filters[groupKey][k] = {
      values: filterValues,
      unit,
      log: true,
    };
  });

  return thisData;
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
  });
  python.on('error', (error) => {
    console.warn(error);
    postMessage({
      status: 'failure',
    });
  });
}

onmessage = loadBiomFile;
