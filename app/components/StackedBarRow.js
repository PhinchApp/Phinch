import React, { Component } from 'react';

import _sortBy from 'lodash.sortby';
import _cloneDeep from 'lodash.clonedeep';

import StackedBar from './StackedBar';

import styles from './StackedBarRow.css';
import gstyle from './general.css';

export default class StackedBarRow extends Component {
  constructor(props) {
    super(props);
    this.hoverHandle = null;
    this.state = {
      hovered: false,
    };
  }

  componentWillUnmount() {
    if (this.hoverHandle) {
      clearTimeout(this.hoverHandle);
    }
  }

  _hideEditable = () => {
    if (this.hoverHandle) {
      clearTimeout(this.hoverHandle);
    }
    if (this.state.hovered) {
      this.setState({hovered: false});
    }
  }
  _showEditable = () => {
    if (!this.state.hovered) {
      this.hoverHandle = setTimeout(() => {
        this.setState({hovered: true});
      }, 500);
    }
  }

  render() {
    const sequence = _sortBy(_cloneDeep(this.props.data.sequences), (s) => -s.reads);
    // const className = (this.props.index%2 === 0) ? '' : (gstyle.grey);
    const className = (this.props.index%2 === 0) ? styles.white : gstyle.grey;
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
    const edit = (this.state.hovered && (this.props.labelKey === 'phinchName')) ? (
        <div
          className={styles.button}
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        >edit</div>
      ) : '';
    const name = (this.props.labelKey === 'phinchName') ? (
        <div className={styles.rowLabel} style={{ width: this.props.metrics.nameWidth }}>
          <input
            className={gstyle.input}
            type="text"
            value={this.props.data[this.props.labelKey]}
            onChange={(e) => this.props.updatePhinchName(e, this.props.data, this.props.isRemoved)}
          />
          {edit}
        </div>
      ) : (
        <div className={styles.rowLabel} style={{ width: this.props.metrics.nameWidth }}>
          {this.props.data[this.props.labelKey]}
        </div>
      );
    const action = this.state.hovered ? (
        this.props.isRemoved ? (
          <div>
            <div
              className={styles.button}
              onClick={this.props.restoreDatum}
            >
              Restore
            </div>
          </div>
        ) : (
          <div>
            <div
              className={styles.button}
              onClick={this.props.removeDatum}
            >
              Archive
            </div>
          </div>
        )
      ) : '';
    return (
      <div
        key={this.props.data.sampleName}
        className={`${styles.row} ${className}`}
        style={{
          height: this.props.metrics.barContainerHeight + (this.props.metrics.miniBarContainerHeight * miniBars.length),
        }}
        onMouseEnter={this._showEditable}
        onMouseLeave={this._hideEditable}
      >
        <div
          className={styles.rowLabel}
          style={{ width: this.props.metrics.barInfoWidth }}
        >
          <div className={styles.rowLabel} style={{ width: this.props.metrics.idWidth }}>
            {this.props.data.biomid}
          </div>
          {name}
          {action}
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