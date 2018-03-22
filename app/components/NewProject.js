// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { join } from 'path';
import { spawn } from 'child_process';
import { remote } from 'electron';
import { statSync } from 'fs';

import styles from './NewProject.css';
import logo from 'images/phinch.png';
import loading from 'images/loading.gif';

const { dialog } = remote;
const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();

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
      loading: false,
    };

    this.onChosenFileToOpen = this.onChosenFileToOpen.bind(this);
    this.handleOpenButton = this.handleOpenButton.bind(this);
  }

  updateName(filepath) {
    const valid = null;
    const filename = filepath.toString().split('/');
    this.setState({name:filename[filename.length-1],valid});
  }

  // Maybe externalize this to utils or something
  formatFileSize(bytes) {
    const interval = 1000;
    const units = ['B', 'kB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(interval));
    return `${(bytes / Math.pow(interval, i)).toFixed(1)} ${units[i]}`;
  }

  updateSize(filepath) {
    const size = this.formatFileSize(statSync(filepath).size);
    this.setState({size});
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
    this.setState({error,valid});
  }

  updateLoading(loading) {
    this.setState({loading});
  }

  uint8arrayToString(data){
    return String.fromCharCode.apply(null, data);
  }

  loadFile(filepath) {
    const python = spawn(join(`${appPath}`,`/../biomhandler/dist/biomhandler`), [filepath]);
    let json = '';
    python.stdout.on('data', (data) => {
      json += this.uint8arrayToString(data);
    });
    python.stdout.on('end', () => {
      try {
        const data = JSON.parse(json);
        // console.log(data);
        this.updateValid(true);
        this.updateObservations(Number.parseFloat(data.rows.length).toLocaleString());
        // DO SOMETHING WITH THE DATA => FILTER PAGE
      } catch (e) {
        this.updateError('validation');
      }
      this.updateLoading(false);
    });
    python.on('error', (error) => {
      this.updateLoading(false);
      this.updateError('validation');
      console.warn(error);
    });
  }

  onChosenFileToOpen(filepath) {
    this.updateLoading(true);
    this.updateName(filepath);
    this.updateSize(filepath);
    this.loadFile(filepath);
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

  render() {
    let result = '';
    if (this.state.valid === 'Yes') {
      result = <button id='filter'>Filter Data</button>;
    } else if (this.state.valid === 'No') {
      result = <div className={styles.error}>{this.state.error}</div>
    }
    const loader = this.state.loading ? <img src={loading} alt='loading' /> : '';
    return (
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <h1>New Project</h1>
        <p>To start a new project, you can browse for a file on your local hard drive or drag the file to the box below.</p>
        <input type="text" value={this.state.name} disabled />
        <button id='open' onClick={this.handleOpenButton}>Browse</button>
        <textarea rows="3" className={styles.textarea} value='Drag/Drop file here.' disabled />
        <table>
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
    );
  }
}
