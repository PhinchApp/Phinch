// @flow
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { nest } from 'd3-collection';
import Table from 'rc-table';

import DataContainer from '../DataContainer';
import FrequencyChart from './FrequencyChart';
import FilterChart from './FilterChart';

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
    // TODO: Move this to data container or similar
    if (this.state.data.length) {
      const metadata = this.state.data[0].metadata;
      this.metadataKeys = Object.keys(metadata).filter(k => k !== 'phinchID');
      this.metadataKeys.forEach((k) => {
        const units = [];
        /* TODO:
          Figure out how to handle no_data
          Figure out how to handle strings
        */
        const values = nest()
          .key(d => d)
          .entries(this.state.data.map((d) => {
            const [value,unit] = d.metadata[k].split(' ');
            if (unit !== undefined && !units.includes(unit)) {
              units.push(unit);
            }
            return value;
          }).filter(d => d !== 'no_data')).map((d, i) => {
            return {
              index: i,
              value: d.key,
              count: d.values.length,
            };
          });
        const unit = units.length ? units[0] : '';
        if (k.toLowerCase().trim().includes('date') || k.toLowerCase().trim().includes('year')) {
          /*
            TODO: 
              Make sure you handle all date types
              May need to convert to GMT for consistency?
          */
          this.filters.date[k] = {
            values: values.sort((a, b) => {
              return a.value > b.value;
            }).map((d, i) => {
              d.index = i;
              d.value = new Date(d.value);
              return d;
            }),
            unit: unit,
          };
        } else if (this.filterFloat(values.filter(v => v.value !== 'no_data')[0].value) !== null) {
          console.log(values);
          this.filters.number[k] = {
            values: values.map((v) => {
                      if (this.filterFloat(v.value) !== null) {
                        v.value = this.filterFloat(v.value);
                      }
                      return v;
                    }).sort((a, b) => {
                      console.log(a.value);
                      console.log(b.value);
                      return a.value < b.value;
                    }).map((d, i) => {
                      d.index = i;
                      return d;
                    }),
            unit: unit,
          };
          console.log(values);
        } else {
          this.filters.string[k] = {
            values: values,
            unit: unit,
          };
        }

        this.state.filters[k] = {
          range: {
            min: values[0],
            max: values[values.length - 1],
          },
          expanded: false,
        };
        console.log(this.state.filters[k].range);
      });
    }
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

  displayFilters() {
    return Object.keys(this.filters).map((k) => {
      const group = Object.keys(this.filters[k]).map((g) => {
        const expanded = this.state.filters[g].expanded;
        const icon = expanded ? '[-]' : '[+]';
        const width = expanded ? 300 : 150;
        const height = expanded ? 60 : 30;
        return (
          <div key={g}>
            <div onClick={() => {
              const filters = this.state.filters;
              filters[g].expanded = !filters[g].expanded;
              this.setState({filters});
            }}>{icon}</div>
            <FilterChart
              name={g}
              data={this.filters[k][g]}
              width={width}
              height={height}
              filter={this.state.filters[g]}
            />
          </div>
        );
      });
      return <div key={k}><div>{k}</div>{group}</div>;
    });
  }

  updateFilters(e, attribute) {
    const filters = this.state.filters;
    filters[attribute].filtered = e.target.value;
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
            {this.displayFilters()}
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
