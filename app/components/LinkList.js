import React from 'react';
import { Link } from 'react-router-dom';

import styles from './LinkList.css';

const linkList = [
  {
    name: 'New to Phinch?',
    slug: 'counter',
    info: 'Get started with these tutorials',
    icon: '',
  },
  {
    name: 'View our Gallery',
    slug: 'counter',
    info: 'See what other researchers have creeated with Phinch.',
    icon: '',
  },
  {
    name: 'Join the Community',
    slug: 'counter',
    info: 'Discuss features and get the latest update feeds.',
    icon: '',
  },
  {
    name: 'About Phinch',
    slug: 'counter',
    info: 'What is this all about anyway?',
    icon: '',
  },
];

const InfoLink = (l,i) => {
  return (
    <Link key={`${l.slug}-${i}`} to={l.slug}>
      <div className={styles.link}>
        <img src={l.icon} alt='' />
        <div className={styles.info}>
          <h2>{l.name}</h2>
          <p>{l.info}</p>
        </div>
      </div>
    </Link>
  );
}

const LinkList = () => {
  const links = linkList.map((l,i) => {
    return InfoLink(l,i);
  });
  return (
    <div>
      {links}
    </div>
  );
}

export default LinkList;
