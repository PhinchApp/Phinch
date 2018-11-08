import React from 'react';

import styles from './ProjectList.css';

const ProjectThumb = (p, i, e, v, n) => {
  const isNew = p.slug === 'newproject';
  const icon = isNew ? (
      <img className={`${styles.info} ${styles.new}`} src={p.thumb} alt={p.summary.name} />
    ) : (
      <div className={styles.info}>
        <div className={styles.summary}>
          <p className={styles.number}>
            {p.summary.size ? p.summary.size : '-'}
          </p>
          <p className={styles.label}>Size</p>
        </div>
        <div className={styles.summary}>
          <p className={styles.number}>
            {p.summary.samples ? p.summary.samples.toLocaleString() : '-'}
          </p>
          <p className={styles.label}>Samples</p>
        </div>
        <div className={styles.summary}>
          <p className={styles.number}>
            {p.summary.observations ? p.summary.observations.toLocaleString() : '-'}
          </p>
          <p className={styles.label}>Observations</p>
        </div>
      </div>
    );
  const onClick = e ? null : () => v(p)
  const name = (e && !isNew) ? (
      <textarea
        className={styles.name}
        value={p.summary.name}
        onChange={(e) => n(p, e.target.value)}
      />
    ) : (
      <p className={styles.name}>{p.summary.name}</p>
    );
  return (
    <div key={`${p.slug}-${i}`} className={styles.project} onClick={onClick}>
      {icon}
      {name}
    </div>
  );
}

const ProjectList = (props) => {
  const editClass = props.editing ? styles.edit : '';
  const projects = props.projectList.map((p, i) => {
    return ProjectThumb(p, i, props.editing, props.view, props.updateName);
  });
  return (
    <div className={`${styles.projects} ${editClass}`}>
      {projects}
    </div>
  );
}

export default ProjectList;