import { homedir, platform } from 'os';
import fs from 'fs';

import newicon from 'images/newicon.png';
import sampleicon from 'images/sampleicon.png';

const sampleProjects = [
  {
    name: 'Sample Project One',
    slug: 'sampleprojectone',
    thumb: sampleicon
  },
  {
    name: 'Sample Project Two',
    slug: 'sampleprojecttwo',
    thumb: sampleicon
  },
];

const homedirectory = homedir();

function checkFolders() {
  // maybe check platform? console.log(platform());
  // check settings file - look somewhere other than home folder

  const home = fs.readdirSync(`${homedirectory}`);
  if (!home.includes('Documents')) { // weird but ok
    fs.mkdirSync(`${homedirectory}/Documents`);
  }
  const documents = fs.readdirSync(`${homedirectory}/Documents`);
  if (!documents.includes('Phinch2.0')) {
    fs.mkdirSync(`${homedirectory}/Documents/Phinch2.0`);
    // spawn samples as well here
  }
  // const phinch = fs.readdirSync(`${homedirectory}/Documents/Phinch2.0`);
  // check for files inside phinch directory folders (data*, settings, thumbnails, etc)
}

export function getProjects() {
  checkFolders();
  const projects = fs.readdirSync(`${homedirectory}/Documents/Phinch2.0`)
    .filter(f => f !== 'Samples')
    .filter(f => fs.lstatSync(`${homedirectory}/Documents/Phinch2.0/${f}`).isDirectory());
  const newproject = {
    name: 'New Project',
    slug: 'newproject',
    thumb: newicon
  };
  projects.unshift(newproject);
  return projects;
}

export function getSamples() {
  checkFolders();
  const phinch = fs.readdirSync(`${homedirectory}/Documents/Phinch2.0`);
  if (!phinch.includes('Samples')) {
    fs.mkdirSync(`${homedirectory}/Documents/Phinch2.0/Samples`);
    // Make our 2 default samples now
    sampleProjects.forEach((s) => {
      fs.mkdirSync(`${homedirectory}/Documents/Phinch2.0/Samples/${s.slug}`);
      fs.writeFileSync(`${homedirectory}/Documents/Phinch2.0/Samples/${s.slug}/${s.slug}.json`, JSON.stringify({name:s.name}));
      fs.writeFileSync(`${homedirectory}/Documents/Phinch2.0/Samples/${s.slug}/${s.slug}.png`, s.thumb.replace(/^data:image\/png;base64,/, ''), 'base64');
      // add some data lol idk
    });
  }
  const samples = fs.readdirSync(`${homedirectory}/Documents/Phinch2.0/Samples`)
    .filter(f => fs.lstatSync(`${homedirectory}/Documents/Phinch2.0/Samples/${f}`).isDirectory())
    .map((s) => {
      const path = `${homedirectory}/Documents/Phinch2.0/Samples/${s}/${s}`;
      let name = '';
      if (fs.existsSync(`${path}.json`)) {
        name = JSON.parse(fs.readFileSync(`${path}.json`, 'utf8')).name;
      }
      let thumb = '';
      if (fs.existsSync(`${path}.png`)) {
        thumb = `data:image/png;base64, ${fs.readFileSync(`${path}.png`, 'base64')}`;
      }
      return {
        name: name,
        slug: s,
        thumb: thumb,
      }
    });
  return samples;
}
