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
    const shownClass = this.state.showHidden ? styles.shown : '';
    const button = this.props.data.length ? (
        <div
          className={`${gstyle.heading} ${styles.toggle} ${shownClass}`}
          style={{
            ...this.props.buttonPosition,
          }}
          onClick={this.toggleHidden}
        >
          {this.props.title}
        </div>
      ) : '';
    const badge = (this.props.badge && this.props.data.length) ? (
        <div
          className={styles.badge}
          style={{
            ...this.props.buttonPosition,
          }}
        >{this.props.data.length}</div>
      ) : '';
    const modal = (this.state.showHidden && this.props.data.length) ? (
        <div
          className={styles.modal}
          style={{
            ...this.props.modalPosition,
          }}
        >
          <div className={styles.title}>
            {this.props.title}
            <div
              className={gstyle.close}
              onClick={() => { this.toggleHidden() }}
            >x</div>
          </div>
          <div className={`${styles.dataContainer} ${gstyle.darkbgscrollbar}`}>
            {this.props.data}
          </div>
        </div>
      ) : '';
    return (
      <div
        style={{
          display: 'inline-block',
          verticalAlign: 'top',
        }}
      >
        {modal}
        {button}
        {badge}
      </div>
    );
  }
}
