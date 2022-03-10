import React, { Component } from 'react';
import { Redirect } from 'react-router';
import _clonedeep from 'lodash.clonedeep';

import editOff from 'images/edit-off.svg';
import editOn from 'images/edit-on.svg';
import editHover from 'images/edit-hover.svg';

import { pageView } from '../analytics';
import DataContainer from '../datacontainer';
import { getProjects, setProjectFilters, deleteProject } from '../projects';

import ProjectList from './ProjectList';
import SideBar from './SideBar';
import Loader from './Loader';
import Modal from './Modal';

import styles from './Home.css';
import gstyle from './general.css';

export default class Home extends Component {
  constructor(props) {
    super(props);

    pageView('/');

    this.shouldUpdate = {};

    this.errors = {
      file: () => (
        <div>
          <p>
            Data not found!
          </p>
          <p>
            The data file must be a JSON or HDF5 BIOM file with the same name as it&#39;s containing folder, and the `.biom` extension. {/* eslint-disable-line max-len */}
          </p>
        </div>
      ),
      permissions: biomhandlerLocation => (
        <div>
          <p>
            Permission Error!
          </p>
          <p>
            Please make sure the data loading script is executable on your system:
          </p>
          <p>
            <code>{`\`chmod +x ${biomhandlerLocation}\`.`}</code>
          </p>
        </div>
      ),
    };

    this.state = {
      loading: false,
      editing: false,
      deleting: false,
      erroring: false,
      error: this.errors.file(),
      redirect: null,
      projects: getProjects(),
      iconSRC: editOff,
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

  success() {
    this.setState({
      redirect: '/filter',
      loading: false,
    });
  }

  failure(type = 'file', path = '') {
    const error = this.errors[type](path);
    this.setState({ loading: false, erroring: true, error });
  }

  view(project) {
    if (project.slug === 'newproject') {
      this.setState({ redirect: '/newproject' });
    } else if (project.data) {
      this.setState({ loading: true });
      DataContainer.setSummary(project, () => {
        DataContainer.loadAndFormatData(project.data, this.success, this.failure);
      }, this.failure);
    } else {
      this.failure();
    }
  }

  edit() {
    const editing = !this.state.editing;
    Object.keys(this.shouldUpdate).forEach(k => {
      const p = this.shouldUpdate[k];
      DataContainer.setSummarySync(p);
      const summary = DataContainer.getSummary();
      setProjectFilters(
        summary.path,
        summary.dataKey,
        null,
        null,
        () => {} // setup error handling in callback here
      );
    });
    this.shouldUpdate = {};
    const deleting = editing ? this.state.deleting : false;
    this.setState({ editing, deleting });
    if(this.state.iconSRC === editOn) {
      this.setState({iconSRC: editOff});
    }
    else 
    {
      this.setState({iconSRC: editOn});
    }
  }

  updateName(project, name) {
    const projects = _clonedeep(this.state.projects).map(p => {
      if (p.summary.dataKey === project.summary.dataKey) {
        p.summary.name = name;
        this.shouldUpdate[p.summary.dataKey] = p;
      }
      return p;
    });
    this.setState({ projects });
  }

  cancelRemove() {
    this.deleting = null;
    this.setState({ deleting: false });
  }

  completeRemove() {
    deleteProject(this.deleting); // remove from filesystem
    const projects = _clonedeep(this.state.projects) // remove from state
      .filter(p => p.summary.dataKey !== this.deleting.summary.dataKey);
    this.deleting = null;
    this.setState({ projects, deleting: false });
  }

  remove(project) {
    this.deleting = project;
    this.setState({ deleting: true });
  }

  /*This function deals with when the mouse hovers over the edit icon on top right of
  the home screen and changes img src accordingly to correct svg file */
  handleMouseOver () {
    if(this.state.iconSRC === editOff) {
      this.setState({ iconSRC: editHover });
    }
  }

  /*This function deals with the mouse leaving an icon (no longer hovering) and 
  changed img src to correct svg file */
  handleMouseLeave () {
    if(this.state.iconSRC === editHover) {
      this.setState({iconSRC: editOff});
    }
    else if(this.state.iconSRC === editOn)
    {
      this.setState({iconSRC: editOn});
    }
    else 
    {
      this.setState({iconSRC: editOff});
    }
  }

  render() {
    if (this.state.redirect !== null && this.state.redirect !== '/') {
      return <Redirect push to={this.state.redirect} />;
    }
    let modalContent = null;
    if (this.state.deleting) {
      modalContent = (
        <div key="modal" className={styles.modal}>
          <p>
            Are you sure you want to permanently erase
            <span className={styles.modalTitle}>
              {this.deleting ? ` ${this.deleting.summary.name}` : ''}
            </span>
            ?
          </p>
          <p>You can&#39;t undo this action.</p>
          <div
            role="button"
            tabIndex={0}
            className={`${gstyle.button} ${styles.button} ${styles.cancel}`}
            onClick={this.cancelRemove}
            onKeyPress={e => (e.key === ' ' ? this.cancelRemove() : null)}
          >
            Cancel
          </div>
          <div
            role="button"
            tabIndex={0}
            className={`${gstyle.button} ${styles.button}`}
            onClick={this.completeRemove}
            onKeyPress={e => (e.key === ' ' ? this.completeRemove() : null)}
          >
            Delete
          </div>
        </div>
      );
    }
    if (this.state.erroring) {
      modalContent = (
        <div key="modal" className={styles.modal}>
          {this.state.error}
          <div
            role="button"
            tabIndex={0}
            className={`${gstyle.button} ${styles.button} ${styles.cancel}`}
            onClick={() => this.setState({ erroring: false })}
            onKeyPress={e => (e.key === ' ' ? this.setState({ erroring: false }) : null)}
          >
            Ok
          </div>
        </div>
      );
    }
    const modal = (this.state.deleting || this.state.erroring) ? (
      <Modal
        show
        buttonPosition={{ display: 'none' }}
        closePosition={{ display: 'none' }}
        modalPosition={{
          position: 'absolute',
          top: '33%',
          left: '50%',
          width: '410px',
          height: this.state.error.props.children.length > 2 ? '256px' : '192px',
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
      iconSRC: this.state.iconSRC,
      type: 'projects',
    });
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <Loader loading={this.state.loading} />
          <SideBar context={this} />
          <div className={`${styles.section} ${styles.right}`}>
            <div
              role="button"
              tabIndex={0}
              className={styles.edit}
              onClick={this.edit}
              onKeyPress={e => (e.key === ' ' ? this.edit() : null)}
              onMouseEnter={() => this.handleMouseOver()}
              onMouseLeave={() => this.handleMouseLeave()}
            >
              <img src={this.state.iconSRC} alt="edit" />
            </div>
            <div className={`${styles.scroll} ${gstyle.darkbgscrollbar}`}>
              <div className={`${styles.area} ${styles.rightSpace}`}>
                <div className={`${styles.projectType} ${styles.top}`}>
                  <h2 className={styles.sectionTitle}>Projects</h2>
                  <div className={styles.sectionRule} />
                </div>
                {projects}
              </div>
            </div>
            {modal}
          </div>
        </div>
      </div>
    );
  }
}
