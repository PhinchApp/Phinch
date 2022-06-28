import React, { Component } from 'react';
import Spotlight from 'rc-spotlight';

import SpotlightWithToolTip from './SpotlightWithToolTip';

import styles from './ProjectList.css';

import removeIcon from '../images/remove.svg';
import fsIcon from 'images/flagshipIcons.png';

function ProjectThumb(props) {
  const isNew = props.project.slug === 'newproject';
  const remove = (props.editing && !isNew) ? (
    <div
      className={`${styles.remove}`}
      role="button"
      tabIndex={0}
      onClick={() => props.remove(props.project)}
      onKeyPress={e => (e.key === ' ' ? props.remove(props.project) : null)}
    >
      <img src={removeIcon} alt="remove" />
    </div>
  ) : null;
  const icon = isNew ? (
    <img
      className={`${styles.info} ${styles.new}`}
      src={props.project.thumb}
      alt={props.project.summary.name}
    />
  ) : (
    <div className={styles.info}>
      <div className={styles.summary}>
        <p className={styles.number}>
          {
            props.project.summary.size ? (
              props.project.summary.size
            ) : '-'
          }
        </p>
        <p className={styles.label}>Size</p>
      </div>
      <div className={styles.summary}>
        <p className={styles.number}>
          {
            props.project.summary.samples ? (
              props.project.summary.samples.toLocaleString()
            ) : '-'
          }
        </p>
        <p className={styles.label}>Samples</p>
      </div>
      <div className={styles.summary}>
        <p className={styles.number}>
          {
            props.project.summary.observations ? (
              props.project.summary.observations.toLocaleString()
            ) : '-'
          }
        </p>
        <p className={styles.label}>Observations</p>
      </div>
    </div>
  );

  const onClick = props.editing ? () => {} : () => props.view(props.project);
  const name = (props.editing && !isNew) ? (
    <textarea
      className={styles.name}
      value={props.project.summary.name}
      onChange={(e) => props.update(props.project, e.target.value)}
    />
  ) : (
    <p className={styles.name}>{props.project.summary.name}</p>
  );

  const returnValue = isNew ? (
    <SpotlightWithToolTip
    isActive={props.help2}
    inheritParentBackgroundColor
    toolTipPlacement="bottomLeft"
    toolTipTitle={"Click “New Project” to load a new BIOM-formatted data file and start a new project."}
    >
      <div
        key={`${props.project.slug}-${props.index}`}
        role="button"
        tabIndex={0}
        className={styles.project}
        onClick={onClick}
        onKeyPress={e => (e.key === ' ' ? onClick() : null)}
      >
        {icon}
        {name}
      </div>
    </SpotlightWithToolTip>
  ) : (
    <SpotlightWithToolTip
    isActive={props.help3 && props.index<2}
    inheritParentBackgroundColor
    toolTipPlacement="bottomLeft"
    overlayStyle={{ maxWidth: '380px'}}
    toolTipTitle={<div>
      Each saved project will be displayed with file size{' '}
      (in Mb), number of biological samples, and{' '}
      number of observations (number of ASVs, OTUs, Contigs, etc.).{' '}
      This information will be calculated by Phinch during file upload.
      <br /><br />
      The saved project is only saved locally on the user’s hard drive (never uploaded to the cloud).
      </div>}
    >
      <div
        key={`${props.project.slug}-${props.index}`}
        role="button"
        tabIndex={0}
        className={styles.project}
        onClick={onClick}
        onKeyPress={e => (e.key === ' ' ? onClick() : null)}
      >
        {icon}
        {remove}
        {name}
      </div>
    </SpotlightWithToolTip>
  );

  return(returnValue);
}

function fsThumb(props) {
  const icon = (<img src={fsIcon} alt="flagship"/>);
  const onClick = () => props.view(props.project);
  const name = (<p className={styles.name}>{props.project.summary.name}</p>);

  return (
    <div
      key={`${props.project.slug}-${props.index}`}
      role="button"
      tabIndex={0}
      className={styles.project}
      onClick={onClick}
      onKeyPress={e => (e.key === ' ' ? onClick() : null)}
    >
      {icon}
      {name}
    </div>
  );
}

export function ProjectList(props) {
  const editClass = props.editing ? styles.edit : '';
  const projects = props.projectList.map((p, i) => ProjectThumb({
    project: p,
    index: i,
    editing: props.editing,
    help2: props.help2,
    help3: props.help3,
    view: props.view,
    update: props.updateName,
    remove: props.remove,
  }));
  return (
    <div className={`${styles.projects} ${editClass}`}>
      {projects}
    </div>
  );
}

export function FSProjectList(props) {
  const projects = props.projectList.map((p, i) => fsThumb({
    project: p,
    index: i,
    view: props.view,
  }));
  return (
    <div className={`${styles.projects}`}>
      {projects}
    </div>
  );
}
