import React, { Component } from 'react';
import Modal from './Modal';

import menu from 'images/menu.svg';
import close from 'images/close.svg';
import restoreRowImage from 'images/restoreRowButton.png';
import FrequencyChart from './FrequencyChart';

import styles from './FilterRow.css';
import gstyle from './general.css';

export default class FilterRow extends Component {
  constructor(props){
    super(props);
    this.state = {
      deleting: false,
    };
  }

  delete = () => {
    this.setState({ deleting: true });
  }

  cancel = () => {
    this.setState({ deleting: false });
  }

  render() {
    const action = this.props.isRemoved ? (
      <div className={`${styles.cell} ${styles.noLeft}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={this.props.restoreDatum}
          onKeyPress={e => (e.key === ' ' ? this.props.restoreDatum() : null)}
        >
          <div className={styles.restore}>
            <img src={restoreRowImage} alt="restore" />
          </div>
        </div>
      </div>
    ) : (
      <div className={`${styles.cell} ${styles.noLeft}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={this.delete}
          onKeyPress={e => (e.key === ' ' ? this.delete() : null)}
        >
          <div className={styles.delete}>
            <img src={close} alt="delete" />
          </div>
        </div>
      </div>
    );
    let modalContent = null;
    if (this.state.deleting) {
      modalContent = (
        <div key="modal" className={styles.modal}>
          <p>
            Are you sure you want to archive sample:
            <span className={styles.modalTitle}>
              {this.state.deleting ? ` ${this.props.data.sampleName}` : ''}
            </span>
            ?
          </p>
          <p>If yes, it can always be found and added back using the Archived Samples tab.</p>
          <div
            role="button"
            tabIndex={0}
            className={`${gstyle.button} ${styles.button} ${styles.cancel}`}
            onClick={this.cancel}
            onKeyPress={e => (e.key === ' ' ? this.cancel() : null)}
          >
            Cancel
          </div>
          <div
            role="button"
            tabIndex={0}
            className={`${gstyle.button} ${styles.button}`}
            onClick={this.props.removeDatum}
            onKeyPress={e => (e.key === ' ' ? this.props.removeDatum() : null)}
          >
            Archive
          </div>
          {this.cancel}
        </div>
      );
    }

    const modal = (this.state.deleting) ? (
      <Modal
        show
        buttonPosition={{ display: 'none' }}
        closePosition={{ display: 'none' }}
        modalPosition={{
          position: 'absolute',
          top: '33%',
          left: '33%',
          width: '410px',
          height: '200px',
          background: 'white',
          boxShadow: '0px 0px 10px -2px',
          border: 'none',
          color: 'black',
          zIndex: '5',
        }}
        data={[modalContent]}
      />
    ) : null;


    const className = (this.props.index % 2 === 0) ? (
      `${styles.row} ${styles.grey}`
    ) : styles.row;

    const tableWidth = this.props.tableWidth - 300;//this scales down tableWidth for the drag, close, and frequency chart cells

    return (
      <div
        className={className}
        key={this.props.data.sampleName}
        style={{ position: 'absolute', top: `${this.props.yOffset}px`, width: this.props.tableWidth - 40, }}
        data-id={this.props.data.order}
        data-group={this.props.isRemoved ? 'removed' : 'data'}
        draggable="true"
        onDragOver={this.props.dragOver}
      >
        <div
          className={styles.cell}
          style={{
            width: tableWidth * this.props.columnWidths.order,
            textAlign: 'right',
          }}
          >
          {(this.props.data.order !== undefined) ? this.props.data.order.toLocaleString() : ''}
        </div>
        <div
          className={styles.cell}
          style={{
            width: tableWidth * this.props.columnWidths.phinchName,
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
            width: tableWidth * this.props.columnWidths.biomid,
            textAlign: 'right',
          }}
          >
          {this.props.data.biomid}
        </div>
        <div
          className={styles.cell}
          style={{
            width: tableWidth * this.props.columnWidths.sampleName,
          }}
          >
          {this.props.data.sampleName}
        </div>
        <div
          className={styles.cell}
          style={{
            width: (tableWidth * this.props.columnWidths.reads),
            textAlign: 'right',
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
        {modal}
      </div>
    );
  }
}
