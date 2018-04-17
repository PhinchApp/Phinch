// @flow
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { nest } from 'd3-collection';
import Table from 'rc-table';

import DataContainer from '../DataContainer';
import FrequencyChart from './FrequencyChart';
import FilterChart from './FilterChart';
import CheckBoxes from './CheckBoxes';

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

    this.filterValues = {};

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
          .entries(this.state.data.slice().map((d) => {
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
        //
        const unit = units.length ? units[0] : '';
        let groupKey = 'string';
        this.filterValues[k] = values.slice();
        if (k.toLowerCase().trim().includes('date') || k.toLowerCase().trim().includes('year')) {
          /*
            TODO: 
              Make sure you handle all date types
              May need to convert to GMT for consistency?
          */
          groupKey = 'date';
          this.filterValues[k] = values.slice().map((d, i) => {
            if (k.toLowerCase().trim().includes('date')) {
              d.value = new Date(d.value);
            } if (this.filterFloat(d.value) !== null) {
              d.value = this.filterFloat(d.value);
            }
            return d;
          }).sort((a, b) => {
            return a.value.valueOf() - b.value.valueOf();
          }).map((d, i) => {
            d.index = i;
            return d;
          });
        } else if (this.filterFloat(values.filter(v => v.value !== 'no_data')[0].value) !== null) {
          groupKey = 'number';
          this.filterValues[k] = values.slice().map((v) => {
            if (this.filterFloat(v.value) !== null) {
              v.value = this.filterFloat(v.value);
            }
            return v;
          }).sort((a, b) => {
            return a.value - b.value;
          }).map((d, i) => {
            d.index = i;
            return d;
          });
        }
        //
        this.filters[groupKey][k] = {
          values: this.filterValues[k],
          unit: unit,
        };
        //
        let range = {
          min: this.filterValues[k][0],
          max: this.filterValues[k][this.filterValues[k].length - 1],
        };
        if (groupKey === 'string') {
          range = {};
          this.filterValues[k].map((v) => {
            range[v.value] = true;
          });
        }
        //
        this.state.filters[k] = {
          range: range,
          type: groupKey,
          expanded: false,
        };
        //
      });

      this.updateChecks = this.updateChecks.bind(this);
      this.updateFilters = this.updateFilters.bind(this);
    }
    //

    this.columns = [
      {
        title: (<div className={`${styles.heading} ${styles.name}`} onClick={() => { this.sortBy('phinchName') }}>Phinch Name</div>),
        dataIndex: 'phinchName',
        key: 'phinchName',
        // width: 200,
        render: (t, r) => (
          <input
            className={`${styles.input} ${styles.name}`}
            type="text"
            value={t}
            onChange={(e) => this.updatePhinchName(e, r)}
          />
        ),
      },
      {
        title: (<div className={`${styles.heading} ${styles.id}`} onClick={() => { this.sortBy('id') }}>BIOM ID</div>),
        dataIndex: 'id',
        key: 'id',
        // width: 75,
      },
      {
        title: (<div className={`${styles.heading} ${styles.sample}`} onClick={() => { this.sortBy('sampleName') }}>Sample Name</div>),
        dataIndex: 'sampleName',
        key: 'sampleName',
        // width: 125,
      },
      {
        title: (<div className={styles.heading} onClick={() => { this.sortBy('reads') }}>Sequence Reads</div>),
        dataIndex: 'reads',
        key: 'reads',
        // width: 150,
      },
      {
        title: '',
        dataIndex: '',
        key: 'chart',
        // width: 150,
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
    const data = DataContainer.getSamples().filter((d, i) => {
      let include = true;
      Object.keys(filters).forEach((k) => {
        let value = d.metadata[k].split(' ')[0];
        // if (filters[k].type === 'date') {
        if (k.toLowerCase().trim().includes('date')) {
          value = new Date(value);
          if (value.valueOf() < filters[k].range.min.value.valueOf() || value.valueOf() > filters[k].range.max.value.valueOf()) {
            include = false;
          }
        } else if (filters[k].type === 'number' || filters[k].type === 'date') {
          if (this.filterFloat(value) !== null) {
            value = this.filterFloat(value);
            if (value < filters[k].range.min.value || value > filters[k].range.max.value) {
              include = false;
            }
          }
        } else {
          if (!filters[k].range[value]) {
            include = false;
          }
        }
      });
      return include;
    });
    this.setState({filters, data});
  }

  updateChecks(attribute, type, value) {
    const filters = this.state.filters;
    filters[attribute].range[type] = value;
    this.applyFilters(filters);
  }

  updateFilters(attribute, min, max) {
    const filters = this.state.filters;
    let minValue = Object.assign({}, this.filterValues[attribute][min]);
    if (min >= this.filterValues[attribute].length) {
      minValue = Object.assign({}, this.filterValues[attribute][this.filterValues[attribute].length - 1]);
      minValue.value += 1;
    }
    let maxValue = Object.assign({}, this.filterValues[attribute][max]);
    if (max < 0) {
      maxValue = Object.assign({}, this.filterValues[attribute][0]);
      maxValue.value -= 1;
    }
    //
    filters[attribute].range = {
      min: minValue,
      max: maxValue,
    };
    this.applyFilters(filters);
  }

  displayFilters() {
    const SectionNames = {
      date: 'Date Range',
      number: 'Numeric Range',
      string: 'Categories',
    };
    return Object.keys(this.filters).map((k) => {
      const group = Object.keys(this.filters[k]).map((g) => {
        const expanded = this.state.filters[g].expanded;
        // const icon = expanded ? '[-]' : '[+]';
        const icon = expanded ? '-' : '+';
        // const width = expanded ? 300 : 150;
        const width = 200;
        const height = expanded ? 60 : 20;
        const filter = (this.state.filters[g].type === 'string') ? (
            <CheckBoxes
              name={g}
              data={this.filters[k][g]}
              filter={this.state.filters[g]}
              update={this.updateChecks}
            />
          ) : (
            <FilterChart
              name={g}
              data={this.filters[k][g]}
              width={width}
              height={height}
              filter={this.state.filters[g]}
              update={this.updateFilters}
            />
          );
        return (
          <div key={g} className={styles.filter}>
            <div className={styles.expand} onClick={() => {
              const filters = this.state.filters;
              filters[g].expanded = !filters[g].expanded;
              this.setState({filters});
            }}>{icon}</div>
            {filter}
          </div>
        );
      });
      return (
        <div key={k} className={styles.bottom}>
          <div className={styles.heading}>
            {SectionNames[k]}
          </div>
          <div className={styles.outline}>
            {group}
          </div>
        </div>
      );
    });
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
      const data = this.state.data.sort((a, b) => {
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
        <table className={styles.info}>
          <tbody>
            <tr>
              <td className={styles.label}>File Name:</td>
              <td>{this.state.summary.name} ({this.state.summary.size})</td>
            </tr>
            <tr>
              <td className={styles.label}>Observations:</td>
              <td>{this.state.summary.observations.toLocaleString()}</td>
            </tr>
            <tr>
              <td className={styles.label}>Selected Samples:</td>
              <td>{this.state.data.length.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <div>
          <div className={`${styles.section} ${styles.left}`} style={{
            display: 'inline-block',
            // height: (this.state.height - 175),
            height: (this.state.height - 125),
            overflowY: 'scroll',
          }}>
            {this.displayFilters()}
          </div>
          <div className={`${styles.section} ${styles.right}`}>
            <Table
              className={styles.table}
              rowClassName={(r, i) => {
                if (i%2 === 0) {
                  return styles.grey;
                }
                return;
              }}
              // scroll={{ y: (this.state.height - 210) }}
              scroll={{ y: (this.state.height - 155) }}
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
