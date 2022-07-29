import React, { useState } from 'react';
import Spotlight from "rc-spotlight";
import { remote } from 'electron';

import SpotlightWithToolTip from './SpotlightWithToolTip';

import logo from 'images/phinch.svg';
import arrow from 'images/arrow.svg';
import helpGo from 'images/needHelpHP.svg';
import helpHover from 'images/needHelpHover.svg';
import helpStop from 'images/needHelpStop.svg';

import help1 from 'images/help1.svg';
import help1Hover from 'images/help1Hover.svg';
import help2 from 'images/help2.svg';
import help2Hover from 'images/help2Hover.svg';
import help3 from 'images/help3.svg';
import help3Hover from 'images/help3Hover.svg';
import help4 from 'images/help4.svg';
import help4Hover from 'images/help4Hover.svg';
import needHelpHP from 'images/needHelpHP.svg';
import needHelpHover from 'images/needHelpHover.svg';

import LinkList from './LinkList';

import styles from './Home.css';
import gstyle from './general.css';
import { stackOffsetSilhouette } from 'd3';
import { findLastKey } from 'lodash-es';

export default function SideBar(props) {
  const {inAboutPage} = props
  const version = remote.app.getVersion();
  const links = LinkList(props.context);
  const helpIcon = props.context.state.helpIcon;
  const help1Icon = help1;
  const help2Icon = null;
  const help3Icon = null;
  const help4Icon = null;

  const [helpHovered, setHelpHovered] = useState(false);

  // /*This function deals with when the mouse hovers over the edit icon on top right of
  // the home screen and changes img src accordingly to correct svg file */
  // function handleMouseOver (icon) {
  //   switch(icon){
  //     case "needHelp":
  //       props.context.setState({helping: !props.context.state.helping});
  //       break;
  //   }
  // }

  // /*This function deals with the mouse leaving an icon (no longer hovering) and
  // changed img src to correct svg file */
  // function handleMouseLeave (icon) {
  //   switch(icon){
  //     case "needHelp":
  //       props.context.setState({helping: !props.context.state.helping});
  //       break;
  //   }
  // }

  const hideStep2 = inAboutPage
  const hideStep3 = inAboutPage
  const hideStep4 = inAboutPage || (props.context.state.projects && props.context.state.projects.length === 1)

  let helpButtons = null;
  if(props.context.state.helping) {
    helpButtons = (
      <div className={styles.helpIcons}>
        <div
          role="button"
          tabIndex={0}
          className={styles.helpIcons}
          onClick={() => props.context.setState({ help1: !props.context.state.help1,
                                                  help2: false,
                                                  help3: false,
                                                  help4: false})}
          //onMouseEnter={() => handleMouseOver("help1")}
          //onMouseLeave={() => handleMouseLeave("help1")}
        >
          <img src={props.context.state.help1 ? help1Hover : help1} alt="help1" />
        </div>
        {hideStep2 ? null : <div
          role="button"
          tabIndex={0}
          className={styles.helpIcons}
          onClick={() => props.context.setState({
            help1: false,
            help2: !props.context.state.help2,
            help3: false,
            help4: false})}
          //onMouseEnter={() => handleMouseOver("help2")}
          //onMouseLeave={() => handleMouseLeave("help2")}
        >
          <img src={props.context.state.help2 ? help2Hover : help2} alt="help2" />
        </div>}
        {hideStep3 ? null : <div
          role="button"
          tabIndex={0}
          className={styles.helpIcons}
          onClick={() => props.context.setState({
            help1: false,
            help2: false,
            help3: !props.context.state.help3,
            help4: false})}
          //onMouseEnter={() => handleMouseOver("help3")}
          //onMouseLeave={() => handleMouseLeave("help3")}
        >
          <img src={props.context.state.help3 ? help3Hover : help3} alt="help3" />
        </div>}
        {hideStep4 ? null :
          <div
            role="button"
            tabIndex={0}
            className={styles.helpIcons}
            onClick={() => props.context.setState({
              help1: false,
              help2: false,
              help3: false,
              help4: !props.context.state.help4})}
            //onMouseEnter={() => handleMouseOver("help4")}
            //onMouseLeave={() => handleMouseLeave("help4")}
          >
            <img src={props.context.state.help4 ? help4Hover : help4} alt="help4" />
          </div>
        }
      </div>
    );
  }
  return (
    <div className={`${styles.section} ${styles.left}`}>
      <div className={`${styles.area} ${styles.info}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => props.context.setState({ redirect: '/' })}
          onKeyPress={e => (e.key === ' ' ? props.context.setState({ redirect: '/' }) : null)}
        >
          <img
            src={logo}
            className={styles.logo}
            alt="Phinch Logo"
          />
          <p>Version {version}</p>
          {/* Possible change wording of linke to "Download 2.0.3 Here" as clicking does not actually download it automatically (Yet). */}
          <p className={styles.vUpdate}>A newer version is available. <a href="{https://github.com/PhinchApp/Phinch.git}">{'Download 2.0.3'}</a></p>
        </div>
      </div>
      <div className={`${styles.links} ${gstyle.exdarkbgscrollbar}`}>
        <div className={`${styles.area} ${styles.rightSpace}`} style={{ marginTop: '-1em', paddingLeft: '1em'}}>
          <SpotlightWithToolTip
            isActive={props.context.state.help1}
            inheritParentBackgroundColor
            toolTipPlacement="right"
            toolTipTitle={"Find a software bug or need help?\r\n Click these links to access our tutorials,\r\n community resources, and Github issue tracker."}
            overlayStyle={{zIndex: '1001'}}
            >
            {links}
          </SpotlightWithToolTip>
        </div>
      </div>
      <div className={` ${styles.bottomLeft}`}>
        <Spotlight isActive = {props.context.state.helping} inheritParentBackgroundColor={false} backdropOpacity='0.7' backdropColor='#2D2F31'>
          <div
              role="button"
              tabIndex={0}
              className={styles.help}
              onClick={() => props.context.setState({
                helping: !props.context.state.helping,
                help1: !props.context.state.helping,
                help2: false,
                help3: false,
                help4: false})}

            >
              <img
                onMouseOver={() => setHelpHovered(true)}
                onMouseLeave={() => setHelpHovered(false)}

                style={{ cursor: 'pointer'}}
                src={props.context.state.helping ? helpStop : helpHovered ? helpHover : helpGo } alt="help" />
          </div>
          {helpButtons}
        </Spotlight>
      </div>
    </div>
  );
}

