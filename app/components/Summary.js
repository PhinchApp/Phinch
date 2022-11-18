import React, { Component } from 'react';
import SpotlightWithToolTip from './SpotlightWithToolTip';

import styles from './Summary.css';

export default class StackedBar extends Component {
  render() {
    this.props.summary.size = this.props.summary.size || 0;
    this.props.summary.samples = this.props.summary.samples || 0;
    this.props.summary.observations = this.props.summary.observations || 0;
    return (
      <SpotlightWithToolTip
        isActive={this.props.helping}
        toolTipPlacement="bottomRight"
        toolTipTitle={<div>
          On the top right corner, there is an overview information about the data file uploaded.
          <br /><br />
          ‘Observations’ refer to the data points in the uploaded sample matrix.{' '}
           These will vary by file, but typically represent data such as{' '}
           OTUs/ASVs or gene contigs. The ‘observation’ number reflects the{' '}
           overall count in the filter page window after the end user has{' '}
           manipulated the list of samples and applied any filters in the left{' '}
           hand pane. Only the ‘Observations’ remaining in the filter page will{' '}
            be carried through to the Phinch data visualizations. ‘Total’{' '}
            reflects the original counts in the uploaded file, and this number{' '}
            will not change during filtering.
            </div>}
        style={{ boxShadow: 'inset rgba(255, 255, 255, 0.5) 0px 0px 10px'}}
      >
        <div className={styles.info}>
          <div className={styles.segment}>
            <div className={`${styles.file} ${styles.summary}`}>
              {this.props.summary.name} ({this.props.summary.size})
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.segment}>
              <div className={`${styles.label} ${styles.summary}`}>Observations</div>
              <div className={`${styles.number} ${styles.summary}`}>
                {this.props.observations.toLocaleString()}
              </div>
              <div className={`${styles.label} ${styles.summary}`}>TOTAL</div>
              <div className={`${styles.number} ${styles.summary}`}>
                {this.props.summary.observations.toLocaleString()}
              </div>
            </div>
            <div className={styles.segment}>
              <div className={`${styles.label} ${styles.summary}`}>Selected Samples</div>
              <div className={`${styles.number} ${styles.summary}`}>
                {`${this.props.datalength.toLocaleString()}`}
              </div>
              <div className={`${styles.label} ${styles.summary}`}>TOTAL</div>
              <div className={`${styles.number} ${styles.summary}`}>
                {`${this.props.summary.samples.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>
      </SpotlightWithToolTip>
    );
  }
}
