import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { remote } from 'electron';

import { createProject } from '../projects.js';
import loadFile from '../DataLoader';
import DataContainer from '../DataContainer';
import SideMenu from './SideMenu';

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
      validation: 'The file you loaded does not validate for Phinch. There may be a problem with the file formatting.',
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

  updateSummary(filepath) {
    DataContainer.setSummary(filepath);
    const summary = DataContainer.getSummary();
    this.setState({
      name: summary.name,
      size: summary.size,
      valid: null,
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
    DataContainer.setData(data);
    this.updateValid(true);
    this.updateObservations(Number.parseFloat(data.rows.length).toLocaleString());
    this.updateLoading(false);
    const filepath = createProject({name: this.state.name, data});
    DataContainer.setSummary(filepath);
  }

  failure() {
    this.updateLoading(false);
    this.updateError('validation');
  }

  onChosenFileToOpen(filepath) {
    this.updateLoading(true);
    this.updateSummary(filepath);
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
    let result = '';
    if (this.state.valid === 'Yes') {
      result = <Link to="/filter"><button id='filter'>Filter Data</button></Link>;
    } else if (this.state.valid === 'No') {
      result = <div className={styles.error}>{this.state.error}</div>
    }
    const loader = this.state.loading ? <img src={loading} alt='loading' /> : '';
    const indicateDrag = this.state.dragging ? styles.drag : '';
    return (
      <div className={gstyle.container}>
        {redirect}
        <div className={styles.header}>
          <div className={gstyle.logo}>
            <Link to="/">
              <img src={logo} alt='Phinch' />
            </Link>
          </div>
        </div>

        <div style={{ position: 'relative', backgroundColor: '#ffffff', color: '#808080'}}>

          <SideMenu
            showLeftSidebar={this.state.showLeftSidebar}
            leftSidebar={this.metrics.leftSidebar}
            leftMin={this.metrics.left.min}
            chartHeight={(this.state.height - 130)}
            items={this.menuItems}
            toggleMenu={this.toggleMenu}
            hideToggle={true}
          />

          <div
            className={styles.section}
            style={{ width: this.state.width - this.metrics.leftSidebar }}
          >

            <h1 className={styles.heading}>New Project</h1>
            <p>To start a new project, you can browse for a file on your local hard drive or drag the file to the box below.</p>
            <input className={styles.wide} type="text" value={this.state.name} disabled />
            <button id='open' onClick={this.handleOpenButton}>Browse</button>
            <textarea
              rows="3"
              className={`${styles.textarea} ${indicateDrag}`}
              value='Drag and Drop or Browse for file.'
              disabled
              onDrop={this.handleDrop}
              onDragOver={this.allowDrop}
              onDragEnd={this.hideDrop}
              onDragEnter={this.showDrop}
              onDragLeave={this.hideDrop}
            />
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
                  <td className={styles.label}>File Validates:</td>
                  <td>{this.state.valid}</td>
                </tr>
                <tr>
                  <td className={styles.label}>Observations:</td>
                  <td>{this.state.observations}</td>
                </tr>
              </tbody>
            </table>
            {loader}
            {result}

          </div>
        </div>
      </div>
    );
  }
}
