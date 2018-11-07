import React from 'react';

import styles from './ProjectList.css';

const ProjectThumb = (p, i, c) => {
  const icon = p.slug === 'newproject' ? (
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
  return (
    <div key={`${p.slug}-${i}`} className={styles.project} onClick={() => c(p)}>
      {icon}
      <p className={styles.name}>{p.summary.name}</p>
    </div>
  );
}

const ProjectList = (props) => {
  const editClass = props.editing ? styles.edit : '';
  const projects = props.projectList.map((p, i) => {
    return ProjectThumb(p, i, props.click);
  });
  return (
    <div className={editClass}>
      {projects}
    </div>
  );
}

export default ProjectList;