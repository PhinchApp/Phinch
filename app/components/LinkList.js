import { shell } from 'electron';
import React from 'react';
import { Link } from 'react-router-dom';

import styles from './LinkList.css';
import arrow from 'images/arrow.png';

const linkList = [
  {
    name: 'New to Phinch?',
    action: (context) => { context.setState({ redirect: '/' }) },
    info: 'Get started with these tutorials',
  },
  {
    name: 'View our Gallery',
    action: (context) => { context.setState({ redirect: '/' }) },
    info: 'See what other researchers have created with Phinch.',
  },
  {
    name: 'Join the Community',
    action: (context) => { shell.openExternal('https://github.com/PhinchApp/Phinch') },
    info: 'Discuss features and get the latest update feeds.',
  },
  {
    name: 'About Phinch',
    action: (context) => { context.setState({ redirect: '/about' }) },
    info: 'What is this all about anyway?',
  },
];

const icon = (<div className={styles.arrow}><img src={arrow} alt='right facing arrow' /></div>);

const InfoLink = (l, i, context) => {
  return (
    // <Link key={`${l.slug}-${i}`} to={l.slug}>
      <div key={`${l.action}-${i}`} className={styles.link} onClick={() => { l.action(context) }}>
        {icon}
        <div className={styles.info}>
          <h2>{l.name}</h2>
          <p>{l.info}</p>
        </div>
      </div>
    // </Link>
  );
}

const LinkList = (context) => {
  const links = linkList.map((l, i) => {
    return InfoLink(l, i, context);
  });
  return (
    <div>
      {links}
    </div>
  );
}

export default LinkList;
