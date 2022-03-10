import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { remote, shell } from 'electron';

import logo from 'images/phinch.svg';
import back from 'images/back.svg';

import { createProject } from '../projects';
import DataContainer from '../datacontainer';

import SideMenu from './SideMenu';
import Microbes from './Microbes';
import Loader from './Loader';

import styles from './NewProject.css';
import gstyle from './general.css';

const { dialog } = remote;

function allowDrop(e) {
  e.preventDefault();
  return false;
}

function preventDrop(e) {
  return e.preventDefault();
}

export default class NewProject extends Component {
  constructor(props) {
    super(props);

    const communityInfo = (
      <p>
        {'If you’re having trouble, visit our Help page or '}
        <span
          role="button"
          tabIndex={0}
          className={styles.link}
          onClick={() => shell.openExternal('https://github.com/PhinchApp/Phinch')}
          onKeyPress={e => (e.key === ' ' ? shell.openExternal('https://github.com/PhinchApp/Phinch') : null)}
        >
          Community page
        </span>
        {' to see if you can resolve this. Once you have a correct data file, try loading it again.'}
      </p>
    );

    this.errors = {
      missing: () => <div className={styles.warning}>Please select a BIOM file.</div>,
      validation: () => (
        <div className={styles.warning}>
          <p>
            The file you loaded does not validate for Phinch. There may be a problem with the file formatting. {/* eslint-disable-line max-len */}
          </p>
          {communityInfo}
        </div>
      ),
      metadata: () => (
        <div className={styles.warning}>
          <p>
            {this.rejected.length.toLocaleString()} samples contain no metadata values. Please add corresponding metadata for each OTU, or remove these samples. {/* eslint-disable-line max-len */}
          </p>
          <div className={styles.head}>
            <div>BIOM ID</div><div>Sample Name</div><div>Sequence Reads</div>
          </div>
          <ul>
            {this.rejected.map(r => (
              <li key={r.phinchName}>
                <div>{r.biomid}</div><div>{r.phinchName}</div><div>{r.reads.toLocaleString()}</div>
              </li>
            ))}
          </ul>
          {communityInfo}
        </div>
      ),
    };

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

    /*This sets the width of the sidemenu to 6.72% of the inner window width
    and it also has a min max set for the size of the sidebar to maximize other components screen size 
    NOTE: left min and max should be removed someday as the current formula is more effecient.*/
    this.metrics = {
      leftSidebar: (window.innerWidth*0.0672),
      left: {
        min: -10,
        max: (window.innerWidth*0.0672 + 30),
      },
    };

    this.menuItems = [
      {
        id: 'back',
        name: 'Back',
        action: () => {
          this.setState({ redirect: '/Home' });
        },
        icon: <img src={back} alt="back" />,
      },
    ];

    this.success = this.success.bind(this);
    this.failure = this.failure.bind(this);
    this.metadataWarning = this.metadataWarning.bind(this);
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
    window.addEventListener('dragover', preventDrop, false);
    window.addEventListener('drop', preventDrop, false);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
    window.removeEventListener('resize', this.updateDimensions);
    window.removeEventListener('dragover', preventDrop);
    window.removeEventListener('drop', preventDrop);
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
    DataContainer.setSummary(project, () => {
      const summary = DataContainer.getSummary();
      this.setState({
        name: summary.name,
        size: summary.size,
        valid: null,
        error: null,
        observations: null,
      });
    }, this.failure);
  }

  updateValid(isvalid) {
    const valid = isvalid ? 'Yes' : 'No';
    this.setState({ valid });
  }

  updateObservations(observations) {
    this.setState({ observations });
  }

  updateError(errortype) {
    const loading = false;
    const valid = 'No';
    const error = this.errors[errortype] ? this.errors[errortype]() : 'unknown error';
    this.setState({ loading, valid, error });
  }

  updateLoading(isLoading) {
    this.setState({ loading: isLoading });
  }

  success() {
    const project = createProject({ name: this.state.name, data: DataContainer.getData() });
    DataContainer.setSummary(project, () => {
      const { name, size, observations } = DataContainer.getSummary();
      this.setState({
        valid: 'Yes',
        loading: false,
        name,
        size,
        observations,
      });
    }, this.failure);
  }

  failure() {
    this.updateError('validation');
  }

  metadataWarning(rejected) {
    this.rejected = rejected;
    this.updateError('metadata');
  }

  onChosenFileToOpen(filepath) {
    this.updateLoading(true);
    DataContainer.setSummary({ data: filepath }, () => {
      const summary = DataContainer.getSummary();
      this.setState({
        name: summary.name,
        size: summary.size,
        valid: null,
        error: null,
        observations: null,
      }, () => {
        DataContainer.loadAndFormatData(filepath, this.success, this.failure, this.metadataWarning);
      });
    }, this.failure);
  }

  handleOpenButton() {
    dialog.showOpenDialog({ properties: ['openFile'] }, (filepath) => {
      if (filepath) {
        this.onChosenFileToOpen(filepath.toString());
      } else {
        this.updateError('missing');
      }
    });
  }

  showDrop(e) {
    e.preventDefault();
    this.setState({ dragging: true });
    return false;
  }

  hideDrop(e) {
    e.preventDefault();
    this.setState({ dragging: false });
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
        id="filter"
        className={`${gstyle.button} ${styles.button} ${styles.filter}`}
        onClick={() => {
          this.setState({ loading: true }, () => {
            this.timeout = setTimeout(() => {
              this.setState({ redirect: '/filter' });
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
      <div className={`${gstyle.circle} ${styles.indicator}`} style={{ background: '#00da3e' }} />
    ) : (
      <div className={`${gstyle.circle} ${styles.indicator}`} style={{ background: '#ff2514' }} />
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
    let microbeColor = {
      r: 0, g: 0, b: 0, a: 0
    };
    if (this.state.loading) {
      microbeColor = {
        r: 0, g: 0, b: 0, a: 0.25
      };
    } else if (this.state.valid !== null) {
      if (this.state.valid === 'Yes') {
        microbeColor = {
          r: 0, g: 255, b: 0, a: 0.5
        };
      } else {
        microbeColor = {
          r: 255, g: 0, b: 0, a: 0.25
        };
      }
    }
    return (
      <div className={gstyle.container}>
        <Loader loading={this.state.loading} />
        <Microbes
          show={this.state.loading || this.state.valid !== null}
          width={this.state.width}
          height={this.state.height}
          count={100}
          fill="#f8f8f8"
          stroke={microbeColor}
        />
        {redirect}
        <div className={styles.left}>
          <div className={gstyle.logo}>
            <Link to="/">
              <img src={logo} alt="Phinch" />
            </Link>
          </div>
          <SideMenu
            showLeftSidebar={this.state.showLeftSidebar}
            leftSidebar={this.metrics.leftSidebar}
            leftMin={this.metrics.left.min}
            chartHeight={(this.state.height - 130)}
            items={this.menuItems}
            toggleMenu={this.toggleMenu}
            hideToggle
          />
        </div>
        <div className={styles.section}>
          <div className={styles.column}>
            <h1 className={styles.heading}>New Project</h1>
            <p>
              To start a new project, you can browse for a file on your local hard drive or drag the file to the box below. {/* eslint-disable-line max-len */}
            </p>
            <input className={styles.wide} type="text" value={this.state.name} placeholder="File Name" disabled />
            <button className={`${gstyle.button} ${styles.button}`} id="open" onClick={this.handleOpenButton}>Browse</button>
            <textarea
              rows="3"
              className={`${styles.textarea} ${indicateDrag}`}
              value="Drag/Drop file here"
              disabled
              onDrop={this.handleDrop}
              onDragOver={allowDrop}
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
