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
          onKeyDown={() => props.context.setState({ redirect: '/' })}
        >
          <img
            src={logo}
            className={styles.logo}
            alt="Phinch Logo"
          />
        </div>
        <p>Version {version}</p>
      </div>
      <div className={`${styles.links} ${gstyle.exdarkbgscrollbar}`}>
        <div className={`${styles.area} ${styles.rightSpace}`}>
          {links}
        </div>
      </div>
    </div>
  );
}
