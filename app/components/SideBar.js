import React from 'react';

import { remote } from 'electron';

import logo from 'images/phinch.svg';

import LinkList from './LinkList';

import styles from './Home.css';
import gstyle from './general.css';

export default function SideBar(props) {
  const version = remote.app.getVersion();
  const links = LinkList(props.context);
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
          <p>A newer version is available. <a href="{https://github.com/PhinchApp/Phinch.git}">{'Download 2.0.3'}</a></p>
        </div>
      </div>
      <div className={`${styles.links} ${gstyle.exdarkbgscrollbar}`}>
        <div className={`${styles.area} ${styles.rightSpace}`}>
          {links}
        </div>
      </div>
    </div>
  );
}

