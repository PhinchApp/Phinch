import React from 'react';
import gstyle from 'components/general.css';

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
  const data = context.state.data.filter((d) => {
    return !rows.includes(d);
  });
  const deleted = context.state.deleted.concat(rows);
  context.setState({data, deleted});
}

export function restoreRows(context, rows) {
  const deleted = context.state.deleted.filter((d) => {
    return !rows.includes(d);
  });
  const data = context.state.data.concat(rows).sort((a, b) => {
    if (!context.sort.reverse) {
      if (a[context.sort.key] < b[context.sort.key]) return -1;
      if (a[context.sort.key] > b[context.sort.key]) return 1;
      return 0;
    } else {
      if (b[context.sort.key] < a[context.sort.key]) return -1;
      if (b[context.sort.key] > a[context.sort.key]) return 1;
      return 0;
    }
  });
  context.setState({data, deleted});
}

export function visSortBy(context, indata, setState) {
  const data = indata.sort((a, b) => {
    if (context.sort.reverse) {
      if (a[context.sort.key] < b[context.sort.key]) return -1;
      if (a[context.sort.key] > b[context.sort.key]) return 1;
      return 0;
    } else {
      if (b[context.sort.key] < a[context.sort.key]) return -1;
      if (b[context.sort.key] > a[context.sort.key]) return 1;
      return 0;
    }
  }).map((d, i) => {
    d.order = i;
    return d;
  });
  if (setState) {
    context.setState({data});
  } else {
    return data;
  }
}

export function sortBy(context, key, indata, setState, updateTitles) {
  context.sort.key = key;
  const data = indata.sort((a, b) => {
    if (context.sort.reverse) {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    } else {
      if (b[key] < a[key]) return -1;
      if (b[key] > a[key]) return 1;
      return 0;
    }
  }).map((d, i) => {
    d.order = i;
    return d;
  });
  context.sort.reverse = !context.sort.reverse;
  if (updateTitles) {
    context.columns = context.columns.map((c) => {
      c.title = context.generateTableTitle(c.key, true);
      return c;
    });
  }
  if (setState) {
    context.setState({data});
  } else {
    return data;
  }
}

export function getSortArrow(context, key) {
  if (key === context.sort.key) {
    const angle = context.sort.reverse ? 180 : 0;
    return (<div className={gstyle.arrow} style={{transform: `rotate(${angle}deg)`}}>⌃</div>);
  } else {
    return '';
  }
}
