import React, { Component } from 'react';
import { FixedSizeList as List } from 'react-window';
import SpotlightWithToolTip from './SpotlightWithToolTip';

import close from 'images/orangeX.svg';

import styles from './Modal.css';
import gstyle from './general.css';

export default class Modal extends Component {
  constructor(props) {
    super(props);
    const showHidden = props.show || props.spotlight ? props.show : false;
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
    ) : <div />;
    const badge = (this.props.badge && this.props.data.length) ? (
      <div
        className={styles.badge}
        style={{
          ...this.props.buttonPosition
        }}
      >
        {this.props.data.length}
      </div>
    ) : <div />;
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
    ) : <div />;
    return (
    <div
        style={{
          display: 'inline-block',
          verticalAlign: 'top',
        }}
      >
        <SpotlightWithToolTip
          isActive={this.props.spotlight && this.state.showHidden}
          toolTipPlacement="topLeft"
          toolTipTitle={<div>
            “Archived Samples” show a list of samples that have been manually{' '}
            removed by the user. These samples will not be carried through to the{' '}
            visualization galleries.
            <br /><br />
            To add these samples back to the main filter page list{' '}
            (and regain the ability to visualize these data), hover on a{' '}
            sample and click the “rejoin” button on the right hand side.
            <br /><br />
            The “Archived Samples” tab not be visible in the filter page{' '}
            window unless you choose to remove samples from the main list{' '}
            using the “X” button. </div>
            }
          overlayStyle={{maxWidth: "700px",}}
            >
          {modal}
          {badge}
          {button}
        </SpotlightWithToolTip>
      </div>
    );
  }
}
