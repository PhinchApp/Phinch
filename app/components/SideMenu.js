import React, { Component } from 'react';

import arrow from 'images/arrow.svg';

import styles from './SideMenu.css';
import gstyle from './general.css';

function constructItem(l) {
  return (
    <div
      key={l.id}
      role="button"
      tabIndex={0}
      className={styles.menuItem}
      onClick={l.action}
      onKeyDown={e => (e.key === ' ' ? l.action() : null)}
    >
      <div className={styles.menuBox}>
        {l.icon}
      </div>
      <span className={styles.menuItemLabel}>
        {l.name}
      </span>
    </div>
  );
}

export default class SideMenu extends Component {
  render() {
    const items = this.props.items.map(l => constructItem(l));
    const menuItems = this.props.showLeftSidebar ? (
      <div
        className={`${gstyle.panel} ${styles.menu}`}
        style={{
          width: (this.props.leftSidebar - this.props.leftMin),
          height: this.props.chartHeight,
        }}
      >
        {items}
      </div>
    ) : '';
    return (
      <div
        className={`${gstyle.panel} ${gstyle.noscrollbar}`}
        style={{ overflowY: 'hidden' }}
      >
        {menuItems}
        <div
          className={`${gstyle.panel} ${gstyle.noscrollbar}`}
          style={{
            backgroundColor: '#ffffff',
            borderLeft: '6px solid #333333',
            width: this.props.leftMin,
            height: this.props.chartHeight,
            overflowY: 'hidden',
          }}
        >
          <div style={{ display: this.props.hideToggle ? 'none' : 'inline-block' }}>
            <div className={styles.toggleSquare} />
            <div
              role="button"
              tabIndex={0}
              className={`${styles.menuToggle}`}
              onClick={this.props.toggleMenu}
              onKeyPress={e => (e.key === ' ' ? this.props.toggleMenu() : null)}
            >
              <img src={arrow} alt="arrow-toggle-menu" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
