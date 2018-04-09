// @flow
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Table from 'rc-table';

import DataContainer from '../DataContainer';
import FrequencyChart from './FrequencyChart';

import styles from './Filter.css';
import logo from 'images/phinch.png';

export default class Filter extends Component {
  constructor(props) {
    super(props);

    this.reverse = false;

    this.state = {
      summary: DataContainer.getSummary(),
      data: DataContainer.getSamples(),
      height: window.innerHeight,
      filters: {},
    };

    this.filters = {
      date: {},
      number: {},
      string: {},
    };

    /*
      FILTER Controls
    */
    //
    if (this.state.data.length) {
      const metadata = this.state.data[0].metadata;
      this.metadataKeys = Object.keys(metadata);
      this.metadataKeys.forEach((k) => {
        this.state.filters[k] = 'all';
        const values = [...new Set(this.state.data.map(d => d.metadata[k]))];
        if (k.toLowerCase().trim() === 'date' || k.toLowerCase().trim() === 'year') {
          this.filters.date[k] = values.sort((a, b) => {
            return a < b;
          });
        } else if (this.filterFloat(metadata[k]) !== null) {
          this.filters.number[k] = values.map((v) => {
            if (this.filterFloat(v) !== null) {
              return this.filterFloat(v);
            } else {
              return v;
            }
          }).sort();
        } else {
          this.filters.string[k] = values;
        }
      });
    }
    this.filters = Object.keys(this.filters).map((k) => {
      const group = Object.keys(this.filters[k]).map((g) => {
        const options = this.filters[k][g].map((o) => {
          return <option key={o} value={o}>{o}</option>
        })
        return (
          <div key={g}>
            <label htmlFor={g}>{g}</label>
            <select name={g} defaultValue='all' onChange={(event) => {
              this.updateFilters(event, g);
            }}>
              <option value='all' key='all'>All</option>
              {options}
            </select>
          </div>
        );
      });
      return <div key={k}><div>{k}</div><ul>{group}</ul></div>;
    });
    //


    this.columns = [
      {
        title: (<a onClick={() => { this.sortBy('phinchName') }}>Phinch Name</a>),
        dataIndex: 'phinchName',
        key: 'phinchName',
        width: 150,
        render: (t, r) => (
          <input
            className={styles.input}
            type="text"
            value={t}
            onChange={(e) => this.updatePhinchName(e, r)}
          />
        ),
      },
      {
        title: (<a onClick={() => { this.sortBy('id') }}>BIOM ID</a>),
        dataIndex: 'id',
        key: 'id',
        width: 150,
      },
      {
        title: (<a onClick={() => { this.sortBy('sampleName') }}>Sample Name</a>),
        dataIndex: 'sampleName',
        key: 'sampleName',
        width: 150,
      },
      {
        title: (<a onClick={() => { this.sortBy('reads') }}>Sequence Reads</a>),
        dataIndex: 'reads',
        key: 'reads',
        width: 150,
      },
      {
        title: '',
        dataIndex: '',
        key: 'chart',
        width: 150,
        render: (d) => (<FrequencyChart data={this.state.data} value={d.reads} width={150 * 2} height={30 * 2} />),
      },
      {
        title: '',
        dataIndex: '',
        key: 'remove',
        width: 15,
        render: (r) => (
          <div onClick={() => { this.removeRow(r) }}>x</div>
        ),
      }
    ];

    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions() {
    this.setState({height:window.innerHeight});
  }


  filterFloat(value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
      return Number(value);
    }
    return null;
  }

  applyFilters(filters) {
    const data = DataContainer.getSamples().filter((d) => {
      let include = true;
      Object.keys(filters).forEach((k) => {
        if (filters[k] !== 'all') {
          if (filters[k].toString() !== d.metadata[k]) {
            include = false;
          }
        }
      });
      return include;
    });
    this.setState({filters, data});
  }

  updateFilters(e, attribute) {
    const filters = this.state.filters;
    filters[attribute] = e.target.value;
    this.applyFilters(filters);
  }

  updatePhinchName(e, r) {
    const data = this.state.data.map((d) => {
      if (d.sampleName === r.sampleName) {
        d.phinchName = e.target.value;
      }
      return d;
    });
    this.setState({data});
  }

  removeRow(r) {
    const data = this.state.data.filter((d) => {
      return (d.sampleName !== r.sampleName);
    });
    this.setState({data});
  }


  sortBy(key) {
    if (this.state.data.length) {
      const data = this.state.data.sort((a,b) => {
        if (this.reverse) {
          if (a[key] < b[key]) return -1;
          if (a[key] > b[key]) return 1;
          return 0;
        } else {
          if (b[key] < a[key]) return -1;
          if (b[key] > a[key]) return 1;
          return 0;
        }
      });
      this.reverse = !this.reverse;
      this.setState({data});
    }
  }

  render() {
    const redirect = (this.state.summary.name && this.state.summary.size) ? '' : <Redirect push to='/' />;
    return (
      <div className={styles.container}>
        {redirect}
        <div className={styles.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <table>
          <tbody>
            <tr>
              <td className={styles.label}>File Name:</td>
              <td>{this.state.summary.name} ({this.state.summary.size})</td>
            </tr>
            <tr>
              <td className={styles.label}>Observations:</td>
              <td>{this.state.summary.observations}</td>
            </tr>
            <tr>
              <td className={styles.label}>Selected Samples:</td>
              <td>{this.state.data.length}</td>
            </tr>
          </tbody>
        </table>
        <div>
          <div className={`${styles.section} ${styles.left}`} style={{
            display: 'inline-block',
            height: (this.state.height - 175),
            overflowY: 'scroll',
          }}>
            {this.filters}
          </div>
          <div className={`${styles.section} ${styles.right}`}>
            <Table
              className={styles.table}
              scroll={{ y: (this.state.height - 210) }}
              columns={this.columns}
              data={this.state.data}
              rowKey={row => row.id}
            />
          </div>
        </div>
      </div>
    );
  }
}
