import React from 'react';

/*
props:
<Sequence
- seq (s)
- scales (this.)
- filters (this.state.)
- renderSVG (this.state.)
- index (i)
- sequenceRowHeight (this.metrics.)
- yOffset (props.metrics.sequenceRowHeight * props.index || styles.top)
- removeFilter (removeFilter)
- clickDatum (_clickDatum)
>
*/

import styles from './Sequence.css';

export default function Sequence (props) {
  const metrics = {
    width: (props.metrics.chartWidth + props.metrics.nonbarWidth)
      - (3 + (props.metrics.padding * 2)),
    rank: 50,
    circle: {
      offset: 75,
      radius: props.metrics.sequenceRowHeight / 3,
    },
    name: 100,
  };
  metrics.reads = metrics.width - (props.metrics.padding / 2);
  const color = props.scales.c(props.seq.name);
  const seqs = props.seq.name.replace(/[a-zA-Z]__/g, '').trim().split(',').filter(q => q);
  const name = seqs[seqs.length - 1];
  const sequenceInFilters = Object.prototype.hasOwnProperty.call(props.filters, props.seq.name);
  const highlighted = sequenceInFilters && !props.renderSVG;
  let textColor = highlighted ? color : '#ffffff';
  let rectFill = (props.index % 2 === 0) ? '#121212' : '#000000';
  if (props.renderSVG) {
    textColor = '#121212';
    rectFill = (props.index % 2 === 0) ? '#f4f4f4' : '#ffffff';
  }
  return (
    <g
      key={props.seq.name}
      id={props.seq.name}
      className={styles.row}
      transform={`translate(0, ${props.yOffset})`}
      fill={textColor}
      fontFamily="IBM Plex Sans Condensed"
      fontWeight={highlighted ? '400' : '300'}
      fontSize="12px"
      onClick={() => {
        if (highlighted) {
          props.removeFilter(props.seq.name);
        } else {
          props.clickDatum(props.seq);
        }
      }}
    >
      <rect
        width={metrics.width}
        height={props.metrics.sequenceRowHeight}
        fill={rectFill}
      />
      <circle
        id={color}
        fill={color}
        r={metrics.circle.radius}
        transform={
          `translate(${metrics.circle.offset}, ${props.metrics.sequenceRowHeight / 2})`
        }
      />
      <g id="info" transform={`translate(0, ${(props.metrics.sequenceRowHeight / 3) * 2})`}>
        <text
          id="rank"
          textAnchor="end"
          transform={`translate(${metrics.rank}, 0)`}
        >
          {props.seq.rank.toLocaleString()}
        </text>
        <text id="name" transform={`translate(${metrics.name}, 0)`}>
          {name}
        </text>
        <text
          id="reads"
          textAnchor="end"
          transform={`translate(${metrics.reads}, 0)`}
        >
          {props.seq.reads.toLocaleString()}
        </text>
      </g>
    </g>
  );
}
