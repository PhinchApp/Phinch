import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import close from 'images/close.svg';
import aps from 'images/apsf-logo.png';
import uga from 'images/uga-logo@2x.png';
import pitch from 'images/pitch.png';

import { pageView } from '../analytics';
import SideBar from './SideBar';
import styles from './Home.css';
import gstyles from './general.css';

export default class About extends Component {
  constructor(props) {
    super(props);

    pageView('/about');

    this.state = { redirect: null };
  }

  render() {
    if (this.state.redirect !== null && this.state.redirect !== '/about') {
      return <Redirect push to={this.state.redirect} />;
    }
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <SideBar context={this} />
          <div className={`${styles.section} ${styles.right} ${styles.about} ${styles.center}`}>
            
            <div> 
              <Link to="/"><img className={styles.close} src={close} alt="Home" /></Link>
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
              <div className={`${styles.section} ${styles.bottom} ${styles.logos}`}>
                <img src={aps} className={styles.alogo} alt="Alfred P. Sloan Logo" />
                <img src={uga} className={styles.alogo} alt="University of Georgia Logo" />
                <img src={pitch} className={styles.alogo} alt="Pitch Interactive Logo" />
              </div>
          </div>
        </div>
      </div>
    );
  }
}
