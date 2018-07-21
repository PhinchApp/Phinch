import React, { Component } from 'react';

import styles from './Modal.css';
import gstyle from './general.css';

export default class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showHidden: false,
    };
    this.toggleHidden = this.toggleHidden.bind(this);
  }

  toggleHidden() {
    const showHidden = !this.state.showHidden;
    this.setState({showHidden});
  }

  render() {
    const rotation = this.state.showHidden ? (
        -180 + this.props.rotation
      ) : (
        0 + this.props.rotation
      );
    const button = this.props.data.length ? (
        <div
          className={`${gstyle.heading} ${styles.toggle}`}
          style={{
            ...this.props.buttonPosition,
          }}
          onClick={this.toggleHidden}
        >
          {this.props.title} <div className={gstyle.arrow} style={{transform: `rotate(${rotation}deg)`}}>⌃</div>
        </div>
      ) : '';
    const modal = (this.state.showHidden && this.props.data.length) ? (
        <div
          className={styles.modal}
          style={{
            ...this.props.modalPosition,
          }}
        >
          <div className={styles.title}>{this.props.title}</div>
          <div className={styles.dataContainer}>
            {this.props.data}
          </div>
        </div>
      ) : '';
    return (
      <div style={{display: 'inline-block'}}>
        {modal}
        {button}
      </div>
    );
  }
}
