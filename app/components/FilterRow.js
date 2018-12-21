import React, { Component } from 'react';

import menu from 'images/menu.svg';
import close from 'images/close.svg';

import FrequencyChart from './FrequencyChart';

import styles from './FilterRow.css';
import gstyle from './general.css';

export default class FilterRow extends Component {
  render() {
    const action = this.props.isRemoved ? (
      <div className={`${styles.cell} ${styles.noLeft}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={this.props.restoreDatum}
          onKeyPress={e => e.key === ' ' ? this.props.restoreDatum() : null}
        >
          <div className={styles.delete}>⤴</div>
        </div>
      </div>
    ) : (
      <div className={`${styles.cell} ${styles.noLeft}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={this.props.removeDatum}
          onKeyPress={e => e.key === ' ' ? this.props.removeDatum() : null}
        >
          <div className={styles.delete}>
            <img src={close} alt="delete" />
          </div>
        </div>
      </div>
    );

    const className = (this.props.index % 2 === 0) ? (
      `${styles.row} ${styles.grey}`
    ) : styles.row;

    return (
      <div
        className={className}
        key={this.props.data.sampleName}
        data-id={this.props.data.order}
        data-group={this.props.isRemoved ? 'removed' : 'data'}
        draggable="true"
        onDragEnd={this.props.dragEnd}
        onDragOver={this.props.dragOver}
        onDragStart={this.props.dragStart}
      >
        <div
          className={styles.cell}
          style={{
            width: this.props.tableWidth * this.props.columnWidths.order,
          }}
        >
          {(this.props.data.order !== undefined) ? this.props.data.order.toLocaleString() : ''}
        </div>
        <div
          className={styles.cell}
          style={{
            width: this.props.tableWidth * this.props.columnWidths.phinchName,
          }}
        >
          <input
            className={gstyle.input}
            type="text"
            value={this.props.data.phinchName}
            onChange={(e) => this.props.updatePhinchName(e, this.props.data)}
          />
        </div>
        <div
          className={styles.cell}
          style={{
            width: this.props.tableWidth * this.props.columnWidths.biomid,
          }}
        >
          {this.props.data.biomid}
        </div>
        <div
          className={styles.cell}
          style={{
            width: this.props.tableWidth * this.props.columnWidths.sampleName,
          }}
        >
          {this.props.data.sampleName}
        </div>
        <div
          className={styles.cell}
          style={{
            width: (this.props.tableWidth * this.props.columnWidths.reads) / 2,
          }}
        >
          {(this.props.data.reads !== undefined) ? this.props.data.reads.toLocaleString() : ''}
        </div>
        <div className={styles.cell}>
          <FrequencyChart
            data={this.props.allData}
            value={this.props.data.reads}
            width={120 * 2}
            height={18 * 2}
          />
        </div>
        <div className={styles.cell}>
          <div className={`${styles.delete} ${styles.drag}`}>
            <img src={menu} alt="drag" />
          </div>
        </div>
        {action}
      </div>
    );
  }
}
