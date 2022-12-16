import React, { Component } from 'react';
import ReactDOM, { render } from 'react-dom';

import SpotlightWithToolTip from './SpotlightWithToolTip';

import sideMenuToggle from 'images/sideMenuToggleOpen.svg';
import sideMenuToggleClose from 'images/sideMenuToggleClose.svg';
import sideMenuToggleHover from 'images/sideMenuToggleOpenHover.svg';
import sideMenuToggleCloseHover from 'images/sideMenuToggleCloseHover.svg';


import styles from './SideMenu.css';
import gstyle from './general.css';
import { documentElement } from 'min-document';
import { element } from 'prop-types';
import { fix } from 'prelude-ls';

const defaultHelpText = <React.Fragment>
  Expand the side panel by clicking the menu button.{' '}
  After expanding the panel, you will see a button to{' '}
  save the data and another button to go back to the app homepage.
</React.Fragment>
export default class SideMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sideMenuToggle: sideMenuToggle,
      closeMenu: sideMenuToggleClose,
    };
  }

  // This function is in need of work to get hover features working.
  // Issues seem to be revoliving around the constructItem function not being
  // able to read mouse position or having access to that info in the rendering of
  // the JSX element. ReactDOM and possible React version updates to allow use of
  // React useCases would be a possible fix.
  constructItem = (l) => {
    if(l.id == "save") {
      return (
        <div
        key={l.id}
        role="button"
        tabIndex={0}
        className={styles.menuItem}
        onClick={l.action}
        onKeyDown={e => (e.key === ' ' ? l.action() : null)}
        >
          <div
          className={`${styles.menuBox} ${styles.Filter}`}>
            {/* done need image here as save is always highlighted */}
          </div>
          <span className={styles.menuItemLabel}>
            {l.name}
          </span>
        </div>
      );
    }

    if(l.id == "export") {
      return (
        <div
        key={l.id}
        role="button"
        tabIndex={0}
        className={styles.menuItem}
        onClick={l.action}
        onKeyDown={e => (e.key === ' ' ? l.action() : null)}
        >
          <div
          className={`${styles.menuBox} ${styles.stackedBar}`}>
            {l.icon}
          </div>
          <span className={styles.menuItemLabel}>
            {l.name}
          </span>
        </div>
      );
    }

    return (l.id == "back" || 'filter') ? (
    <div
    key={l.id}
    role="button"
    tabIndex={0}
    className={styles.menuItem}
    onClick={l.action}
    onKeyDown={e => (e.key === ' ' ? l.action() : null)}
    >
        <div className={`${styles.menuBox} ${styles.newProject}`}>
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
    if(this.state.sideMenuToggle === sideMenuToggle) {
      this.setState({ sideMenuToggle: sideMenuToggleHover });
      this.setState({ closeMenu: sideMenuToggleCloseHover});
    }
  }

  /*This function deals with the mouse leaving an icon (no longer hovering) and
  changed img src to correct svg file */
  handleMouseLeave () {
    // if(this.state.sideMenuToggle === sideMenuToggleHover) {
    //   this.setState({ sideMenuToggle: sideMenuToggle });
    //   this.setState({ closeMenu: sideMenuToggleClose });
    // }
  }

  render() {
    const items = this.props.items.map((l) => this.constructItem(l));
    const menuItems = this.props.showLeftSidebar ? (
      <div
        className={`${gstyle.panel} ${styles.menu}`}
        style={{
          width: `calc(${this.props.leftSidebar - this.props.leftMin}px ${this.props.spotlight ? '- 0.2em' : ''})`,
          height: this.props.spotlight ? 160 :this.props.chartHeight,
          margin: this.props.spotlight ? '0.1em' : null,
          minWidth: this.props.spotlight ? '0' : null,
          overflow: this.props.spotlight ? 'hidden' : null,
        }}
      >
        {items}
      </div>
    ) : <div />;
    return (
      <div
        className={`${gstyle.panel} ${gstyle.noscrollbar}`}
        style={{ overflowY: 'hidden' }}
      >
        <SpotlightWithToolTip
          isActive={this.props.spotlight}
          >
          {menuItems}
        </SpotlightWithToolTip>
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
            <SpotlightWithToolTip
              isActive={this.props.spotlight}
              toolTipPlacement="rightTop"
              toolTipTitle={<div>
                {this.props.helpText || defaultHelpText}
                </div>}
              style={{
                position: 'fixed',
                transform: 'translateY(-1.5em)'
              }}
              >
              <div
                role="button"
                tabIndex={0}
                className={`${styles.menuToggle} ${this.props.showLeftSidebar ? styles.closeMenu : styles.openMenu}`}
                onClick={this.props.toggleMenu}
                onKeyPress={e => (e.key === ' ' ? this.props.toggleMenu() : null)}
                onMouseEnter={() => this.handleMouseOver()}
                onMouseLeave={() => this.handleMouseLeave()}
              >
                {/* {this.props.showLeftSidebar ? <img src={this.state.closeMenu} alt="arrow-toggle-menu-hover" />
                : <img src={this.state.sideMenuToggle} alt="arrow-toggle-menu" />} */}
              </div>
            </SpotlightWithToolTip>
          </div>
        </div>
      </div>
    );
  }
}
