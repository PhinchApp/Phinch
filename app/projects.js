import { homedir, platform } from 'os';
import fs from 'fs';
import { join } from 'path';

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

  const home = fs.readdirSync(join(homedirectory));
  if (!home.includes('Documents')) { // weird but ok
    fs.mkdirSync(join(homedirectory, 'Documents'));
  }
  const documents = fs.readdirSync(join(homedirectory, 'Documents'));
  if (!documents.includes('Phinch2.0')) {
    fs.mkdirSync(join(homedirectory, 'Documents', 'Phinch2.0'));
  }
}

export function getProjects() {
  checkFolders();
  const projects = fs.readdirSync(join(homedirectory, 'Documents', 'Phinch2.0'))
    .filter(f => f !== 'Samples')
    .filter(f => fs.lstatSync(join(homedirectory, 'Documents', 'Phinch2.0', f)).isDirectory());
  // map => 
  // check for files inside phinch directory folders (data*, settings, thumbnails, etc)
  //
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
  const phinch = fs.readdirSync(join(homedirectory, 'Documents', 'Phinch2.0'));
  if (!phinch.includes('Samples')) {
    fs.mkdirSync(join(homedirectory, 'Documents', 'Phinch2.0', 'Samples'));
    // Make our 2 default samples now
    sampleProjects.forEach((s) => {
      fs.mkdirSync(join(homedirectory, 'Documents', 'Phinch2.0', 'Samples', s.slug));
      fs.writeFileSync(join(homedirectory, 'Documents', 'Phinch2.0', 'Samples', s.slug, `${s.slug}.json`), JSON.stringify({name:s.name}));
      fs.writeFileSync(join(homedirectory, 'Documents', 'Phinch2.0', 'Samples', s.slug, `${s.slug}.png`), s.thumb.replace(/^data:image\/png;base64,/, ''), 'base64');
      // add some data lol idk
    });
  }
  const samples = fs.readdirSync(join(homedirectory, 'Documents', 'Phinch2.0', 'Samples'))
    .filter(f => fs.lstatSync(join(homedirectory, 'Documents', 'Phinch2.0', 'Samples', f)).isDirectory())
    .map((s) => {
      const path = join(homedirectory, 'Documents', 'Phinch2.0', 'Samples', s);
      let name = '';
      if (fs.existsSync(join(path, `${s}.json`))) {
        name = JSON.parse(fs.readFileSync(join(path, `${s}.json`), 'utf8')).name;
      }
      let thumb = '';
      if (fs.existsSync(join(path, `${s}.png`))) {
        thumb = `data:image/png;base64, ${fs.readFileSync(join(path, `${s}.png`), 'base64')}`;
      }
      return {
        name: name,
        slug: s,
        thumb: thumb,
      }
    });
  return samples;
}
