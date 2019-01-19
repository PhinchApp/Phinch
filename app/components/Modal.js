import React, { Component } from 'react';
import { FixedSizeList as List } from 'react-window';

import close from 'images/close.svg';

import styles from './Modal.css';
import gstyle from './general.css';

export default class Modal extends Component {
  constructor(props) {
    super(props);
    const showHidden = props.show ? props.show : false;
    this.state = { showHidden };
    this.toggleHidden = this.toggleHidden.bind(this);
  }

  toggleHidden() {
    const showHidden = !this.state.showHidden;
    this.setState({ showHidden }, this.props.onHide);
  }

  stackRow = ({ index, style }) => this.props.row(this.props.data[index], index, style.top, true);

  render() {
    const shownClass = this.state.showHidden ? styles.shown : '';
    const button = this.props.data.length ? (
      <div
        role="button"
        tabIndex={0}
        className={`${gstyle.heading} ${styles.toggle} ${shownClass}`}
        style={{
          ...this.props.buttonPosition,
        }}
        onClick={this.toggleHidden}
        onKeyPress={e => (e.key === ' ' ? this.toggleHidden() : null)}
      >
        {this.props.buttonTitle}
      </div>
    ) : '';
    const badge = (this.props.badge && this.props.data.length) ? (
      <div
        className={styles.badge}
        style={{
          ...this.props.buttonPosition
        }}
      >
        {this.props.data.length}
      </div>
    ) : '';
    const modal = (this.state.showHidden && this.props.data.length) ? (
      <div
        className={styles.modal}
        style={{
          ...this.props.modalPosition,
        }}
      >
        <div className={styles.title}>
          {this.props.modalTitle}
          <div
            role="button"
            tabIndex={0}
            className={gstyle.close}
            style={{
              ...this.props.closePosition
            }}
            onClick={this.toggleHidden}
            onKeyPress={e => (e.key === ' ' ? this.toggleHidden() : null)}
          >
            <img src={close} alt="close" />
          </div>
        </div>
        {
          this.props.useList ? (
            <List
              className={`${styles.dataContainer} ${gstyle.darkbgscrollbar}`}
              innerElementType={this.props.svgContainer ? 'svg' : 'div'}
              height={314}
              itemSize={this.props.itemHeight}
              itemCount={this.props.data.length}
              itemKey={index => this.props.data[index][this.props.dataKey]}
            >
              {this.stackRow}
            </List>
          ) : (
            <div className={`${styles.dataContainer} ${gstyle.darkbgscrollbar}`}>
              {
                this.props.svgContainer ? (
                  <svg height={this.props.svgHeight}>
                    {this.props.data}
                  </svg>
                ) : this.props.data
              }
            </div>
          )
        }
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
