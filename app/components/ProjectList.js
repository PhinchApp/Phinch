import React from 'react';

import styles from './ProjectList.css';

import removeIcon from '../images/remove.svg';

function ProjectThumb(props) {
  const isNew = props.project.slug === 'newproject';
  const remove = (props.editing && !isNew) ? (
    <div
      className={`${styles.remove}`}
      role="button"
      tabIndex={0}
      onClick={() => props.remove(props.project)}
      onKeyDown={() => props.remove(props.project)}
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
  const onClick = props.editing ? null : () => props.view(props.project);
  const name = (props.editing && !isNew) ? (
    <textarea
      className={styles.name}
      value={props.project.summary.name}
      onChange={(e) => props.update(props.project, e.target.value)}
    />
  ) : (
    <p className={styles.name}>{props.project.summary.name}</p>
  );
  return (
    <div
      key={`${props.project.slug}-${props.index}`}
      role="button"
      tabIndex={0}
      className={styles.project}
      onClick={onClick}
      onKeyDown={onClick}
    >
      {icon}
      {remove}
      {name}
    </div>
  );
}

export default function ProjectList(props) {
  const editClass = props.editing ? styles.edit : '';
  const projects = props.projectList.map((p, i) => ProjectThumb({
    project: p,
    index: i,
    editing: props.editing,
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
