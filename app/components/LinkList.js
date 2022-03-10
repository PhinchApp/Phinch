import { shell } from 'electron';
import React from 'react';

import arrow from 'images/arrow.svg';
import styles from './LinkList.css';

const linkList = [
  {
    name: 'New to Phinch?',
    action: () => { shell.openExternal('http://phinch.org/Tutorials'); },
    info: 'Click here for data formatting instructions and visualization tutorials.',
  },
  {
    name: 'View our Flagship Datasets',
    action: () => { shell.openExternal('https://github.com/PhinchApp/Phinch/wiki/Tutorials'); },
    info: 'Download and explore datasets from published research studies.',
  },
  {
    name: 'Join the Community',
    action: () => { shell.openExternal('http://phinch.org/Community'); },
    info: 'Join our Slack channel to discuss features and get help.',
  },
  {
    name: 'About Phinch',
    action: (context) => { context.setState({ redirect: '/about' }); },
    info: 'Click here for more information about Phinch and our project team.',
  },
  {
    name: 'Find a software issue?',
    action: (context) => { context.setState({ redirect: 'https://github.com/PhinchApp/Phinch/issues' }); },
    info: 'Report software bugs and errors on our Github issue tracker.',
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
      onKeyPress={e => (e.key === ' ' ? l.action(context) : null)}
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
