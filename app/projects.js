import { homedir } from 'os';
import fs from 'fs';
import { join } from 'path';

import DataContainer from './DataContainer.js';

import newicon from 'images/new.svg';

const sampleProjects = [
  {
    name: 'Sample Project One',
    slug: 'sampleprojectone',
  },
  {
    name: 'Sample Project Two',
    slug: 'sampleprojecttwo',
  },
];

const homedirectory = homedir();

function checkFolders() {
  // maybe check platform? console.log(platform());
  // check settings file - look somewhere other than home folder
  const home = fs.readdirSync(join(homedirectory));
  if (!home.includes('Documents')) { // weird but ok
    fs.mkdirSync(join(homedirectory, 'Documents'));
  }
  const documents = fs.readdirSync(join(homedirectory, 'Documents'));
  if (!documents.includes('Phinch2.0')) {
    fs.mkdirSync(join(homedirectory, 'Documents', 'Phinch2.0'));
  }
}

function getProjectInfo(path, dataKey) {
  let summary = {
    name: dataKey,
    path,
    dataKey: dataKey,
    // size: null,
    // samples: null,
    // observations: null,
  };
  const metadataPath = join(path, `${dataKey}.json`);
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    if (metadata.summary) {
      summary = Object.assign(summary, metadata.summary);
    }
  }
  let data = '';
  if (fs.existsSync(join(path, `${dataKey}.biom`))) {
    data = join(path, `${dataKey}.biom`);
  }
  return {
    slug: 'filter',
    data,
    summary,
  }
}

export function exportProjectData(path, dataKey, data, callback) {
  const projectdir = join('/', path);
  const project = fs.readdirSync(projectdir);
  let version = 0;
  let exportname = `export-${dataKey}-${version}`;
  while (project.includes(exportname)) {
    version++;
    exportname = `export-${dataKey}-${version}`;
  }
  const exportPath = join('/', path, exportname);
  try {
    fs.writeFileSync(exportPath, JSON.stringify(data));
    callback('Exported');
  } catch (e) {
    callback('Error');
  }
}

export function setProjectFilters(path, dataKey, names, view, callback) {
  const metadataPath = join('/', path, `${dataKey}.json`);
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  if (names) {
    metadata.names = names;
  }
  if (!metadata.summary) {
    metadata.summary = {
      name: dataKey,
      path,
      dataKey,
      // size: null,
      // samples: null,
      // observations: null,
    };
  }
  metadata.summary = Object.assign(metadata.summary, DataContainer.getSummary());

  if (view) {
    if (!metadata[view.type]) {
      metadata[view.type] = {};
    }
    Object.keys(view).forEach(k => {
      if (k !== 'type') {
        metadata[view.type][k] = view[k];
      }
    });
  }

  try {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    callback('Saved');
  } catch (e) {
    callback('Error');
  }
}

export function getProjectFilters(path, dataKey, viewType) {
  const filters = {};
  if (path.length) {
    const metadataPath = join('/', path, `${dataKey}.json`);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const names = metadata['names'] ? metadata['names'] : {};
    // const filters = { names };
    filters.names = names;
    if (metadata[viewType]) {
      Object.keys(metadata[viewType]).forEach(k => {
        if (metadata[viewType][k]) {
          filters[k] = metadata[viewType][k];
        }
      });
    }
  }
  return filters;
}

export function createProject(project) {
  checkFolders();
  const phinchdir = join(homedirectory, 'Documents', 'Phinch2.0');
  const phinch = fs.readdirSync(phinchdir);
  const basename = project.name.split('.').slice(0, -1).join('.');
  let foldername = basename;
  let version = 0;
  while (phinch.includes(foldername)) {
    foldername = `${basename}-${version}`;
    version++;
  }
  fs.mkdirSync(join(phinchdir, foldername));
  const filepath = join(phinchdir, foldername, `${foldername}.biom`);
  fs.writeFileSync(filepath, JSON.stringify(project.data));
  const metadata = {
    summary: {
      name: foldername,
      path: join(phinchdir, foldername),
      dataKey: foldername,
      // size: null,
      // samples: null,
      // observations: null,
    },
  };
  fs.writeFileSync(join(phinchdir, foldername, `${foldername}.json`), JSON.stringify(metadata));
  return { summary: metadata.summary, data: filepath };
}

export function getProjects() {
  checkFolders();
  const projects = fs.readdirSync(join(homedirectory, 'Documents', 'Phinch2.0'))
    .filter(f => f !== 'Samples')
    .filter(f => fs.lstatSync(join(homedirectory, 'Documents', 'Phinch2.0', f)).isDirectory())
    .map((p) => {
      // check for files inside phinch directory folders (data*, settings, thumbnails, etc)
      const path = join(homedirectory, 'Documents', 'Phinch2.0', p);
      return getProjectInfo(path, p);
    });
  const newproject = {
    summary: {
      name: 'New Project',
      path: '',
      dataKey: 'New Project',
      // size: null,
      // samples: null,
      // observations: null,
    },
    slug: 'newproject',
    thumb: newicon
  };
  projects.unshift(newproject);
  return projects;
}

export function getSamples() {
  checkFolders();
  const phinchdir = join(homedirectory, 'Documents', 'Phinch2.0');
  const phinch = fs.readdirSync(phinchdir);
  if (!phinch.includes('Samples')) {
    fs.mkdirSync(join(phinchdir, 'Samples'));
    // Make our 2 default samples now
    sampleProjects.forEach((s) => {
      fs.mkdirSync(join(phinchdir, 'Samples', s.slug));
      const projectSettings = {
        summary: {
          name: s.name,
          path: join(phinchdir, s.slug),
          dataKey: s.slug,
          // size: null, // fill these in for given data
          // samples: null, // fill these in for given data
          // observations: null, // fill these in for given data
        },
      };
      fs.writeFileSync(join(phinchdir, 'Samples', s.slug, `${s.slug}.json`), JSON.stringify(projectSettings));
      // fs.writeFileSync(join(phinchdir, 'Samples', s.slug, `${s.slug}.png`), s.thumb.replace(/^data:image\/png;base64,/, ''), 'base64');
      // add some data
    });
  }
  const samples = fs.readdirSync(join(phinchdir, 'Samples'))
    .filter(f => fs.lstatSync(join(phinchdir, 'Samples', f)).isDirectory())
    .map((s) => {
      const path = join(phinchdir, 'Samples', s);
      return getProjectInfo(path, s);
    });
  return samples;
}
