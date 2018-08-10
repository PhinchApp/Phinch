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
      showTags: false,
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
      this.setState({ hovered: false, showTags: false });
    }
  }
  _showEditable = () => {
    if (!this.state.hovered) {
      this.hoverHandle = setTimeout(() => {
        this.setState({hovered: true});
      }, 500);
    }
  }

  _toggleTagMenu = () => {
    const showTags = !this.state.showTags;
    this.setState({ showTags });
  }

  render() {
    const sequence = _sortBy(_cloneDeep(this.props.data.sequences), (s) => -s.reads);
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
            position: 'absolute',
            pointerEvents: 'none',
            top: 0,
            right: 0,
          }}
        >edit</div>
      ) : '';
    const name = (this.props.labelKey === 'phinchName') ? (
        <div
          className={`${styles.rowLabel} ${styles.input}`}
          style={{
            width: this.props.metrics.nameWidth,
            fontWeight: 400,
            color: '#1a1a1a',
          }}
        >
          <input
            className={gstyle.input}
            type="text"
            value={this.props.data[this.props.labelKey]}
            onChange={(e) => this.props.updatePhinchName(e, this.props.data, this.props.isRemoved)}
          />
          {edit}
        </div>
      ) : (
        <div
          className={styles.rowLabel}
          style={{
            width: this.props.metrics.nameWidth,
            fontWeight: 400,
            color: '#1a1a1a',
          }}
        >
          {this.props.data[this.props.labelKey]}
        </div>
      );
    const ellipsis = (
        <div
          style={{
            display: 'inline-block',
            width: '25px',
          }}
        >
          {
            this.state.hovered ? (
              <div
                className={styles.button}
                style={{
                  paddingLeft: '6px',
                  lineHeight: '7px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                }}
                onClick={this._toggleTagMenu}
              >
              ...
              </div>
            ) : ''
          }
        </div>
      );
    const tagMenu = this.state.showTags ? (
        <div className={styles.tagMenu}>
          {
            this.props.tags.map(t => {
              const selected = this.props.data.tags[t.id] ? true : false;
              return (
                <div
                  key={`t-${t.color}`}
                  className={`${styles.tag} ${selected ? styles.selected : ''}`}
                  onClick={() => this.props.toggleTag(this.props.data, t)}
                >
                  <div
                    className={`${gstyle.circle} ${styles.tagIcon}`}
                    style={{ background: t.color }}
                  >
                    {selected ? '-' : '+'}
                  </div>
                  <span className={styles.tagLabel}>
                    {t.name}
                  </span>
                </div>
              );
            })
          }
        </div>
      ) : '';
    const tagList = (
      <div
        style={{
          display: 'inline-block',
          marginLeft: '6px',
          verticalAlign: 'middle',
        }}
      >
        {
          this.props.tags.map(t => {
            return this.props.data.tags[t.id] ? (
              <div
                key={`c-${t.id}`}
                className={`${gstyle.circle} ${styles.tagIcon}`}
                style={{ background: t.color }}
              />
            ) : '';
          })
        }
      </div>
      );
    const action = this.state.hovered ? (
        <div
          className={styles.button}
          style={{
            position: 'absolute',
            right: '16px',
          }}
          onClick={
            this.props.isRemoved ? this.props.restoreDatum : this.props.removeDatum
          }
        >
          {this.props.isRemoved ? 'Restore' : 'Archive'}
        </div>
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
          <div>
            {ellipsis}
            {tagMenu}
            {tagList}
            {action}
          </div>
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