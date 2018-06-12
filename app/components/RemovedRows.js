import React, { Component } from 'react';

import Table from 'rc-table';

import styles from './Filter.css';
import tstyle from './tables.css';

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
          className={styles.heading}
          style={{
            marginTop: '1rem',
            cursor: 'pointer',
          }}
          onClick={this.toggleHidden}
        >
          {label} Removed Samples
        </div>
      ) : '';
    const table = (this.state.showHidden && this.props.deleted.length) ? (
        <div className={styles.modal}>
          <p>Removed Samples</p>
          <Table
            className={tstyle.table}
            rowClassName={(r, i) => {
              if (i%2 === 0) {
                return styles.grey;
              }
              return;
            }}
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