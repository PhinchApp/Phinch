import { statSync } from 'fs';
import { join } from 'path';

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

  // Maybe externalize this to utils or something
  formatFileSize(bytes) {
    const interval = 1000;
    const units = ['B', 'kB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(interval));
    return `${(bytes / Math.pow(interval, i)).toFixed(1)} ${units[i]}`;
  }

  setSummary(project) {
    if (project.summary) {
      this.summary = Object.assign(this.summary, project.summary);
    } else {
      const filename = project.data.toString().split('/');
      this.summary.name = filename[filename.length-1];
      this.summary.dataKey = filename[filename.length-1];
      filename.pop();
      this.summary.path = project.data;
    }
    /* if summary was saved in other format previously */
    if (Array.isArray(this.summary.path)) {
      this.summary.path = join(...this.summary.path);
    }
    if (!this.summary.size) {
      this.summary.size = this.formatFileSize(statSync(project.data).size);
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

  setData(data) {
    this.data = data;

    /*
      SIDE EFFECTS
    */
    const sequenceReads = {};
    this.data.data.forEach((d) => {
      if (sequenceReads[d[1]]) {
        sequenceReads[d[1]] += d[2];
      } else {
        sequenceReads[d[1]] = d[2];
      }
    });
    // const seqids = Object.keys(sequenceReads).map(k => parseInt(k))
    // console.log(seqids);
    // const colids = this.data.columns.slice().map(c => c.metadata.phinchID)
    // console.log(colids);
    // const diff = seqids.filter(x => !colids.includes(x))
    // console.log(diff);

    this.summary.samples = this.data.columns.length;
    this.summary.observations = this.data.rows.length;

    this.data.columns = this.data.columns.map((c, i) => {
      // c.metadata['phinchID'] = c.metadata['phinchID'] ? c.metadata['phinchID'] : i;
      c.metadata['phinchID'] = i;
      const reads = (sequenceReads[i] === undefined) ? 0 : sequenceReads[i];
      return {
        biomid: i + 1,
        id: c.id,
        sampleName: c.id,
        phinchName: c.phinchName ? c.phinchName : ( c.metadata.phinchName ? c.metadata.phinchName : c.id),
        metadata: c.metadata,
        reads,
      };
    });
    // console.log(this.data.columns.slice()[2]);
    this.samples = this.data.columns;

    this.data.rows = this.data.rows.map((r, i) => {
      r.metadata['phinchID'] = i;
      // r.metadata['phinchID'] = r.metadata['phinchID'] ? r.metadata['phinchID'] : i;
      return r;
    });
    this.observations = this.data.rows;
    /*
      SIDE EFFECTS
    */
  }
  getData() {
    return this.data;
  }

  applyFiltersToData(columns) {
    // Modify Data
    const filteredData = Object.assign({}, this.data);
    // 1. columns - apply this from filter.state.data
    filteredData.columns = columns;
    // 2. data - filter by column id
    const columnIDs = columns.map(c => c.metadata.phinchID);
    filteredData.data = filteredData.data.filter((d) => {
      return (columnIDs.indexOf(d[1]) !== -1);
    });
    // Don't do this so that the rows match
    // 3. rows - filter by row ids in data
    // const rowIDs = [... new Set(filteredData.data.map(d => d[0]))];
    // filteredData.rows = this.observations.filter((r) => {
    //   return (rowIDs.indexOf(r.metadata.phinchID) !== -1);
    // });
    //
    // Modify Metadata
    filteredData.generated_by = 'Phinch 2.0'
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