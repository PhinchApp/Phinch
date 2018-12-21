import React, { Component } from 'react';

import styles from './CheckBoxes.css';
import gstyle from './general.css';

export default class CheckBoxes extends Component {
  render() {
    const buttons = this.props.filter.expanded ? (
      <div>
        <div
          role="button"
          tabIndex={0}
          className={styles.toggle}
          onClick={() => this.props.setAll(this.props.name, true)}
          onKeyPress={e => e.key === ' ' ? this.props.setAll(this.props.name, true) : null}
        >
          all
        </div>
        <div
          role="button"
          tabIndex={0}
          className={styles.toggle}
          onClick={() => this.props.setAll(this.props.name, false)}
          onKeyPress={e => e.key === ' ' ? this.props.setAll(this.props.name, false) : null}
        >
          none
        </div>
      </div>
    ) : '';
    const boxes = this.props.filter.expanded ? (
      this.props.data.values.map((d) => (
        <div key={d.value} className={styles.row}>
          <label htmlFor={d.value} className={gstyle.checkbox}>
            <input
              type="checkbox"
              id={d.value}
              name={d.value}
              value={d.value}
              checked={this.props.filter.range[d.value]}
              onChange={event => this.props.update(this.props.name, d.value, event.target.checked)}
            />
            <span className={gstyle.checkmark} />
          </label>
          <div style={{ display: 'inline-block', marginLeft: '4px' }} htmlFor={d.value}>
            {d.value} ({d.count})
          </div>
        </div>
      ))
    ) : '';
    return (
      <div className={styles.group}>
        <div className={styles.name}>{this.props.name}</div>
        {buttons}
        {boxes}
      </div>
    );
  }
}
