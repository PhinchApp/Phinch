// @flow
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Table from 'rc-table';

import DataContainer from '../DataContainer';
import { setupFrequencyChart, getFrequencyChart} from './frequencyChart';

import styles from './Filter.css';
import logo from 'images/phinch.png';

export default class Filter extends Component {
  constructor(props) {
    super(props);

    this.reverse = false;

    this.columns = [
      {
        title: (<a onClick={() => { this.sortBy('phinchName') }}>Phinch Name</a>),
        dataIndex: 'phinchName',
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
        width: 150,
      },
      {
        title: (<a onClick={() => { this.sortBy('sampleName') }}>Sample Name</a>),
        dataIndex: 'sampleName',
        width: 150,
      },
      {
        title: (<a onClick={() => { this.sortBy('reads') }}>Sequence Reads</a>),
        dataIndex: 'reads',
        width: 150,
      },
      {
        title: '',
        dataIndex: 'chart',
        width: 150,
      },      
      {
        title: '',
        dataIndex: '',
        width: 15,
        render: (r) => (
          <div onClick={() => { this.removeRow(r) }}>x</div>
        ),
      }
    ];

    this.state = {
      summary: DataContainer.getSummary(),
      data: DataContainer.getSamples(),
      height: window.innerHeight,
    };

    setupFrequencyChart(this.state.data.map(d => d.reads), 150, 20);
    const data = this.state.data.map((d) => {
      d.chart = getFrequencyChart(d.reads)
      return d;
    });

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
    setupFrequencyChart(data.map(d => d.reads), 150, 20);
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
    console.log('render');
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
        <Table
          className={styles.table}
          scroll={{ y: (this.state.height - 200) }}
          columns={this.columns}
          data={this.state.data}
          rowKey={row => row.id}
        />
      </div>
    );
  }
}
