// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import styles from './NewProject.css';
import logo from 'images/phinch.png';

import vis from 'images/vis-placeholder-lg.png';

export default class Vis extends Component {
  render() {
    return (
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <Link to="/Filter">
          Back to Filter
        </Link>
        <img src={vis} width='100%' alt='vis' />
      </div>
    );
  }
}
