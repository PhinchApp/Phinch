import React, { Component } from 'react';
import { Redirect } from 'react-router';
import { remote } from 'electron';
import _clonedeep from 'lodash.clonedeep';

import { pageView } from '../analytics.js'
import loadFile from '../DataLoader.js';
import DataContainer from '../DataContainer.js';
import { getProjects, getSamples, setProjectFilters, deleteProject } from '../projects.js';

import ProjectList from './ProjectList.js';
import LinkList from './LinkList.js';
import Loader from './Loader.js';
import Modal from './Modal';

import styles from './Home.css';
import gstyle from './general.css';

import logo from 'images/phinch-large.png';
import editOff from 'images/edit-off.svg';
import editOn from 'images/edit-on.svg';

export default class Home extends Component {
  constructor(props) {
    super(props);

    pageView('/');

    this.version = remote.app.getVersion();

    this.shouldUpdate = {};

    this.state = {
      loading: false,
      editing: false,
      deleting: false,
      redirect: null,
      projects: getProjects(),
      samples: getSamples(),
    };

    this.success = this.success.bind(this);
    this.failure = this.failure.bind(this);
    this.view = this.view.bind(this);
    this.edit = this.edit.bind(this);
    this.updateName = this.updateName.bind(this);
    this.remove = this.remove.bind(this);
    this.cancelRemove = this.cancelRemove.bind(this);
    this.completeRemove = this.completeRemove.bind(this);
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

  view(project) {
    if (project.slug === 'newproject') {
      this.setState({redirect: '/newproject'});
    } else if (project.data) {
      this.setState({loading: true});
      DataContainer.setSummary(project);
      loadFile(project.data, this.success, this.failure);
    } else {
      this.failure();
    }
  }

  edit() {
    const editing = !this.state.editing;
    Object.keys(this.shouldUpdate).forEach(k => {
      const p = this.shouldUpdate[k];
      DataContainer.setSummary(p);
      setProjectFilters(p.summary.path, p.summary.dataKey, null, null, () => {});
      // setup error handling in callback here
    });
    this.shouldUpdate = {};
    const deleting = editing ? this.state.deleting : false;
    this.setState({editing, deleting});
  }

  updateName(project, name) {
    const projects = _clonedeep(this.state.projects).map(p => {
      if (p.summary.dataKey === project.summary.dataKey) {
        p.summary.name = name;
        this.shouldUpdate[p.summary.dataKey] = p;
      }
      return p;
    });
    this.setState({projects});
  }

  cancelRemove() {
    this.deleting = null;
    this.setState({deleting: false});
  }

  completeRemove() {
    // remove from filesystem 
    deleteProject(this.deleting);
    // remove from state
    const projects = _clonedeep(this.state.projects).filter(p => {
      return p.summary.dataKey !== this.deleting.summary.dataKey;
    });
    this.deleting = null;
    this.setState({projects, deleting: false});
  }

  remove(project) {
    this.deleting = project;
    this.setState({deleting: true});
  }

  render() {
    const redirect = (this.state.redirect === null) ? '' : (
        <Redirect push to={this.state.redirect} />
      );
    const links = LinkList(this);
    const modalContent = this.state.deleting ? (
        <div key='modal' className={styles.modal}>
          <p>
            Are you sure you want to permanently erase
            <span className={styles.modalTitle}>
              {this.deleting ? ` ${this.deleting.summary.name}` : ''}
            </span>
            ?
          </p>
          <p>You can't undo this action.</p>
          <div
            className={`${gstyle.button} ${styles.button} ${styles.cancel}`}
            onClick={this.cancelRemove}
          >
            Cancel
          </div>
          <div
            className={`${gstyle.button} ${styles.button}`}
            onClick={this.completeRemove}
          >
            Delete
          </div>
        </div>
      ) : null;
    const modal = this.state.deleting ? (
        <Modal
          show={true}
          buttonPosition={{display: 'none'}}
          closePosition={{display: 'none'}}
          modalPosition={{
            position: 'absolute',
            top: '33%',
            left: '50%',
            width: '410px',
            height: '192px',
            background: 'white',
            color: 'black',
          }}
          data={[modalContent]}
        />
      ) : null;
    const projects = ProjectList({
      projectList: this.state.projects,
      view: this.view,
      updateName: this.updateName,
      remove: this.remove,
      editing: this.state.editing,
      type: 'projects',
    });
    const samples = ProjectList({
      projectList: this.state.samples,
      view: this.state.editing ? () => {} : this.view,
      editing: false,
    });
    return (
      <div>
        <div className={styles.container} data-tid='container'>
          <Loader loading={this.state.loading} />
          {redirect}
          <div className={`${styles.section} ${styles.left}`}>
            <div className={`${styles.area} ${styles.info}`}>
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
            <div className={styles.edit} onClick={this.edit}>
              <img src={this.state.editing ? editOn : editOff} alt='edit' />
            </div>
            <div className={`${styles.scroll} ${gstyle.darkbgscrollbar}`}>
              <div className={`${styles.area} ${styles.rightSpace}`}>
                <div className={`${styles.projectType} ${styles.top}`}>
                  <h2 className={styles.sectionTitle}>Projects</h2>
                  <div className={styles.sectionRule} />
                </div>
                {projects}
              </div>
              <div className={`${styles.area} ${styles.rightSpace}`}>
                <div className={styles.projectType}>
                  <h2 className={styles.sectionTitle}>Samples</h2>
                  <div className={styles.sectionRule} />
                </div>
                {samples}
              </div>
            </div>
            {modal}
          </div>
        </div>
      </div>
    );
  }
}
