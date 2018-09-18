import React, { Component } from 'react';
import { Redirect } from 'react-router';
import { remote } from 'electron';

import { pageView } from '../analytics.js'
import loadFile from '../DataLoader.js';
import DataContainer from '../DataContainer.js';
import { getProjects, getSamples } from '../projects.js';
import ProjectList from './ProjectList.js';
import LinkList from './LinkList.js';
import Loader from './Loader.js';

import styles from './Home.css';
import gstyle from './general.css';
import logo from 'images/phinch-large.png';

export default class Home extends Component {
  constructor(props) {
    super(props);

    pageView('/');

    this.version = remote.app.getVersion();

    this.state = {
      loading: false,
      redirect: null,
      projects: getProjects(),
      samples: getSamples(),
    };

    this.success = this.success.bind(this);
    this.failure = this.failure.bind(this);
    this.click = this.click.bind(this);
  }

  success(data) {
    DataContainer.setData(data);
    this.setState({
      redirect: '/filter',
      loading: false,
    });
  }

  failure() {
    this.setState({loading: false});
    alert('data not found! (data must be named `foldername.biom`)');
  }

  click(project) {
    if (project.slug === 'newproject') {
      this.setState({redirect: '/newproject'});
    } else if (project.data) {
      this.setState({loading: true});
      DataContainer.setSummary(project.data);
      loadFile(project.data, this.success, this.failure);
    } else {
      this.failure();
    }
  }

  render() {
    const redirect = (this.state.redirect === null) ? '' : <Redirect push to={this.state.redirect} />;
    const links = LinkList();
    const projects = ProjectList({projectList: this.state.projects, click: this.click});
    const samples = ProjectList({projectList: this.state.samples, click: this.click});
    return (
      <div>
        <div className={styles.container} data-tid='container'>
          <Loader loading={this.state.loading} />
          {redirect}
          <div className={`${styles.section} ${styles.left}`}>
            <div className={`${styles.area} ${styles.about}`}>
              <img src={logo} className={styles.logo} alt='Phinch Logo' />
              <p>Version {this.version}</p>
            </div>
            <div className={`${styles.links} ${gstyle.exdarkbgscrollbar}`}>
              <div className={`${styles.area} ${styles.rightSpace}`}>
                {links}
              </div>
            </div>
          </div>
          <div className={`${styles.section} ${styles.right}`}>
            <div className={`${styles.scroll} ${gstyle.darkbgscrollbar}`}>
              <div className={`${styles.area} ${styles.rightSpace}`}>
                <div className={styles.projectType}>
                  <h2 className={styles.sectionTitle}>Projects</h2>
                </div>
                {projects}
              </div>
              <div className={`${styles.area} ${styles.rightSpace}`}>
                <div className={styles.projectType}>
                  <h2 className={styles.sectionTitle}>Samples</h2>
                </div>
                {samples}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
