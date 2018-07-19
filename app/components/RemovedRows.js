import React, { Component } from 'react';

import Table from 'rc-table';

import styles from './RemovedRows.css';
import gstyle from './general.css';
import tstyle from './tables.css';

class CustomRow extends Component {
  render() {
    return (
      <tr><div {...this.props} /></tr>
    )
  }
}

export default class RemovedRows extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showHidden: false,
    };
    this.toggleHidden = this.toggleHidden.bind(this);
  }

  toggleHidden() {
    const showHidden = !this.state.showHidden;
    this.setState({showHidden});
  }

  render() {
    const label = this.state.showHidden ? 'Hide' : 'Show';
    const button = this.props.deleted.length ? (
        <div
          className={gstyle.heading}
          style={{
            position: 'absolute',
            bottom: 0,
            width: '192px',
            marginTop: '1rem',
            marginLeft: this.props.left,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={this.toggleHidden}
        >
          {label} Removed Samples
        </div>
      ) : '';
    const table = (this.state.showHidden && this.props.deleted.length) ? (
        <div
          className={styles.modal}
          style={{
            width: this.props.width - (4 * 2),
            marginLeft: this.props.left + 4,
          }}
        >
          <div className={styles.title}>Removed Samples</div>
          <Table
            className={tstyle.table}
            rowClassName={(r, i) => {
              if (i%2 === 0) {
                return `${this.props.rowStyles} ${gstyle.grey}`;
              }
              return `${this.props.rowStyles}`;
            }}
            components={{ body: { row: CustomRow } }}
            scroll={{ y: (296) }}
            columns={this.props.deletedColumns}
            data={this.props.deleted}
            rowKey={row => `d-${row.id}`}
          />
        </div>
      ) : '';
    return (
      <div>
        {table}
        {button}
      </div>
    );
  }
}