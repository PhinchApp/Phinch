import React, { Component } from 'react';

import _sortBy from 'lodash.sortby';
import _cloneDeep from 'lodash.clonedeep';

import StackedBar from './StackedBar';

import styles from './StackedBarRow.css';
import gstyle from './general.css';

export default class StackedBarRow extends Component {
  render() {
    const sequence = _sortBy(_cloneDeep(this.props.data.sequences), (s) => -s.reads);
    const className = (this.props.index%2 === 0) ? '' : (gstyle.grey);
    const miniBars = [];
    Object.keys(this.props.filters).forEach(k => {
      const [miniSequence] = _cloneDeep(sequence).filter(s => (s.name === k));
      if (miniSequence) {
        miniBars.push(
          <div
            key={k}
            style={{
              paddingTop: '2px',
              display: 'block',
              height: this.props.metrics.miniBarContainerHeight,
              marginLeft: this.props.metrics.nonbarWidth - (this.props.metrics.padding * 3),
            }}
          >
            <StackedBar
              data={[miniSequence]}
              sample={this.props.data}
              width={this.props.metrics.chartWidth}
              height={(this.props.metrics.miniBarHeight)}
              xscale={this.props.scales.x}
              cscale={this.props.scales.c}
              isPercent={false}
            />
          </div>
        );
      }
    });
    const action = this.props.isRemoved ? (
        <div onClick={this.props.restoreDatum}>
          <div style={{fontSize: 8}} className={styles.delete}>⤴</div>
        </div>
      ) : (
        <div onClick={this.props.removeDatum}>
          <div className={styles.delete}>x</div>
        </div>
      );
    return (
      <div
        key={this.props.data.sampleName}
        className={`${styles.row} ${className}`}
        style={{
          height: this.props.metrics.barContainerHeight + (this.props.metrics.miniBarContainerHeight * miniBars.length),
        }}
      >
        <div className={styles.rowLabel} style={{width: this.props.metrics.hideWidth}}>
          {action}
        </div>
        <div className={styles.rowLabel} style={{width: this.props.metrics.idWidth}}>
          {this.props.data.biomid}
        </div>
        <div className={styles.rowLabel} style={{width: this.props.metrics.nameWidth}}>
          {this.props.data.phinchName}
        </div>
        <StackedBar
          onHoverDatum={this.props.hoverDatum}
          onClickDatum={this.props.clickDatum}
          data={sequence}
          sample={this.props.data}
          width={this.props.metrics.chartWidth}
          height={this.props.metrics.barHeight}
          xscale={this.props.scales.x}
          cscale={this.props.scales.c}
          isPercent={this.props.isPercent}
          highlightedDatum={this.props.highlightedDatum}
        />
        {miniBars}
      </div>
    );
  }
}