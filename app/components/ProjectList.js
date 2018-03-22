import React from 'react';
import { Link } from 'react-router-dom';

import styles from './ProjectList.css';

const ProjectThumb = (p,i) => {
  return (
    <Link key={`${p.slug}-${i}`} to={p.slug}>
      <div className={styles.project}>
        <img src={p.thumb} alt={p.name} />
        <p>{p.name}</p>
      </div>
    </Link>
  );
}

const ProjectList = (projectList) => {
  const projects = projectList.map((p,i) => {
    return ProjectThumb(p,i);
  });
  return (
    <div>
      {projects}
    </div>
  );
}

export default ProjectList;