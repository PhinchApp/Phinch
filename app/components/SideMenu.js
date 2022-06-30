import React, { Component } from 'react';
import ReactDOM, { render } from 'react-dom';

import arrow from 'images/arrow.svg';
import arrowHover from 'images/arrowHover.svg';

import styles from './SideMenu.css';
import gstyle from './general.css';
import { documentElement } from 'min-document';
import { element } from 'prop-types';
import { fix } from 'prelude-ls';


// This function is in need of work to get hover features working.
// Issues seem to be revoliving around the constructItem function not being
// able to read mouse position or having access to that info in the rendering of
// the JSX element. ReactDOM and possible React version updates to allow use of
// React useCases would be a possible fix.
// function constructItem(l) {
//   return (l.id === 'back') ? (
//     <div
//     key={l.id}
//     role="button"
//     tabIndex={0}
//     className={styles.menuItem}
//     onClick={l.action}
//     onKeyDown={e => (e.key === ' ' ? l.action() : null)}
//     onMouseEnter={() => l.handleMouseOver()}
//     onMouseLeave={() => l.handleMouseLeave()}
//     >
//       <div className={styles.menuBox}>
//         {l.icon}
//       </div>
//       <span className={styles.menuItemLabel}>
//         {l.name}
//       </span>
//     </div>
//   ) : (
//     <div
//     key={l.id}
//     role="button"
//     tabIndex={0}
//     className={styles.menuItem}
//     onClick={l.action}
//     onKeyDown={e => (e.key === ' ' ? l.action() : null)}
//     >
//       <div className={styles.menuBox}>
//         {l.icon}
//       </div>
//       <span className={styles.menuItemLabel}>
//         {l.name}
//       </span>
//     </div>
//   );
// }

export default class SideMenu extends Component {
  constructor(props) {
    super(props);
      this.state = {
        sideMenuToggle: arrow,
      };
  }

  constructItem = (l) => {
    return (l.id == "back") ? (
    <div
    key={l.id}
    role="button"
    tabIndex={0}
    className={styles.menuItem}
    onClick={l.action}
    onKeyDown={e => (e.key === ' ' ? l.action() : null)}
    >
        <div
        className={`${styles.menuBox} ${styles.newProject}`}>
        {l.icon}
      </div>
      <span className={styles.menuItemLabel}>
        {l.name}
      </span>
    </div>
  ) : (
    <div
    key={l.id}
    role="button"
    tabIndex={0}
    className={styles.menuItem}
    onClick={l.action}
    onKeyDown={e => (e.key === ' ' ? l.action() : null)}
    >
        <div
        className={`${styles.menuBox}`}>
        {l.icon}
      </div>
      <span className={styles.menuItemLabel}>
        {l.name}
      </span>
    </div>
  );
}

  /*This function deals with when the mouse hovers over the edit icon on top right of
  the home screen and changes img src accordingly to correct svg file */
  handleMouseOver () {
    if(this.state.sideMenuToggle === arrow) {
      this.setState({ sideMenuToggle: arrowHover });
    }
  }

  /*This function deals with the mouse leaving an icon (no longer hovering) and
  changed img src to correct svg file */
  handleMouseLeave () {
    if(this.state.sideMenuToggle === arrowHover) {
      this.setState({ sideMenuToggle: arrow });
    }
  }

  render() {
    const items = this.props.items.map((l) => this.constructItem(l));
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
            borderLeft: '6px solid #575A5C',
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
              onMouseEnter={() => this.handleMouseOver()}
              onMouseLeave={() => this.handleMouseLeave()}
            >
              <img src={this.state.sideMenuToggle} alt="arrow-toggle-menu" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
