import { shell } from 'electron';
import React from 'react';

import arrow from 'images/arrow.svg';
import styles from './LinkList.css';

const linkList = [
  {
    name: 'New to Phinch?',
    action: (context) => { context.setState({ redirect: '/' }); },
    info: 'Get started with these tutorials',
  },
  {
    name: 'View our Gallery',
    action: (context) => { context.setState({ redirect: '/' }); },
    info: 'See what other researchers have created with Phinch.',
  },
  {
    name: 'Join the Community',
    action: () => { shell.openExternal('https://github.com/PhinchApp/Phinch'); },
    info: 'Discuss features and get the latest update feeds.',
  },
  {
    name: 'About Phinch',
    action: (context) => { context.setState({ redirect: '/about' }); },
    info: 'What is this all about anyway?',
  },
];

const icon = (<div className={styles.arrow}><img src={arrow} alt="right facing arrow" /></div>);

function InfoLink(l, i, context) {
  return (
    <div
      key={`${l.action}-${i}`}
      role="button"
      tabIndex={0}
      className={styles.link}
      onClick={() => l.action(context)}
      onKeyPress={e => e.key === ' ' ? l.action(context) : null}
    >
      {icon}
      <div className={styles.info}>
        <h2>{l.name}</h2>
        <p>{l.info}</p>
      </div>
    </div>
  );
}

export default function LinkList(context) {
  const links = linkList.map((l, i) => InfoLink(l, i, context));
  return (
    <div>
      {links}
    </div>
  );
}
