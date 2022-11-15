import React from 'react';

import PercentageBarGraph from '../PercentageBarGraph';

import styles from './SankeyTooltip.css';

const size = {
  x: 316,
  y: 216,
};

const percentFormatter = (value) => `${Math.round(value * 10000) / 100}%`;


function Datum(props) {
  const { name, counts, totalCounts, color, maxWidth } = props;

  return (
    <div
      ref={(t) => {
        if (t) {
          if (size.y !== t.clientHeight) {
            size.y = t.clientHeight;
          }
        }
      }}
      style={{...props.style, maxWidth}}
      className={styles.SankeyTooltip}
    >
      <div className={styles.label}>Taxonomy:</div>
      <div className={styles.value}>{name}</div>

      <div className={styles.label}>Counts:</div>
      <div className={styles.value}>{counts.toLocaleString()}</div>

      <div className={styles.label}>Out of Total Taxonomy Occurence in all samples:</div>
      <div className={styles.value}>{percentFormatter(counts / totalCounts)}
        <span className={styles.small}>
          {` (${counts.toLocaleString()} out of ${totalCounts.toLocaleString()})`}
        </span>

        <div className={styles.bar}>
          <PercentageBarGraph percent={counts / totalCounts} color={color} width={maxWidth} />
        </div>
      </div>

      {/* {
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
          <PercentageBarGraph percent={samplePercent} color={props.color} width="284px" />
        </div>
      </div>

      <div className={styles.label}>Out of Total Taxonomy Occurence in all samples:</div>
      <div className={styles.value}>
        {percentFormatter(totalPercentReads)}
        <span className={styles.small}>
          {` (${props.datum.reads.toLocaleString()} out of ${props.totalDataReads.toLocaleString()})`}
        </span>
        <div className={styles.bar}>
          <PercentageBarGraph percent={totalPercentReads} color={props.color} width="284px" />
        </div>
      </div>

      <div className={styles.click}>Click to show histogram</div> */}
    </div>
  );
}

export default function SankeyTooltip(props) {
  if (props.position == null) {
    return null;
  }

  const position = props.position;
  // if (position.x + size.x > window.innerWidth) {
  //   position.x = Math.max(position.x -= size.x, 8);
  // }
  // if (position.y + size.y > window.innerHeight) {
  //   position.y = Math.max(position.y -= size.y, 8);
  // }
  const style = {
    transform: `translate(${0}px, ${position.y}px)`,
  };

  if (position.y > window.innerHeight / 2) {
    style.transform += ' translateY(-100%) translateY(-0.5em)';
  } else {
    style.transform += ' translateY(2em)';
  }


  return <Datum {...props} style={style} />;
}
