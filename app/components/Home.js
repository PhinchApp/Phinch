// @flow
import React, { Component } from 'react';

import { getProjects, getSamples } from '../projects.js';
import ProjectList from './ProjectList.js';
import LinkList from './LinkList.js';
import styles from './Home.css';
import logo from 'images/phinch.png';

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      projects: getProjects(),
      samples: getSamples(),
    };
  }

  render() {
    const links = LinkList();
    const projects = ProjectList(this.state.projects);
    const samples = ProjectList(this.state.samples);
    return (
      <div>
        <div className={styles.container} data-tid='container'>
          <div className={`${styles.section} ${styles.left}`}>
            <div className={`${styles.area} ${styles.about}`}>
              <img src={logo} alt='Phinch Logo' />
              <h1>Welcome to Phinch</h1>
              <p>version 0.01</p>
            </div>
            <div className={`${styles.area} ${styles.links}`}>
              {links}
            </div>
          </div>
          <div className={`${styles.section} ${styles.right}`}>
            <div className={styles.area}>
              <div className={styles.projectType}>
                <h2>Projects</h2>
              </div>
              {projects}
            </div>
            <div className={styles.area}>
              <div className={styles.projectType}>
                <h2>Samples</h2>
              </div>
              {samples}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
