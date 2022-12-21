import React from 'react';

import PercentageBarGraph from './PercentageBarGraph';
import SpotlightWithToolTip from './SpotlightWithToolTip';
import styles from './StackedBarTooltip.css';

const size = {
  x: 316,
  y: 216,
};

const percentFormatter = (value) => `${Math.round(value * 10000) / 100}%`;

function Datum(props) {
  const samplePercent = props.datum.reads / props.sample.reads;
  const totalPercentReads = props.datum.reads / props.totalDataReads;

  return (
    <SpotlightWithToolTip
      isActive={props.spotlight}
      toolTipTitle={"If you hover over any visible bar chart slice, the whole visual will highlight the same observation across all graphs, and a box of detailed information will appear accordingly. If you click the hovered taxonomy, its graph will be added to the side bar."}
      style={{
        zIndex: 100000,
      }}
    >
      <div
        ref={(t) => {
          if (t) {
            if (size.y !== t.clientHeight) {
              size.y = t.clientHeight;
            }
          }
        }}
        style={props.style}
        className={styles.StackedBarTooltip}
      >

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
            <PercentageBarGraph percent={samplePercent} color={props.color} width="324px" />
          </div>
        </div>

        <div className={styles.label}>Out of Total Taxonomy Occurence in all samples:</div>
        <div className={styles.value}>
          {percentFormatter(totalPercentReads)}
          <span className={styles.small}>
            {` (${props.datum.reads.toLocaleString()} out of ${props.totalDataReads.toLocaleString()})`}
          </span>
          <div className={styles.bar}>
            <PercentageBarGraph percent={totalPercentReads} color={props.color} width="324px" />
          </div>
        </div>

        <div className={styles.click}>Click the taxonomy fraction to show its histogram on left panel</div>
      </div>
    </SpotlightWithToolTip>
  );
}

export default function StackedBarTooltip(props) {
  if (props.datum == null || props.position == null) {
    return null;
  }

  const position = props.position;
  if (position.x + size.x > window.innerWidth) {
    position.x = Math.max(position.x -= size.x, 8);
  }
  if (position.y + size.y > window.innerHeight) {
    position.y = Math.max(position.y -= size.y, 8);
  }
  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`
  };

  return <Datum {...props} style={style} />;
}
