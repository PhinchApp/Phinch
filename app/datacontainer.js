import { remote } from 'electron';
import { stat, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, parse } from 'path';

const isLinux = () => process.platform === 'linux';
const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();
const executable = isLinux() ? 'linux-biomhandler' : 'biomhandler';
const biomhandlerPath = resolve(appPath, '..', 'biomhandler', executable);
const workerPath = resolve(appPath, '..', 'workers', 'loadAndFormatData.js');
const worker = new Worker(workerPath);

// Maybe externalize this to utils or something
function formatFileSize(bytes) {
  const interval = 1000;
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(interval));
  return `${(bytes / (interval ** i)).toFixed(1)} ${units[i]}`;
}


const defaultLevels = [
  {name: "kingdom", number: null, order: 0},
  {name: "phylum", number: null, order: 1},
  {name: "class", number: null, order: 2},
  {name: "order", number: null, order: 3},
  {name: "family", number: null, order: 4},
  {name: "genus", number: null, order: 5},
  {name: "species", number: null, order: 6},
]

class DataContainer {
  constructor() {
    this.summary = {
      name: '',
      path: '',
      dataKey: '',
      // size: null,
      // samples: null,
      // observations: null,
    };
    this.data = {};
    this.filteredData = {};
    this.attributes = {};
    this.samples = [];
    this.rejectedSamples = [];
    this.observations = [];
  }

  setSummary(project, success, failure) {
    try {
      this.setSummarySync(project);
      // todo: make this handle renamed metadata file
      // (does not catch that error for some reason)
      stat(project.data, (error, stats) => {
        if (error) {
          console.warn(error);
          failure();
        } else {
          this.summary.size = formatFileSize(stats.size);
          success();
        }
      });
    } catch (error) {
      console.warn(error);
      failure();
    }
  }

  setSummarySync(project) {
    if (project.summary) {
      this.summary = Object.assign(this.summary, project.summary);
    } else {
      const filename = parse(project.data.toString());
      this.summary.name = filename.name;
      this.summary.dataKey = filename.name;
      this.summary.path = project.data;
    }
    /* if summary was saved in other format previously */
    if (Array.isArray(this.summary.path)) {
      this.summary.path = join(...this.summary.path);
    }
  }

  loadAndFormatData(filepath, success, failure, metadataWarning = null) {
    const filename = filepath
    const pathWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
    const savedJSONData = `${pathWithoutExtension}-cached.json`;

    const handleJSONData = (data) => {
      this.rejectedSamples = data.rejectedSamples;
      if (this.rejectedSamples.length && metadataWarning !== null) {
        metadataWarning(this.rejectedSamples);
      } else {
        this.data = data;
        this.samples = data.columns;
        this.observations = data.rows;
        this.summary.samples = this.samples.length;
        this.summary.observations = this.observations.length;
        this.attributes = data.stateFilters;
        this.filters = data.filters;
        this.levels = data.levels;
        if (!this.levels || this.levels.length === 0) {
          this.levels = defaultLevels;
        }
        success();
      }
    }

    if (existsSync(savedJSONData)) {
      const data = JSON.parse(readFileSync(savedJSONData, 'utf8'));
      handleJSONData(data);
      return;
    }
    worker.postMessage({ biomhandlerPath, filepath, isLinux: isLinux() });

    worker.onmessage = e => {
      if (e.data.status === 'success') {
        const data = JSON.parse(e.data.data);
        writeFileSync(savedJSONData, JSON.stringify(data));
        handleJSONData(data)


      } else {
        const { type, file } = e.data;
        failure(type, file);
      }
    };
  }

  getSummary() {
    return this.summary;
  }

  getSamples() {
    return this.samples;
  }

  getRejectedSamples() {
    return this.rejectedSamples;
  }

  getObservations() {
    return this.observations;
  }

  getData() {
    return this.data;
  }

  getFilters() {
    return this.filters;
  }

  getLevels() {
    return this.levels;
  }

  applyFiltersToData(columns) {
    // move to worker?
    // Modify Data
    const filteredData = this.data;
    // 1. columns - apply this from filter.state.data
    filteredData.columns = columns;
    // 2. data - filter by column id
    const columnIDs = columns.map(c => c.metadata.phinchID);
    filteredData.data = filteredData.data.filter(d => columnIDs.indexOf(d[1]) !== -1);
    // Don't do this so that the rows match
    // 3. rows - filter by row ids in data
    // const rowIDs = [... new Set(filteredData.data.map(d => d[0]))];
    // filteredData.rows = this.observations.filter((r) => {
    //   return (rowIDs.indexOf(r.metadata.phinchID) !== -1);
    // });
    //
    // Modify Metadata
    filteredData.generated_by = 'Phinch 2.0';
    filteredData.date = new Date().toISOString();
    filteredData.shape = [filteredData.rows.length, filteredData.columns.length];
    //
    this.filteredData = filteredData;
    return filteredData;
  }
  getFilteredData() {
    return this.filteredData;
  }

  setAttributes(attributes) {
    this.attributes = attributes;
  }
  getAttributes() {
    return this.attributes;
  }
}

export default new DataContainer();
