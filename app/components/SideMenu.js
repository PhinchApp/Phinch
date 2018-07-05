import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import styles from './SideMenu.css';
import gstyle from './general.css';

export default class SideMenu extends Component {
  constructor(props) {
    super(props);
  }

  constructItem(l) {
    // Add condition for non-links
    return (
      <Link key={l.id} to={l.link}>
        <div className={styles.menuItem}>
          <div className={styles.menuBox}>
            {l.icon}
          </div>
          {l.name}
        </div>
      </Link>
    );
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
    const arrow = this.props.showLeftSidebar ? '<-' : '->';
    return (
      <div
        className={gstyle.panel}
        style={{
          width: this.props.leftSidebar,
          height: this.props.chartHeight,
        }}
      >
        {menuItems}
        <div
          className={gstyle.panel}
          style={{
            width: this.props.leftMin,
            height: this.props.chartHeight,
          }}
        >
          <div className={styles.toggleSquare}></div>
          <div
            className={styles.menuToggle}
            onClick={this.props.toggleMenu}
          >
            {arrow}
          </div>
        </div>
      </div>
    );
  }
};