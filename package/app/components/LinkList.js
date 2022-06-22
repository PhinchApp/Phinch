import { shell } from 'electron';
import React, { MouseEventHandler, MouseEvent} from 'react';

import styles from './LinkList.css';

const linkList = [
  {
    name: 'New to Phinch?',
    icon: (context) => (<div className={styles.arrow}><img src={context.state.link1} alt="right facing arrow" /></div> ),
    action: () => { shell.openExternal('http://phinch.org/Tutorials'); },
    info: 'Click here for data formatting instructions and visualization tutorials.',
    handleMouseOver: (context) => { context.handleMouseOver('New to Phinch?'); },
    handleMouseLeave: (context) => { context.handleMouseLeave('New to Phinch?'); },
  },
  {
    name: 'View our Flagship Datasets',
    icon: (context) => (<div className={styles.arrow}><img src={context.state.link2} alt="right facing arrow" /></div>),
    action: () => { shell.openExternal('https://github.com/PhinchApp/Phinch/wiki/Tutorials'); },
    info: 'Download and explore datasets from published research studies.',
    handleMouseOver: (context) => { context.handleMouseOver('View our Flagship Datasets'); },
    handleMouseLeave: (context) => { context.handleMouseLeave('View our Flagship Datasets'); },
  },
  {
    name: 'Join the Community',
    icon: (context) => (<div className={styles.arrow}><img src={context.state.link3} alt="right facing arrow" /></div>),
    action: () => { shell.openExternal('http://phinch.org/Community'); },
    info: 'Join our Slack channel to discuss features and get help.',
    handleMouseOver: (context) => { context.handleMouseOver('Join the Community'); },
    handleMouseLeave: (context) => { context.handleMouseLeave('Join the Community'); },
  },
  {
    name: 'About Phinch',
    icon: (context) => (<div className={styles.arrow}><img src={context.state.link4} alt="right facing arrow" /></div>),
    action: (context) => { context.setState({ redirect: '/about' }); },
    info: 'Click here for more information about Phinch and our project team.',
    handleMouseOver: (context) => { context.handleMouseOver('About Phinch'); },
    handleMouseLeave: (context) => { context.handleMouseLeave('About Phinch'); },
  },
  {
    name: 'Find a software issue?',
    icon: (context) => (<div className={styles.arrow}><img src={context.state.link5} alt="right facing arrow" /></div>),
    action: () => { shell.openExternal('https://github.com/PhinchApp/Phinch/issues' ); },
    info: 'Report software bugs and errors on our Github issue tracker.',
    handleMouseOver: (context) => { context.handleMouseOver('Find a software issue?'); },
    handleMouseLeave: (context) => { context.handleMouseLeave('Find a software issue?'); },
  },
];


function InfoLink(l, i, context) {

  return (
    <div
      key={`${l.action}-${i}`}
      role="button"
      tabIndex={0}
      className={styles.link}
      onClick={() => l.action(context)}
      onKeyPress={e => (e.key === ' ' ? l.action(context) : null)}
      onMouseEnter={() => l.handleMouseOver(context)}
      onMouseLeave={() => l.handleMouseLeave(context)}
    >
      {l.icon(context)}
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
