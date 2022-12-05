import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { remote, shell } from 'electron';
import ReactTooltip from 'react-tooltip';

import logo from 'images/phinch.svg';
import back from 'images/back.svg';
import hoverBack from 'images/backArrowW.svg';
import upload from 'images/upload.svg';
import browseOn from 'images/browseOn.svg';
import browseOff from 'images/browseOff.svg';
import filterOn from 'images/filterOn.svg';
import filterOff from 'images/filterOff.svg';
import flagshipOn from 'images/flagshipOn.svg';
import flagshipOff from 'images/flagshipOff.svg';
import needHelp from 'images/needHelpDefault.png';
import needHelpHover from 'images/needHelpHover.png';

import { createProject } from '../projects';
import DataContainer from '../datacontainer';

import SideMenu from './SideMenu';
import Microbes from './Microbes';
import Loader from './Loader';

import styles from './NewProject.css';
import gstyle from './general.css';
import { style } from 'd3';
import { StrategyValues } from 'pako';

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
        {'Phinch currently supports upload of a single BIOM-formatted data file. '}
        {'All accompanying metadata MUST be embedded within the BIOM file during '}
        {'uplaod (taxonomy strings, environmental metadata, gene names, etc.). '}
        {'Click here to view BIOM file formatting instructions for Phinch: '}
        <span
          role="button"
          tabIndex={0}
          className={styles.link}
          onClick={() => shell.openExternal('https://github.com/PhinchApp/Phinch')}
        >
          https://github.com/PhinchApp/Phinch
        </span>
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
      browse: browseOff,
      filter: filterOff,
      flagship: flagshipOff,
      helpButton: needHelp,
      backArrow: back,
    };

    /*This sets the width of the sidemenu to 100px (same as logo) and it also has a min max set for
    the size of the sidebar to maximize other components screen size
    NOTE: left min and max should be removed someday as the current formula is more effecient.*/
    this.metrics = {
      leftSidebar: "100px",
      left: {
        min: -10,
        max: (window.innerWidth*0.0672 + 30),
      },
    };

    this.menuItems = [
      {
        id: "back",
        name: 'Back',
        action: () => {
          this.setState({ redirect: '/Home' });
          this.rebuildTooltip();
        },
        icon: <img src={this.state.backArrow} alt="back-arrow"/>,
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
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
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

  rebuildTooltip() {
    console.log("render() method");
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

  /*This function deals with when the mouse hovers over the browse icon on top right of
   and changes img src accordingly to correct svg file */
  handleMouseOver (button) {
    switch(button) {
      case "browse":
        if(this.state.browse === browseOff) {
          this.setState({browse: browseOn});
        }
        break;
      case "filter":
        if(this.state.filter === filterOff) {
          this.setState({filter: filterOn});
        }
        break;
      case "flagship":
        if(this.state.flagship === flagshipOff) {
          this.setState({flagship: flagshipOn});
        }
        break;
      case "help":
        if(this.state.helpButton === needHelp) {
          this.setState({helpButton: needHelpHover});
        }
        break;
      case 'back':
        this.setState({ backArrow: hoverBack });
        break;
    }
  }

  /*This function deals with the mouse leaving an icon (no longer hovering) and
  changed img src to correct svg file */
  handleMouseLeave (button) {
    switch(button) {
      case "browse":
        if(this.state.browse === browseOn) {
          this.setState({browse: browseOff});
        }
        break;
      case "filter":
        if(this.state.filter === filterOn) {
          this.setState({filter: filterOff});
        }
        break;
      case "flagship":
        if(this.state.flagship === flagshipOn) {
          this.setState({flagship: flagshipOff});
        }
        break;
      case "help":
        if(this.state.helpButton === needHelpHover) {
          this.setState({helpButton: needHelp});
        }
        break;
      case 'back':
        this.setState({ backArrow: back });
        break;
     }
   }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    const result = (this.state.valid === 'Yes') ? (
      <button
        className={`${styles.filter}`}
        onMouseEnter={() => this.handleMouseOver("filter")}
        onMouseLeave={() => this.handleMouseLeave("filter")}
        onClick={() => {
          this.setState({ loading: true }, () => {
            this.timeout = setTimeout(() => {
              this.setState({ redirect: '/filter' });
            }, 1);
          });
        }}
      >
        <img src={this.state.filter} alt="filter" />
      </button>
    ) : (
      <div className={styles.error}>{this.state.error}</div>
    );
    const indicatorBG = (this.state.valid === 'Yes') ? '#00da3e' : '#ff2514';
    const indicator = <div className={`${gstyle.circle} ${styles.indicator}`} style={{ background: indicatorBG, transform: 'translateY(-40%)' }} />
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
      microbeColor = {
        r: 0, g: 0, b: 0, a: 0.25
      };
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
            <button
              className={styles.help}
              // on click command is still undefined outside of home page, set to issues page for now until later
              onClick={() => shell.openExternal('https://github.com/PhinchApp/Phinch/issues')}
                  onMouseEnter={() => this.handleMouseOver("help")}
                  onMouseLeave={() => this.handleMouseLeave("help")}
                >
                <img src={this.state.helpButton} alt="needHelp" />
            </button>
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
          <div className={`${styles.column}`}>
            <h1 className={styles.heading}>New Project</h1>
            <div
              rows="3"
              className={`${styles.textarea} ${indicateDrag}`}
              onDrop={this.handleDrop}
              onDragOver={allowDrop}
              onDragEnd={this.hideDrop}
              onDragEnter={this.showDrop}
              onDragLeave={this.hideDrop}
            >
              <img src={upload} alt="Upload" />
              <p>To start a new project, drop the file here, or use the </p>
              <p>"Browse" button below for a file on your local drive.</p>
            </div>
            <div
              // rows="5"
              className={`${styles.flagshipLink} ${styles.right}`}
            >
              <h1 className={styles.flagshipHeading}>Sample Datasets</h1>
              <p>Whether it's your first time here or if your just want to explore Phinch's
                capabilities before your're ready to upload your own BIOM file, use the links
                below to download a dataset to your local HD that you can use</p>
                <button
                  className={styles.downloadFS}
                  onClick={() => shell.openExternal('https://github.com/PhinchApp/datasets')}
                  onMouseEnter={() =>  this.handleMouseOver("flagship")}
                  onMouseLeave={() => this.handleMouseLeave("flagship")}
                >
                  <img src={this.state.flagship} alt="flagship-Datasets" />
                </button>
            </div>
            <button
              className={`${styles.browse}`}
              onClick={this.handleOpenButton}
              onMouseEnter={() => this.handleMouseOver("browse")}
              onMouseLeave={() => this.handleMouseLeave("browse")}
            >
              <img src={this.state.browse} alt="browse" />
            </button>
            {table}
            {result}
          </div>
        </div>
      </div>
    );
  }
}
