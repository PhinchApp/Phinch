import React from 'react';
import gstyle from 'components/general.css';

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

export function sortBy(context, key, indata, setstate, updateTitles) {
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
  if (setstate) {
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
