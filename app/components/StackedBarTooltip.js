import React from 'react';

import PercentageBarGraph from './PercentageBarGraph';

import styles from './StackedBarTooltip.css';

const percentFormatter = (value) => {
  return `${Math.round(value * 10000) / 100}%`
}

function Samples(props) {
  return (
    <div className={styles.StackedBarTooltip} style={props.style}>
      <div className={styles.label}>Value:</div>
      <div className={styles.value}>{props.datum.value}</div>
      <div className={styles.label}>Samples:</div>
      {
        props.datum.sampleObjects.map((s, i) => {
          return (
            <div
              key={s.phinchName}
              className={props.styles.row} // just replace this class
              style={{
                display: 'block',
                width: '100%',
                height: '11px',
                lineHeight: '9px',
                padding: '1px 0',
                margin: 0,
                overflow: 'hidden',
                backgroundColor: (i%2 === 0) ? '#333333' : '#000000',
              }}
            >
              <div
                className={`${props.styles.cell} ${props.styles.name}`}
                style={{
                  width: '45%',
                  fontSize: '9px',
                  marginLeft: '0.25rem',
                }}
              >
                {s.phinchName}
              </div>
              <div className={props.styles.cell}>
                {
                  Object.keys(s.tags).map(t => {
                    return (
                      <div
                        key={t}
                        className={props.styles.circle}
                        style={{
                          background: s.tags[t].color,
                          width: '9px',
                          height: '9px',
                          lineHeight: '9px',
                          borderRadius: '4.5px',
                        }}
                      />
                    )
                  })
                }
              </div>
              <div
                className={`${props.styles.cell} ${props.styles.reads}`}
                style={{
                  width: '20%',
                  fontSize: '9px',
                  float: 'right',
                }}
              >
                {s.reads.toLocaleString()}
              </div>
            </div>
          )
        })
      }
    </div>
  );
}

function Datum(props) {
  const samplePercent = props.datum.reads / props.sample.reads
  const totalPercentReads = props.datum.reads / props.totalDataReads

  return (
    <div style={props.style} className={styles.StackedBarTooltip}>

      {
        props.sample.phinchName ? (
          <div>
            <div className={styles.label}>Sample Name:</div>
            <div className={styles.value}>{props.sample.phinchName}</div>
          </div>
        ) : ''
      }

      <div className={styles.label}>Taxonomy:</div>
      <div className={styles.value}>{props.datum.name}</div>

      <div className={styles.label}>Taxonomy Occurence in this sample:</div>
      <div className={styles.value}>
        {percentFormatter(samplePercent)}
        <span className={styles.small}>
          {` (${props.datum.reads.toLocaleString()} out of ${props.sample.reads.toLocaleString()})`}
        </span>
        <div className={styles.bar}>
          <PercentageBarGraph percent={samplePercent} color={props.color} width='284px' />
        </div>
      </div>

      <div className={styles.label}>Out of Total Taxonomy Occurence in all samples:</div>
      <div className={styles.value}>
        {percentFormatter(totalPercentReads)}
        <span className={styles.small}>
          {` (${props.datum.reads.toLocaleString()} out of ${props.totalDataReads.toLocaleString()})`}
        </span>
        <div className={styles.bar}>
          <PercentageBarGraph percent={totalPercentReads} color={props.color} width='284px' />
        </div>
      </div>
    </div>
  );
}

export default function StackedBarTooltip(props) {
  if (props.datum == null || props.position == null) {
    return null;
  }

  const size = {
    x: 316,
    y: 216,
  };
  if (props.showSamples) {
    size.y = 78 + (props.datum.sampleObjects.length * 11);
  }
  const position = props.position;
  if (position.x + size.x > window.innerWidth) {
    position.x -= size.x;
  }
  if (position.y + size.y > window.innerHeight) {
    position.y -= size.y;
  }
  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`
  };

  if (props.showSamples) {
    style.height = size.y;
    return <Samples {...props} style={style} />
  } else {
    return <Datum {...props} style={style} />
  }
}
