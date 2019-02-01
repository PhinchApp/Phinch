import { remote } from 'electron';
import { stat } from 'fs';
import { join, resolve } from 'path';

const isDev = () => process.env.NODE_ENV === 'development';
const appPath = isDev() ? __dirname : remote.app.getAppPath();
const biomhandlerPath = join(appPath, '/..', '/biomhandler', '/dist', '/biomhandler');
const worker = new Worker(resolve(appPath, 'workers', 'loadAndFormatData.js'));

// Maybe externalize this to utils or something
function formatFileSize(bytes) {
  const interval = 1000;
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(interval));
  return `${(bytes / (interval ** i)).toFixed(1)} ${units[i]}`;
}

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
    this.observations = [];
  }

  setSummary(project, success, failure) {
    this.setSummarySync(project);
    stat(project.data, (error, stats) => {
      if (error) {
        console.warn(error);
        failure();
      } else {
        this.summary.size = formatFileSize(stats.size);
        success();
      }
    });
  }

  setSummarySync(project) {
    if (project.summary) {
      this.summary = Object.assign(this.summary, project.summary);
    } else {
      const filename = project.data.toString().split('/');
      this.summary.name = filename[filename.length - 1];
      this.summary.dataKey = filename[filename.length - 1];
      filename.pop();
      this.summary.path = project.data;
    }
    /* if summary was saved in other format previously */
    if (Array.isArray(this.summary.path)) {
      this.summary.path = join(...this.summary.path);
    }
  }
  getSummary() {
    return this.summary;
  }

  getSamples() {
    return this.samples;
  }

  getObservations() {
    return this.observations;
  }

  loadAndFormatData(filepath, success, failure) {
    worker.postMessage({
      biomhandlerPath,
      filepath,
    });
    worker.onmessage = e => {
      if (e.data.status === 'success') {
        this.data = e.data.data;
        this.samples = e.data.data.columns;
        this.observations = e.data.data.rows;
        this.summary.samples = this.samples.length;
        this.summary.observations = this.observations.length;
        //
        this.attributes = e.data.data.stateFilters;
        this.filters = e.data.data.filters;
        //
        success();
      } else {
        failure();
      }
    };
  }

  getData() {
    return this.data;
  }

  getFilters() {
    return this.filters;
  }

  applyFiltersToData(columns) {
    // Modify Data
    const filteredData = Object.assign({}, this.data);
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
