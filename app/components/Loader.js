import React, { Component } from 'react';

import loading from 'images/loading.gif';

import styles from './Loader.css';

export default class Home extends Component {
  render() {
    return this.props.loading ? (
      <div className={styles.loader}><img src={loading} alt='loading' /></div>
    ) : '';
  }
}
