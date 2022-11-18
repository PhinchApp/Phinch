import React from 'react';

/*
props:
<StackedBarTicks
- metrics (this.metrics)
- scale (this.scales.x)
- mode (this.state.mode)
- width (this.state.width)
- svgWidth (svgWidth)
- svgHeight (svgHeight)
>
*/

export default function StackedBarTicks(props) {
  const tickCount = Math.floor(props.metrics.chartWidth / 96);
  const ticks = props.scale.ticks(tickCount);
  if (!ticks.length) {
    return '';
  }
  let tickArray = [...new Set([0].concat(...ticks))];
  const xMax = props.scale.domain()[1];
  if (props.mode !== 'value') {
    tickArray = [];
    for (let i = 0; i < 11; i += 1) {
      tickArray.push((xMax / 10) * i);
    }
  }
  return (
    <g
      id="x-axis"
      pointerEvents="none"
      textAnchor="middle"
      fill="#808080"
      transform={`translate(${props.metrics.padding / 2}, 0)`}
    >
      <text
        id="axis-title"
        transform={`translate(
          ${props.svgWidth / 2},
          ${props.metrics.lineHeight * 0.825}
        )`}
      >
        Sequence Reads
      </text>
      <g
        id="axis-labels"
        transform={`translate(
          ${props.metrics.barInfoWidth + 2},
          ${props.metrics.lineHeight}
        )`}
        width={(props.width - (props.metrics.padding * 2))}
        height={(props.metrics.chartHeight + (props.metrics.lineHeight * 2))}
      >
        {
          tickArray.map(t => {
            const label = (props.mode === 'value') ? (
                t.toLocaleString()
              ) : (
                `${Math.round((t / xMax) * 100).toLocaleString()}%`
              );
            return (
              <g
                key={`g-${t}`}
                id={`Marker ${t}`}
                transform={`translate(${props.scale(t)}, ${(props.metrics.lineHeight)})`}
              >
                <text id={label} fontSize={12} dy={-4} dx={-1}>
                  {label}
                </text>
                <line
                  id={`Line ${label}`}
                  x1={-1}
                  y1={0}
                  x2={-1}
                  y2={props.svgHeight}
                  stroke="#b2b2b2"
                  strokeOpacity={.85}
                  strokeWidth={0.5}
                />
              </g>
            );
          })
        }
      </g>
    </g>
  );
}
