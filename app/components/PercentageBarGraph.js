import React from 'react';

export default function PercentageBarGraph(props) {
  const height = 5;
  return (
    <div style={{ width: `calc(${props.width}px - 2em)`, height, backgroundColor: '#4d4d4d' }}>
      <div style={{ height, width: `${props.percent * 100}%`, backgroundColor: props.color }} />
    </div>
  );
}
