import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import styles from './SideMenu.css';
import gstyle from './general.css';

import arrow from 'images/arrow.png';

export default class SideMenu extends Component {
  constructor(props) {
    super(props);
  }

  constructItem(l) {
    // Add condition for non-links
    if (l.link) {
      return (
        <Link key={l.id} to={l.link}>
          <div className={styles.menuItem}>
            <div className={styles.menuBox}>
              {l.icon}
            </div>
            <span className={styles.menuItemLabel}>
              {l.name}
            </span>
          </div>
        </Link>
      );
    } else {
    // } else if (l.action) {
      return (
        <div
          key={l.id}
          className={styles.menuItem}
          onClick={l.action}
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
     // else {
      // console.warn('make sure your button does something');
    // }
  }

  render() {
    const items = this.props.items.map(l => {
      return this.constructItem(l);
    });
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
    const rotation = this.props.showLeftSidebar ? styles.rotated : '';
    return (
      <div 
        className={`${gstyle.panel} ${gstyle.noscrollbar}`}
        style={{
          overflowY: 'hidden',
        }}
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
          <div className={styles.toggleSquare}></div>
          <div
            className={`${styles.menuToggle} ${rotation}`}
            onClick={this.props.toggleMenu}
          >
            <img src={arrow} alt='arrow-toggle-menu' />
          </div>
        </div>
      </div>
    );
  }
};