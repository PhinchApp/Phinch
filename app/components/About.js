import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import close from 'images/close.svg';
import closeDefault from 'images/closeDefault.svg';
import aps from 'images/apsf-logo.png';
import uga from 'images/uga-logo@2x.png';
import pitch from 'images/pitch.png';
import arrow from 'images/arrow.svg';
import arrowHover from 'images/arrowHover.svg';

import { pageView } from '../analytics';
import SideBar from './SideBar';
import styles from './Home.css';
import gstyles from './general.css';

export default class About extends Component {
  constructor(props) {
    super(props);

    pageView('/about');

    this.state = {
      redirect: null,
      hoveringClose: false,
      link1: arrow,
      link2: arrow,
      link3: arrow,
      link4: arrow,
      link5: arrow,
    };
  }

  /*This function deals with when the mouse hovers over the edit icon on top right of
  the home screen and changes img src accordingly to correct svg file */
  handleMouseOver (title) {
    switch(title) {
      case 'New to Phinch?':
        this.setState({ link1: arrowHover });
        break;
      case 'View our Flagship Datasets':
        this.setState({ link2: arrowHover });
        break;
      case 'Join the Community':
        this.setState({ link3: arrowHover });
        break;
      case 'About Phinch':
        this.setState({ link4: arrowHover });
        break;
      case 'Find a software issue?':
        this.setState({ link5: arrowHover });
        break;
    }
  }

  /*This function deals with the mouse leaving an icon (no longer hovering) and
  changed img src to correct svg file */
  handleMouseLeave (title) {
    switch(title) {
      case 'New to Phinch?':
        this.setState({ link1: arrow });
        break;
      case 'View our Flagship Datasets':
        this.setState({ link2: arrow });
        break;
      case 'Join the Community':
        this.setState({ link3: arrow });
        break;
      case 'About Phinch':
        this.setState({ link4: arrow });
        break;
      case 'Find a software issue?':
        this.setState({ link5: arrow });
        break;
    }
  }

  render() {
    if (this.state.redirect !== null && this.state.redirect !== '/about') {
      return (<Redirect push to={this.state.redirect} />);
    }
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <SideBar context={this} />
          <div className={`${styles.section} ${styles.right} ${styles.about} ${styles.center}`}>

            <div
              onMouseOver={() => this.setState({hoveringClose: true})}
              onMouseOut={() => this.setState({hoveringClose: false})}
            >
              <Link to="/"><img className={styles.close} src={this.state.hoveringClose ? close : closeDefault} alt="Home" /></Link>
            </div>
              <h2>About Phinch</h2>
              <p className={styles.first}>
                PHINCH is an open-source framework for visualizing biological data, funded by a grant from the Alfred P. Sloan foundation. This project represents an interdisciplinary collaboration between Pitch Interactive, a data visualization studio in Oakland, CA, and biological researchers at UC Davis. {/* eslint-disable-line max-len */}
              </p>
              <p>
                Whether it&#39;s genes, proteins, or microbial species, Phinch provides an interactive visualization tool that allows users to explore and manipulate large biological datasets. Computer algorithms face significant difficulty in identifying simple data patterns; writing algorithms to tease out complex, subtle relationships (the type that exist in biological systems) is almost impossible. However, the human eye is adept at spotting visual patterns, able to quickly notice trends and outliers. It is this philosophy especially when presented with intuitive, well-designed software tools and user interfaces. {/* eslint-disable-line max-len */}
              </p>
              <p>
                The sheer volume of data produced from high-throughput sequencing technologies will require fundamentally different approaches and new paradigms for effective data analysis. {/* eslint-disable-line max-len */}
              </p>
              <p>
                Scientific visualization represents an innovative method towards tackling the current bottleneck in bioinformatics; in addition to giving researchers a unique approach for exploring large datasets, it stands to empower biologists with the ability to conduct powerful analyses without requiring a deep level of computational knowledge. {/* eslint-disable-line max-len */}
              </p>
              <div className={` ${styles.logos}`}>
                <img src={aps} className={styles.alogo} alt="Alfred P. Sloan Logo" />
                <img src={uga} className={styles.ugalogo} alt="University of Georgia Logo" />
                <img src={pitch} className={styles.pitchlogo} alt="Pitch Interactive Logo" />
              </div>
          </div>
        </div>
      </div>
    );
  }
}
