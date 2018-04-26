import { statSync } from 'fs';

class DataContainer {
  constructor() {
    this.summary = {
      name: '',
      size: 0,
      path: '',
      samples: 0,
      observations: 0,
    };
    this.data = {};
    // this.filters = {};
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

  setSummary(filepath) {
    const filename = filepath.toString().split('/');
    this.summary.name = filename[filename.length-1];
    //
    filename.pop();
    this.summary.path = filename;
    //
    this.summary.size = this.formatFileSize(statSync(filepath).size);
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
    // console.log(this.data);

    /* 
      SIDE EFFECTS
    */
    const seqeuncereads = [];
    this.data.data.forEach((d) => {
      if (seqeuncereads[d[1]]) {
        seqeuncereads[d[1]] += d[2];
      } else {
        seqeuncereads[d[1]] = d[2];
      }
    });

    this.summary.samples = this.data.columns.length;
    this.summary.observations = this.data.rows.length;
    
    this.samples = this.data.columns.map((c, i) => {
      c.metadata['phinchID'] = i;
      return {
        phinchName: c.metadata.phinchID ? c.id : '',
        sampleName: c.id,
        metadata: c.metadata,
        reads: seqeuncereads[i],
        id: i + 1,
      };
    });
    this.observations = this.data.rows.map((r, i) => {
      r.metadata['phinchID'] = i;
      return r;
    });
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
    // 3. rows - filter by row ids in data
    const rowIDs = [... new Set(filteredData.data.map(d => d[0]))];
    filteredData.rows = this.observations.filter((r) => {
      return (rowIDs.indexOf(r.metadata.phinchID) !== -1);
    });

    //
    // Modify Metadata
    filteredData.generated_by = 'Phinch 2.0'
    filteredData.date = new Date().toISOString();
    filteredData.shape = [filteredData.rows.length, filteredData.columns.length];
    //

    return filteredData;
  }
}

export default new DataContainer();