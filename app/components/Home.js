// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

const path = require('path');
const { remote, clipboard } = require('electron');
const { dialog } = remote;
const { spawn, execFile } = require('child_process');

const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();

import styles from './Home.css';
import logo from 'images/phinch.png';

export default class Home extends Component {
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
    // TODO: break down into componenets
    /*
            <h3>{this.state.filename}</h3>
            <button id='open' onClick={this.handleOpenButton}>Choose a file</button>
            <div>{this.state.datainfo}</div>
    */
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
              <Link to='/counter'>
                <div className={styles.link}>
                  <img src='' alt='' />
                  <div className={styles.linfo}>
                    <h2>New to Phinch?</h2>
                    <p>Get started with these tutorials</p>
                  </div>
                </div>
              </Link>
              <Link to='/counter'>
                <div className={styles.link}>
                  <img src='' alt='' />
                  <div className={styles.linfo}>
                    <h2>View our Gallery</h2>
                    <p>See what other researchers have creeated with Phinch.</p>
                  </div>
                </div>
              </Link>
              <Link to='/counter'>
                <div className={styles.link}>
                  <img src='' alt='' />
                  <div className={styles.linfo}>
                    <h2>Join the Community</h2>
                    <p>Discuss features and get the latest update feeds.</p>
                  </div>
                </div>
              </Link>
              <Link to='/counter'>
                <div className={styles.link}>
                  <img src='' alt='' />
                  <div className={styles.linfo}>
                    <h2>About Phinch</h2>
                    <p>What is this all about anyway?</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          <div className={`${styles.section} ${styles.right}`}>
            <div className={styles.area}>
              <div className={styles.projectType}>
                <h2>Projects</h2>
              </div>
              <Link to='/counter'>
                <div className={styles.project}>
                  <img src='' alt='' />
                  <p>New Project</p>
                </div>
              </Link>
              <Link to='/counter'>
                <div className={styles.project}>
                  <img src='' alt='' />
                  <p>New Project</p>
                </div>
              </Link>
              <Link to='/counter'>
                <div className={styles.project}>
                  <img src='' alt='' />
                  <p>New Project</p>
                </div>
              </Link>
            </div>
            <div className={styles.area}>
              <div className={styles.projectType}>
                <h2>Samples</h2>
              </div>
              <Link to='/counter'>
                <div className={styles.project}>
                  <img src='' alt='' />
                  <p>New Project</p>
                </div>
              </Link>
              <Link to='/counter'>
                <div className={styles.project}>
                  <img src='' alt='' />
                  <p>New Project</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
