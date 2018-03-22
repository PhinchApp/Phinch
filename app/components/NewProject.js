// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

const path = require('path');
const { remote } = require('electron');
const { dialog } = remote;
const { spawn, execFile } = require('child_process');

const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();

import styles from './NewProject.css';
import logo from 'images/phinch.png';

export default class NewProject extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filename: '',
      datainfo: '',
    };

    this.showFilename = this.showFilename.bind(this);
    this.showFileInfo = this.showFileInfo.bind(this);
    this.onChosenFileToOpen = this.onChosenFileToOpen.bind(this);
    this.handleOpenButton = this.handleOpenButton.bind(this);
  }

  showFilename(filepath) {
    const filename = filepath.toString().split('/');
    this.setState({filename:filename[filename.length-1]});
  }

  uint8arrayToString(data){
    return String.fromCharCode.apply(null, data);
  };

  displayInfo(data) {
    const datainfo = JSON.stringify(data);
    this.setState({datainfo:datainfo});
  }

  showFileInfo(filepath) {
    const python = spawn(path.join(`${appPath}`,`/../biomhandler/dist/biomhandler`), [filepath]);
    let json = '';
    python.stdout.on('data', (data) => {
      json += this.uint8arrayToString(data);
    });
    python.stdout.on('end', () => {
      const data = JSON.parse(json);
      const shallowData = {};
      Object.keys(data).forEach((k) => {
        if ((typeof data[k] === 'number') || (typeof data[k] === 'string')) {
          shallowData[k] = data[k];
        }
      });
      this.displayInfo(shallowData);
    });
    python.stderr.on('data', (data) => {
      console.warn(this.uint8arrayToString(data));
    });
  }

  onChosenFileToOpen(filepath) {
    this.showFilename(filepath);
    this.showFileInfo(filepath);
  }

  handleOpenButton() {
    dialog.showOpenDialog({properties: ['openFile']}, (filepath) => {
      if (filepath) {
        this.onChosenFileToOpen(filepath.toString());
      }
    });
  }

  render() {    
    return (
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <h1>New Project</h1>
        <p>To start a new project, you can browse for a file on your local hard drive or drag the file to the box below.</p>
        <input type="text" value={this.state.filename} disabled />
        <button id='open' onClick={this.handleOpenButton}>Browse</button>
        <input type="textarea" value='Drag/Drop file here.' disabled />
        <table>
          <tbody>
            <tr>
              <td>File Name</td>
              <td>{this.state.filename}</td>
            </tr>
            <tr>
              <td>Size</td>
              <td></td>
            </tr>
            <tr>
              <td>File Validates</td>
              <td></td>
            </tr>
            <tr>
              <td>Observations</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div>Error Message Goes Here</div>
        <button id='filter'>Filter Data</button>
        <div>{this.state.datainfo}</div>
      </div>
    );
  }
}
