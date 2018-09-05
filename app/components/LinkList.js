import React from 'react';
import { Link } from 'react-router-dom';

import styles from './LinkList.css';
import arrow from 'images/arrow.png';

const linkList = [
  {
    name: 'New to Phinch?',
    slug: '/',
    info: 'Get started with these tutorials',
  },
  {
    name: 'View our Gallery',
    slug: '/',
    info: 'See what other researchers have created with Phinch.',
  },
  {
    name: 'Join the Community',
    slug: '/',
    info: 'Discuss features and get the latest update feeds.',
  },
  {
    name: 'About Phinch',
    slug: '/',
    info: 'What is this all about anyway?',
  },
];

const icon = (<div className={styles.arrow}><img src={arrow} alt='right facing arrow' /></div>);

const InfoLink = (l,i) => {
  return (
    <Link key={`${l.slug}-${i}`} to={l.slug}>
      <div className={styles.link}>
        {icon}
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
