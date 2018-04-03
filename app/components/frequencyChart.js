import React from 'react';
import { scaleLog } from 'd3-scale';

let width, height, padding, scale, bars;

export function getFrequencyChart(value) {
  const bar = (
      <g key={`v-${value}`} transform={`translate(${scale(value)}, ${height / 6})`}>
        <rect width='0.5' height={`${height / 3 * 2}`} fill='black' />
      </g>
  );
  return (
    <svg width={width} height={height}>
      <rect width={width} height={height} fill='white' />
      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke='black' />
      <circle cx={padding / 2} cy={height / 2} r={padding / 2} fill='none' stroke='black' strokeWidth='0.25' />
      <circle cx={width - padding / 2} cy={height / 2} r={padding / 2} fill='none' stroke='black' strokeWidth='0.25' />
      {bars}
      {bar}
    </svg>
  );
}

export function setupFrequencyChart(data, w, h) {
  width = w;
  height = h;
  padding = width * 0.05;

  scale = scaleLog()
            .domain([Math.min(...data), Math.max(...data)])
            .range([padding, width - padding]);

  bars = data.map((d) => {
    return (
      <g key={`g-${d}`} transform={`translate(${scale(d)}, ${height / 3})`}>
        <rect width='0.1' height={`${height / 3}`} fill='black' />
      </g>
    );
  });
}
