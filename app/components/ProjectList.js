import React from 'react';

import styles from './ProjectList.css';

const ProjectThumb = (p, i, c) => {
  return (
    <div key={`${p.slug}-${i}`} className={styles.project} onClick={() => c(p)}>
      <img src={p.thumb} alt={p.name} />
      <p>{p.name}</p>
    </div>
  );
}

const ProjectList = (props) => {
  const projects = props.projectList.map((p, i) => {
    return ProjectThumb(p, i, props.click);
  });
  return (
    <div>
      {projects}
    </div>
  );
}

export default ProjectList;