import React, { Component } from 'react';

import loading from 'images/loading.gif';

import styles from './Loader.css';

export default class Home extends Component {
  render() {
    return this.props.loading ? (
      <div className={styles.loaderWrapper}>
        <div className={styles['lds-ring']}><div></div><div></div><div></div><div></div></div>
      </div>
    ) : '';
  }
}
