import React from 'react';
import { remote } from 'electron';
import { resolve } from 'path';

import gstyle from 'components/general.css';

const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();
const worker = new Worker(resolve(appPath, 'workers', 'loadAndFormatData.js'));

export function updateFilters(filters, attribute, min, max, callback) {
  // const filters = context.state.filters;
  let minValue = Object.assign({}, filters[attribute].values[min]);
  if (min >= filters[attribute].values.length) {
    minValue = Object.assign({}, filters[attribute].values[filters[attribute].values.length - 1]);
    if (minValue.value instanceof Date) {
      minValue.value = new Date(minValue.value.valueOf() + 1);
    } else {
      minValue.value += 1;
    }
  }
  let maxValue = Object.assign({}, filters[attribute].values[max]);
  if (max < 0) {
    maxValue = Object.assign({}, filters[attribute].values[0]);
    if (maxValue.value instanceof Date) {
      maxValue.value = new Date(maxValue.value.valueOf() - 1);
    } else {
      maxValue.value -= 1;
    }
  }
  filters[attribute].range = {
    min: minValue,
    max: maxValue,
  };
  callback(filters);
}

export function removeRows(context, rows) {
  const data = context.state.data.filter(d => !rows.includes(d));
  // const deleted = context.state.deleted.concat(rows);
  const deleted = visSortBy(context, context.state.deleted.concat(rows), false);
  context.setState({ data, deleted }, () => {
    context.save(context.setResult);
  });
}

export function restoreRows(context, rows) {
  const deleted = context.state.deleted.filter(d => !rows.includes(d));
  const data = visSortBy(context, context.state.data.concat(rows), false);
  context.setState({ data, deleted }, () => {
    context.save(context.setResult);
  });
}

export function visSortBy(context, indata, setState) {
  // if (setState) {
  //   const data = worker.postMessage(data, sortKey);
  // } else {
  const data = indata.sort((a, b) => {
    if (context.sort.reverse) {
      if (a[context.sort.key] < b[context.sort.key]) return -1;
      if (a[context.sort.key] > b[context.sort.key]) return 1;
      return 0;
    }
    if (b[context.sort.key] < a[context.sort.key]) return -1;
    if (b[context.sort.key] > a[context.sort.key]) return 1;
    return 0;
  }).map((d, i) => {
    d.order = i;
    return d;
  });
  // }
  // const data = 
  if (setState) {
    context.setState({ data }, () => {
      context.save(context.setResult);
    });
  } else {
    return data;
  }
}

// Should this be it's own component?
export function getSortArrow(context, key) {
  if (key === context.sort.key) {
    const angle = context.sort.reverse ? 180 : 0;
    return (<div className={gstyle.arrow} style={{ transform: `rotate(${angle}deg)` }}>⌃</div>);
  }
  return '';
}
