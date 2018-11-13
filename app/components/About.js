import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { remote } from 'electron';

import { pageView } from '../analytics.js'
import LinkList from './LinkList.js';

import styles from './Home.css';
import gstyle from './general.css';
import logo from 'images/phinch-large.png';
import close from 'images/close.svg';

import aps from 'images/aps.png';
import ucr from 'images/ucr.png';
import pitch from 'images/pitch.png';

export default class About extends Component {
    constructor(props) {
      super(props);

      pageView('/about');

      this.version = remote.app.getVersion();
      // break this out into sidebar component and import?

      this.state = {
        redirect: null,
      };
    }

    render() {
      const redirect = (this.state.redirect === null) ? '' : <Redirect push to={this.state.redirect} />;
      const links = LinkList(this);
      return (
        <div>
          <div className={styles.container} data-tid='container'>
            {redirect}
            <div className={`${styles.section} ${styles.left}`}>
              <div className={`${styles.area} ${styles.info}`}>
                <Link to='/'>
                  <img src={logo} className={styles.logo} alt='Phinch Logo' />
                </Link>
                <p>Version {this.version}</p>
              </div>
              <div className={`${styles.links} ${gstyle.exdarkbgscrollbar}`}>
                <div className={`${styles.area} ${styles.rightSpace}`}>
                  {links}
                </div>
              </div>
            </div>
            <div className={`${styles.section} ${styles.right} ${styles.about}`}>
              <div className={`${styles.section} ${styles.center} ${styles.scroll}`}>
                <h2>About Phinch</h2>
                <p className={styles.first}>
                  PHINCH is an open-source framework for visualizing biological data, funded by a grant from the Alfred P. Sloan foundation. This project represents an interdisciplinary collaboration between Pitch Interactive, a data visualization studio in Oakland, CA, and biological researchers at UC Davis.
                </p>
                <p>
                  Whether it's genes, proteins, or microbial species, Phinch provides an interactive visualization tool that allows users to explore and manipulate large biological datasets. Computer algorithms face significant difficulty in identifying simple data patterns; writing algorithms to tease out complex, subtle relationships (the type that exist in biological systems) is almost impossible. However, the human eye is adept at spotting visual patterns, able to quickly notice trends and outliers. It is this philosophy especially when presented with intuitive, well-designed software tools and user interfaces.
                </p>
                <p>
                  The sheer volume of data produced from high-throughput sequencing technologies will require fundamentally different approaches and new paradigms for effective data analysis.
                </p>
                <p>
                  Scientific visualization represents an innovative method towards tackling the current bottleneck in bioinformatics; in addition to giving researchers a unique approach for exploring large datasets, it stands to empower biologists with the ability to conduct powerful analyses without requiring a deep level of computational knowledge.
                </p>
              </div>
              <div className={`${styles.section} ${styles.logos}`}>
                <Link to='/'><img className={styles.close} src={close} alt='Home' /></Link>
                <img src={aps} className={styles.alogo} alt='Alfred P. Sloan Logo' />
                <img src={ucr} className={styles.alogo} alt='University of California Riverside Logo' />
                <img src={pitch} className={styles.alogo} alt='Pitch Interactive Logo' />
              </div>
            </div>
          </div>
        </div>
      );
    }
}
