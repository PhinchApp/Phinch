import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { remote, shell } from 'electron';

import { createProject } from '../projects.js';
import loadFile from '../DataLoader';
import DataContainer from '../DataContainer';

import SideMenu from './SideMenu';
import Microbes from './Microbes';
import Loader from './Loader';

import styles from './NewProject.css';
import gstyle from './general.css';

import logo from 'images/phinch-logo.png';
import back from 'images/back.png';
import loading from 'images/loading.gif';

const { dialog } = remote;

export default class NewProject extends Component {
  constructor(props) {
    super(props);

    this.errors = {
      missing: 'Please select a BIOM file.',
      validation: (
        <div>
          <p>
            The file you loaded does not validate for Phinch. There may be a problem with the file formatting.
          </p>
          <p>
            If you’re having trouble, visit our Help page or 
            <span
              className={styles.link}
              onClick={() => shell.openExternal('https://github.com/PhinchApp/Phinch')}
            >
              {` Community page `}
            </span>
            to see if you can resolve this. Once you have a correct data file, try loading it again.
          </p>
        </div>
      ),
    }

    this.state = {
      name: '',
      size: '',
      valid: null,
      observations: null,
      error: null,
      redirect: null,
      loading: false,
      dragging: false,
      width: window.innerWidth,
      height: window.innerHeight,
      showLeftSidebar: true,
    };

    this.metrics = {
      padding: 16,
      leftSidebar: 121,
      left: {
        min: 27,
        max: 121,
      },
    };

    this.menuItems = [
      {
        id: 'back',
        name: 'Back',
        action: () => { 
          this.setState({ redirect: '/Home' });
        },
        icon: <img src={back} />,
      },
    ];

    this.success = this.success.bind(this);
    this.failure = this.failure.bind(this);
    this.showDrop = this.showDrop.bind(this);
    this.hideDrop = this.hideDrop.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.onChosenFileToOpen = this.onChosenFileToOpen.bind(this);
    this.handleOpenButton = this.handleOpenButton.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions() {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  toggleMenu() {
    const showLeftSidebar = !this.state.showLeftSidebar;
    this.metrics.leftSidebar = showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.setState({ showLeftSidebar });
  }

  updateSummary(project) {
    DataContainer.setSummary(project);
    const summary = DataContainer.getSummary();
    this.setState({
      name: summary.name,
      size: summary.size,
      valid: null,
      error: null,
      observations: null,
    });
  }

  updateValid(isvalid) {
    const valid = isvalid ? 'Yes' : 'No';
    this.setState({valid});
  }

  updateObservations(observations) {
    this.setState({observations});
  }

  updateError(errortype) {
    const valid = 'No';
    const error = (this.errors[errortype]) ? this.errors[errortype] : 'unknown error';
    this.setState({error, valid});
  }

  updateLoading(loading) {
    this.setState({loading});
  }

  success(data) {
    if (data.data) {
      this.updateValid(true);
      this.updateObservations(Number.parseFloat(data.rows.length).toLocaleString());
      this.updateLoading(false);
      const project = createProject({name: this.state.name, data});
      DataContainer.setSummary(project);
      DataContainer.setData(data);
    } else {
      this.failure();
    }
  }

  failure() {
    this.updateLoading(false);
    this.updateError('validation');
  }

  onChosenFileToOpen(filepath) {
    this.updateLoading(true);
    this.updateSummary({data: filepath});
    loadFile(filepath, this.success, this.failure);
  }

  handleOpenButton() {
    dialog.showOpenDialog({properties: ['openFile']}, (filepath) => {
      if (filepath) {
        this.onChosenFileToOpen(filepath.toString());
      } else {
        this.updateError('missing');
      }
    });
  }

  allowDrop(e) {
    e.preventDefault();
    return false;
  }

  showDrop(e) {
    e.preventDefault();
    this.setState({dragging: true});
    return false;
  }

  hideDrop(e) {
    e.preventDefault();
    this.setState({dragging: false});
    return false;
  }

  handleDrop(e) {
    e.preventDefault();
    this.hideDrop(e);
    if (e.dataTransfer.files[0].path) {
      this.onChosenFileToOpen(e.dataTransfer.files[0].path.toString());
    } else {
      this.updateError('missing');
    }
    return false;
  }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;
    const result = (this.state.valid === 'Yes') ? (
        <button
          id='filter'
          className={`${gstyle.button} ${styles.button} ${styles.filter}`}
          onClick={() => {
            this.setState({loading: true}, () => {
              this.timeout = setTimeout(() => {
                this.setState({redirect: '/filter'})
              }, 1);
            });
          }}
        >
          Filter Data
        </button>
      ) : (
        <div className={styles.error}>{this.state.error}</div>
      );
    const indicator = (this.state.valid === 'Yes') ? (
        <div className={`${gstyle.circle} ${styles.indicator}`} style={{background: '#00da3e'}} />
      ) : (
        <div className={`${gstyle.circle} ${styles.indicator}`} style={{background: '#ff2514'}} />
      );
    const table = (this.state.valid === null) ? null : (
        <table className={styles.table}>
          <tbody>
            <tr>
              <td className={styles.label}>File Name:</td>
              <td>{this.state.name}</td>
            </tr>
            <tr>
              <td className={styles.label}>Size:</td>
              <td>{this.state.size}</td>
            </tr>
            <tr>
              <td className={styles.label}>Observations:</td>
              <td>{this.state.observations}</td>
            </tr>
            <tr>
              <td className={styles.label}>File Validates:</td>
              <td>{indicator} {this.state.valid}</td>
            </tr>
          </tbody>
        </table>
      );
    const indicateDrag = this.state.dragging ? styles.drag : '';
    let microbeColor = {r: 0, g: 0, b: 0, a: 0};
    if (this.state.loading) {
       microbeColor = {r: 0, g: 0, b: 0, a: 0.25};
    } else if (this.state.valid !== null) {
      if (this.state.valid === 'Yes') {
        microbeColor = {r: 0, g: 255, b: 0, a: 0.5}
      } else {
        microbeColor = {r: 255, g: 0, b: 0, a: 0.25}
      }
    }
    return (
      <div className={gstyle.container}>
        <Loader loading={this.state.loading} />
        <Microbes
          show={this.state.loading || this.state.valid !== null}
          width={window.innerWidth}
          height={window.innerHeight}
          count={100}
          fill={'#f8f8f8'}
          stroke={microbeColor}
        />
        {redirect}
        <div className={styles.left}>
          <div className={gstyle.logo}>
            <Link to="/">
              <img src={logo} alt='Phinch' />
            </Link>
          </div>
          <SideMenu
            showLeftSidebar={this.state.showLeftSidebar}
            leftSidebar={this.metrics.leftSidebar}
            leftMin={this.metrics.left.min}
            chartHeight={(this.state.height - 130)}
            items={this.menuItems}
            toggleMenu={this.toggleMenu}
            hideToggle={true}
          />
        </div>
        <div className={styles.section}>
          <div className={styles.column}>
            <h1 className={styles.heading}>New Project</h1>
            <p>To start a new project, you can browse for a file on your local hard drive or drag the file to the box below.</p>
            <input className={styles.wide} type="text" value={this.state.name} placeholder='File Name' disabled />
            <button className={`${gstyle.button} ${styles.button}`} id='open' onClick={this.handleOpenButton}>Browse</button>
            <textarea
              rows="3"
              className={`${styles.textarea} ${indicateDrag}`}
              value='Drag/Drop file here'
              disabled
              onDrop={this.handleDrop}
              onDragOver={this.allowDrop}
              onDragEnd={this.hideDrop}
              onDragEnter={this.showDrop}
              onDragLeave={this.hideDrop}
            />
            {table}
            {result}
          </div>
        </div>
      </div>
    );
  }
}
