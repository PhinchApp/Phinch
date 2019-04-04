import React from 'react';
import gstyle from 'components/general.css';

export function updateFilters(filters, attribute, min, max, callback) {
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
  const deleted = visSortBy(
    context.state.deleted.concat(rows),
    context.state.sortReverse,
    context.state.sortKey,
  );
  context.setState({ data, deleted }, () => {
    context.save(context.setResult);
  });
}

export function restoreRows(context, rows) {
  const deleted = context.state.deleted.filter(d => !rows.includes(d));
  const data = visSortBy(
    context.state.data.concat(rows),
    context.state.sortReverse,
    context.state.sortKey,
  );
  context.setState({ data, deleted }, () => {
    context.save(context.setResult);
  });
}

export function visSortBy(indata, sortReverse, sortKey) {
  return indata.sort((a, b) => {
    if (sortReverse) {
      if (a[sortKey] < b[sortKey]) return -1;
      if (a[sortKey] > b[sortKey]) return 1;
      return 0;
    }
    if (b[sortKey] < a[sortKey]) return -1;
    if (b[sortKey] > a[sortKey]) return 1;
    return 0;
  }).map((d, i) => {
    d.order = i;
    return d;
  });
}

export function countObservations(data) {
  if (data.length) {
    return [...new Set([].concat([], ...data.slice().map(d => d.observations)))].length;
  }
  return 0;
}

// Should this be it's own component?
export function getSortArrow(sortReverse, sortKey, key) {
  if (key === sortKey) {
    const angle = sortReverse ? 180 : 0;
    return (<div className={gstyle.arrow} style={{ transform: `rotate(${angle}deg)` }}>⌃</div>);
  }
  return '';
}
