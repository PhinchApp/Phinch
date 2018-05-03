import React from 'react'

export default function PercentageBarGraph(props) {
  const height = 15;

  return (
    <div style={{
      width: props.width,
      height,
      backgroundColor: '#ccc',
    }}>
      <div style={{height, width: `${props.percent * 100}%`, backgroundColor: 'black'}} />
    </div>
  )
}