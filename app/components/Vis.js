import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Table from 'rc-table';
import _sortBy from 'lodash.sortby';
import _cloneDeep from 'lodash.clonedeep';
import { nest } from 'd3-collection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';

import { updateFilters, removeRows, restoreRows, visSortBy, getSortArrow } from '../FilterFunctions';
import DataContainer from '../DataContainer';

import SideMenu from './SideMenu';
import StackedBar from './StackedBar';
import StackedBarTooltip from './StackedBarTooltip';
import FilterChart from './FilterChart';
import RemovedRows from './RemovedRows';
import palette from '../palette';
import Summary from './Summary';

import styles from './Vis.css';
import tstyle from './tables.css';
import gstyle from './general.css';
import logo from 'images/phinch.png';

export default class Vis extends Component {
  constructor(props) {
    super(props);

    this.state = {
      summary: DataContainer.getSummary(),
      initdata: DataContainer.getFilteredData(),
      data: [],
      preData: [],
      deleted: [],
      filters: {},
      width: window.innerWidth,
      height: window.innerHeight,
      redirect: null,
      level: 1,
      highlightedDatum: null,
      showTooltip: false,
      mode: 'percent',
      showSequences: false,
      showRightSidebar: false,
      showLeftSidebar: false,
    };

    this.menuItems = [
      {
        id: 'filter',
        link: '/Filter',
        icon: (<div className={gstyle.arrow} style={{transform: `rotate(${-90}deg)`}}>⌃</div>),
        name: 'Back',
      },
    ];

    this.filters = {};

    this.tooltip = {
      timer: null,
      duration: 1500,
    };

    this.sort = {
      reverse: true,
      key: 'biomid',
    };

    this.levels = [];
    this.readsBySequence = {};

    this.metrics = {
      padding: 16,
      lineHeight: 14, //14,
      barContainerHeight: 56, // 70,
      barHeight: 48, //60, //12,
      miniBarContainerHeight: 8,
      miniBarHeight: 6,
      height: 600,
      hideWidth: 20,
      idWidth: 32,
      nameWidth: 144,
      heightOffset: 251,
      leftSidebar: 25,
      left: {
        min: 25,
        max: 125,
      },
      rightSidebar: 216,
    };

    this.metrics.nonbarWidth = (this.metrics.padding * 4) + (this.metrics.idWidth + this.metrics.hideWidth + this.metrics.nameWidth);
    // this.metrics.chartWidth = this.state.width - this.metrics.nonbarWidth;
    this.metrics.chartWidth = this.state.width - (this.metrics.leftSidebar + this.metrics.nonbarWidth);
    this.metrics.chartHeight = this.state.height - this.metrics.heightOffset;

    this.scales = {
      x: scaleLinear(),
      c: scaleOrdinal().range(palette),
    };

    this.totalDataReads = 0;

    if (Object.keys(this.state.initdata).length === 0) {
      this.state.redirect = '/';
    } else {

      // Autogenerate levels from data
      // TODO: Test w/ addtional data formats

      const uniq_taxa = [...new Set(
          [].concat(...
            [...new Set(
              this.state.initdata.rows.map(r => {
                return r.metadata.taxonomy.map((t, i) => {
                  return t.split('__')[0];
                }).join('|');
              })
            )].map(r => {
              return r.split('|').map((l, i) => {
                return JSON.stringify({
                  name: l,
                  order: i,
                });
              });
            })
          )
        )].map(l => {
          return JSON.parse(l);
        }).filter(l => l.name.trim().toLowerCase() !== 'unclassified');

      const default_taxa = {
        'k': 'kingdom',
        'p': 'phylum',
        'c': 'class',
        'o': 'order',
        'f': 'family',
        'g': 'genus',
        's': 'species',
      };

      this.levels = nest()
        .key(t => t.name)
        .entries(uniq_taxa)
        .map(l => {
          let number = null;
          const numbers = l.key.match(/\d+/g);
          if (numbers) {
            number = Number(numbers[0]);
          }
          return {
            name: l.key,
            number: number,
            order: Math.min(...l.values.map(t => t.order)),
          };
        })
        .sort((a, b) => {
          if (a.number && b.number) {
            return a.number - b.number;
          } else {
            return a.order - b.order;
          }
        })
        .map((l, i) => {
          if (l.name in default_taxa) {
            l.name = default_taxa[l.name];
          }
          l.order = i;
          return l;
        });

      this.state.data = visSortBy(
        this,
        this.formatTaxonomyData(this.state.initdata, this.state.level),
        false,
        );
      this.state.preData = this.state.data;
      this.setColorScale(this.state.data);
    }

    this.updateDimensions = this.updateDimensions.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
    // if (this.tooltip.handle) { clearTimeout(this.tooltip.handle) };
    clearTimeout(this.tooltip.handle);
    window.removeEventListener('resize', this.updateDimensions);
  }

  _hoverDatum = (datum, sample, position) => {
    if (datum == null) {
      clearTimeout(this.tooltip.handle);
      this.setState({
        highlightedDatum: null,
        showTooltip: false,
      });
    } else {
      if (!this.state.showTooltip) {
        this.tooltip.handle = setTimeout(() => {
          this.setState({ showTooltip: true });
        }, this.tooltip.duration);
      }
      this.setState({ highlightedDatum: { datum, sample, position }})
    }
  }

  _clickDatum = (datum) => {
    if (!this.filters.hasOwnProperty(this.state.level)) {
      this.filters[this.state.level] = {};
    }
    const filters = this.state.filters;
    if (!this.filters[this.state.level].hasOwnProperty(datum.name)) {
      const sequences = [];
      this.state.preData.forEach(d => {
        d.sequences.forEach(s => {
          if (datum.name === s.name && s.reads > 0) {
            sequences.push(s);
          }
        });
      });
      const values = _sortBy(sequences, (s) => s.reads).map((s, i) => {
        return {
          index: i,
          value: s.reads,
          count: s.reads,
        };
      });
      this.filters[this.state.level][datum.name] = {
        key: datum.name,
        values: values,
        unit: '',
        range: {
          min: values[0],
          max: values[values.length - 1],
        },
        expanded: true,
      };
      filters[datum.name] = this.filters[this.state.level][datum.name];
    }
    const showRightSidebar = Object.keys(filters).length > 0 ? true : false;
    this.updateChartWidth(showRightSidebar);
    this.setState({ filters, showRightSidebar });
  }

  removeFilter(name) {
    const filters = this.state.filters;
    delete filters[name];
    this.filters[this.state.level] = filters;
    const showRightSidebar = Object.keys(filters).length > 0 ? true : false;
    this.updateChartWidth(showRightSidebar);
    const data = this.filterData(filters, this.state.preData, this.state.deleted);
    this.setState({ data, filters, showRightSidebar });
  }

  updateChartWidth(showRightSidebar) {
    if (showRightSidebar) {
      this.metrics.chartWidth = window.innerWidth - (this.metrics.leftSidebar + this.metrics.rightSidebar + this.metrics.nonbarWidth);
    } else {
      this.metrics.chartWidth = window.innerWidth - (this.metrics.leftSidebar + this.metrics.nonbarWidth);
    }
  }

  updateDimensions() {
    this.updateChartWidth(this.state.showRightSidebar);
    this.metrics.chartHeight = window.innerHeight - this.metrics.heightOffset;
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  setColorScale(data) {
    const uniqSequences = [...new Set(
      [].concat(
        ...data.map(d => {
          return [].concat(
            ...d.matches.map((s, i) => {
              return [].concat(
                ...s.taxonomy.map((t,i) => {
                  const taxa = [];
                  let j =0;
                  while (j <= i) {
                    taxa.push(s.taxonomy[j]);
                    j++;
                  }
                  return taxa.join();
                })
              );
            })
          );
        })
      )
    )];
    this.scales.c.domain(uniqSequences);
  }

  setLevel(level) {
    if (!this.filters.hasOwnProperty(level)) {
      this.filters[level] = {};
    }
    const preData = this.updateTaxonomyData(this.state.preData, level, true);
    const deleted = this.updateTaxonomyData(this.state.deleted, level, false);
    const filters = this.filters[level];
    const showRightSidebar = Object.keys(filters).length > 0 ? true : false;
    this.updateChartWidth(showRightSidebar);
    const data = this.filterData(filters, preData, deleted);
    this.setState({level, data, preData, deleted, filters, showRightSidebar});
  }

  // data.data schema: [row(observations), column(samples), count]

  // Move to data container?
  formatTaxonomyData(data, level) {
    let totalDataReads = 0;
    const formatedData = this.updateTaxonomyData(
      data.columns.map((c, i) => {
        const matches = data.data
          .filter(d => d[1] === c.metadata.phinchID)
          .map(d => {
            const row = data.rows[d[0]];
            return {
              id: row.id,
              taxonomy: row.metadata.taxonomy,
              count: d[2]
            };
          });
        totalDataReads += c.reads;
        return {
          id: c.id,
          biomid: c.biomid,
          phinchID: c.metadata.phinchID,
          order: c.order,
          sampleName: c.sampleName,
          phinchName: c.phinchName,
          reads: c.reads,
          sequences: [],
          matches: matches,
        };
      }), level, true);
    this.totalDataReads = totalDataReads;
    return formatedData;
  }

  updateTaxonomyData(data, level, updateSequences) {
    if (updateSequences) {
      this.readsBySequence = {};
    }
    return data.map(d => {
      d.sequences = nest()
        .key(d => d.taxonomy.slice(0, level + 1))
        .entries(d.matches)
        .map(s => {
          const reads = s.values.map(v => v.count).reduce((a, v) => a + v)
          if (updateSequences) {
            if (s.key in this.readsBySequence) {
              this.readsBySequence[s.key] += reads;
            } else {
              this.readsBySequence[s.key] = reads;
            }
          }
          return {
            name: s.key,
            taxonomy: s.values[0].taxonomy,
            reads: reads,
          };
        });
      return d;
    });
  }

  generateDeletedColumns() {
    const xscale = scaleLinear();
    xscale.domain([1, Math.max(...this.state.deleted.map(d => d.reads))])
      .range([1, this.metrics.chartWidth])
      .clamp();
    const deletedColumns = [
      {
        title: (<div className={`${gstyle.heading} ${styles.restore}`}>Restore</div>),
        dataIndex: '',
        key: 'remove',
        render: (r) => (
          <div className={styles.restore}>
            <div className={tstyle.filterCell}>
              <div
                className={styles.delete}
                style={{fontSize: 8}}
                onClick={() => { restoreRows(this, [r]) }}
              >
                ⤴
              </div>
            </div>
          </div>
        ),
      },
      {
        title: (<div className={`${gstyle.heading} ${styles.biomid}`}>BIOM ID</div>),
        dataIndex: 'biomid',
        key: 'biomid',
        render: (t) => (
          <div className={`${styles.biomid} ${styles.rowLabel}`}>
            <div className={tstyle.filterCell}>
              {t}
            </div>
          </div>
        ),
      },
      {
        title: (<div className={`${gstyle.heading} ${styles.phinchName}`}>Phinch Name</div>),
        dataIndex: 'phinchName',
        key: 'phinchName',
        render: (t) => (
          <div className={`${styles.phinchName} ${styles.rowLabel}`}>
            <div className={tstyle.filterCell}>
              {t}
            </div>
          </div>
        ),
      },
      {
        title: '',
        dataIndex: '',
        key: '',
        render: (r) => {
          const sequence = _sortBy(r.sequences, (s) => -s.reads);
          return (
            <div className={tstyle.filterCell}>
              <StackedBar
                data={sequence}
                sample={r}
                width={(this.metrics.chartWidth - 48)}
                height={this.metrics.barHeight}
                xscale={xscale}
                cscale={this.scales.c}
                isPercent={(this.state.mode === 'percent')}
              />
            </div>
          )
        },
      },
    ];
    return deletedColumns;
  }

  renderTicks() {
    const ticks = this.scales.x.ticks(10);
    if (!ticks.length) {
      return '';
    }
    let tickArray = [0].concat(...ticks);
    const xMax = this.scales.x.domain()[1];
    if (this.state.mode !== 'value') {
      tickArray = [];
      for (let i=0; i<11; i++) {
        tickArray.push((xMax / 10) * i);
      }
    }
    return tickArray.map(t => {
      const label = (this.state.mode === 'value') ? (
          t.toLocaleString()
        ) : (
          `${Math.round((t / xMax) * 100).toLocaleString()}%`
        );
      return (
        <g
          key={`g-${t}`}
          transform={`
            translate(${this.scales.x(t)}, ${(this.metrics.lineHeight)})
          `}
        >
          <text
            fontSize={10}
            textAnchor='middle'
            dy={-4}
            dx={-1}
            fill='#808080'
          >
            {label}
          </text>
          <line
            x1={-1}
            y1={0}
            x2={-1}
            y2={this.metrics.chartHeight}
            stroke='#808080'
            strokeWidth={0.5}
          />
        </g>
      );
    });
  }

  filterData(filters, preData, deleted) {
    const deletedSamples = deleted.map(d => d.sampleName);
    const samples = preData.filter(s => {
      let include = true;
      if (deletedSamples.includes(s.sampleName)) {
        include = false;
      }
      Object.keys(filters).forEach((k) => {
        const [sequence] = s.sequences.filter(d => (d.name === k));
        if (sequence) {
          const value = sequence.reads;
          if (value < filters[k].range.min.value || value > filters[k].range.max.value) {
            include = false;
          }          
        }
      });
      return include;
    });
    const data = visSortBy(this, samples, false);    
    return data;
  }

  applyFilters(filters) {
    const data = this.filterData(filters, this.state.preData, this.state.deleted);
    this.setState({filters, data});
  }

  renderFilters() {
    if (Object.keys(this.state.filters).length) {
      const segments = Object.keys(this.state.filters).map(k => {
        return (
          <div
            key={k}
            style={{
              borderBottom: '1px solid #262626',
              margin: '0.5rem',
            }}>
            <FilterChart
              name={k}
              log={true}
              showScale={true}
              fill={this.scales.c(k)}
              stroke={'#333333'}
              handle={this.scales.c(k)}
              data={this.state.filters[k]}
              width={this.metrics.rightSidebar - this.metrics.padding * 3}
              height={this.metrics.rightSidebar / 4}
              filters={this.state.filters}
              update={updateFilters}
              remove={this.removeFilter}
              callback={this.applyFilters}
            />
          </div>
        );
      });
      return (
        <div
          className={`${gstyle.panel} ${styles.leftGutter}`}
          style={{
            width: this.metrics.rightSidebar,
            height: this.metrics.chartHeight,
          }}
        >
          {segments}
        </div>
      );
    } else {
      return null;
    }
  }

  toggleMenu() {
    const showLeftSidebar = !this.state.showLeftSidebar;
    this.metrics.leftSidebar = showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.updateChartWidth(this.state.showRightSidebar);
    this.setState({showLeftSidebar});
  }

  renderBars(data) {
    return data
      .map((d, i) => {
        const sequence = _sortBy(_cloneDeep(d.sequences), (s) => -s.reads);
        const className = (i%2 === 0) ? (styles.grey) : '';
        const miniBars = [];
        Object.keys(this.state.filters).forEach(k => {
          const [miniSequence] = _cloneDeep(sequence).filter(s => (s.name === k));
          if (miniSequence) {
            miniBars.push(
              <div
                key={k}
                style={{
                  paddingTop: '2px',
                  height: this.metrics.miniBarContainerHeight,
                  marginLeft: this.metrics.nonbarWidth - (this.metrics.padding * 4),
                  display: 'block',
                }}
              >
                <StackedBar
                  data={[miniSequence]}
                  sample={d}
                  width={this.metrics.chartWidth}
                  height={(this.metrics.miniBarHeight)}
                  xscale={this.scales.x}
                  cscale={this.scales.c}
                  isPercent={false}
                />
              </div>
            );
          }
        });
        return (
          <div
            key={d.sampleName}
            className={`${styles.row} ${className}`}
            style={{
              height: this.metrics.barContainerHeight + (this.metrics.miniBarContainerHeight * miniBars.length),
            }}
          >
            <div className={styles.rowLabel} style={{width: this.metrics.hideWidth}}>
              <div onClick={() => { removeRows(this, [d]) }}>
                <div className={styles.delete}>x</div>
              </div>
            </div>
            <div className={styles.rowLabel} style={{width: this.metrics.idWidth}}>
              {d.biomid}
            </div>
            <div className={styles.rowLabel} style={{width: this.metrics.nameWidth}}>
              {d.phinchName}
            </div>
            <StackedBar
              onHoverDatum={this._hoverDatum}
              onClickDatum={this._clickDatum}
              data={sequence}
              sample={d}
              width={this.metrics.chartWidth}
              height={this.metrics.barHeight}
              xscale={this.scales.x}
              cscale={this.scales.c}
              isPercent={(this.state.mode === 'percent')}
              highlightedDatum={this.state.highlightedDatum}
            />
            {miniBars}
          </div>
        );
      });
  }

  renderSort() {
    const sortOptions = [
      {
        id: 'biomid',
        name: 'BIOM ID',
      },
      {
        id: 'phinchName',
        name: 'Phinch Name',
      },
      {
        id: 'reads',
        name: 'Sequence Reads',
      },
    ];
    /* 
      TODO: add deselect when manually sorted
    */
    const options = sortOptions.map(o => {
      return <option key={o.id} value={o.id}>{o.name}</option>;
    });
    const onSelectChange = (event) => {
      this.sort.key = event.target.value;
      visSortBy(this, this.state.data, true);
    };
    const radioOptions = [
      {
        name: 'Ascending',
        value: true,
      },
      {
        name: 'Descending',
        value: false,
      },
    ];
    const onRadioChange = (event) => {
      this.sort.reverse = (event.target.name === 'Ascending');
      visSortBy(this, this.state.data, true);
    }
    const buttons = radioOptions.map(o => {
      const checked = this.sort.reverse === o.value ? 'checked' : '';
      return (
        <div key={o.name} className={styles.inlineControl}>
          <input
            type='radio'
            id={o.name}
            key={o.name}
            name={o.name}
            checked={checked}
            onChange={onRadioChange}
          />
          <label htmlFor={o.name}>{o.name}</label>
        </div>
      );
    });
    return (
      <div className={styles.inlineControl}>
        <select
          id='sortSelect'
          onChange={onSelectChange}
          className={styles.inlineControl}
        >
          {options}
        </select>
        {buttons}
      </div>
    );
  }

  renderToggle() {
    const buttons = [
      {
        id: 'percent',
        name: 'Relative',
      },
      {
        id: 'value',
        name: 'Absolute',
      },
    ];
    return buttons.map(b => {
      const onRadioChange = (event) => {
        this.setState({mode: event.target.id});
      }
      const checked = this.state.mode === b.id ? 'checked' : '';
      return (
        <div key={b.id} className={styles.inlineControl}>
          <input
            type='radio'
            id={b.id}
            name={b.name}
            checked={checked}
            onChange={onRadioChange}
          />
          <label htmlFor={b.value}>{b.name}</label>
        </div>
      );
    });
  }

  renderTopSequences(seqObj) {
    const rotation = this.state.showSequences ? -180 : 0;
    const button = (
        <div
          className={`${gstyle.heading}`}
          style={{
            cursor: 'pointer',
          }}
          onClick={() => {
            const showSequences = !this.state.showSequences;
            this.setState({showSequences});
          }}
        >
          Top Sequences <div className={gstyle.arrow} style={{transform: `rotate(${rotation}deg)`}}>⌃</div>
        </div>
      );
    const columns = [
      {
        title: (<div className={`${gstyle.heading} ${styles.rank}`}>Rank</div>),
        dataIndex: 'rank',
        key: 'rank',
        render: (d) => {
          return (
            <div className={styles.rank}>
              <div className={tstyle.visCell}>
                {d.toLocaleString()}
              </div>
            </div>
          );
        }
      },
      {
        title: (<div className={`${gstyle.heading} ${styles.name}`}>Name</div>),
        dataIndex: 'name',
        key: 'name',
        render: (d) => {
          return (
            <div className={styles.name}>
              <div className={tstyle.visCell}>
                {d}
              </div>
            </div>
          );
        }
      },
      {
        title: (<div className={`${gstyle.heading} ${styles.reads}`}>Reads</div>),
        dataIndex: 'reads',
        key: 'reads',
        render: (d) => {
          return (
            <div className={styles.reads}>
              <div className={tstyle.visCell}>
                {d.toLocaleString()}  
              </div>
            </div>
          );
        }
      },
    ];
    const sequences = Object.keys(seqObj).map(k => {
      return {
        name: k,
        reads: seqObj[k],
      };
    }).sort((a, b) => {
      return b.reads - a.reads;
    }).map((s, i) => {
      s.rank = (i + 1);
      return s;
    });
    const table = this.state.showSequences ? (
        <div className={styles.modaltop}>
          <Table
            className={tstyle.table}
            rowClassName={(r, i) => {
              if (i%2 === 0) {
                return styles.grey;
              }
              return;
            }}
            scroll={{ y: (332) }}
            columns={columns}
            data={sequences}
            rowKey={row => `d-${row.name}`}
          />
        </div>
      ) : '';
    return (
      <div>
        {button}
        {table}
      </div>
    );
  }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    if (this.state.data.length) {
      this.metrics.height = (this.state.data.length * this.metrics.lineHeight);
    }

    const levels = this.levels.map((l, i) => {
      const selected = (l.order <= this.state.level) ? styles.selected : '';
      return (
        <div
          key={l.name}
          className={`${gstyle.button} ${selected} ${styles.selector}`}
          onClick={() => this.setLevel(l.order)}
        >
          {(i === 0) ? '' : (<div className={styles.dash}>—</div>)}
          {l.name}
        </div>
      );
    });

    this.scales.x
      .domain([1, Math.max(...this.state.data.map(d => d.reads))])
      .range([1, this.metrics.chartWidth])
      .clamp();

    const bars = this.renderBars(this.state.data);
    const sortSelect = this.renderSort();
    const viewToggle = this.renderToggle();
    const topSequences = this.renderTopSequences(this.readsBySequence);
    const ticks = this.renderTicks();

    const tooltip = this.state.showTooltip ?
      <StackedBarTooltip {...this.state.highlightedDatum} totalDataReads={this.totalDataReads} />
      : null;

    this.deletedColumns = this.generateDeletedColumns();

    const displayFilters = this.renderFilters();

    return (
      <div className={gstyle.container}>
        {redirect}
        <div className={gstyle.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <Summary summary={this.state.summary} datalength={this.state.data.length} />
        <div>
          <div style={{
            display: 'inline-block',
            margin: '0 0.5rem',
          }}>
            Level
          </div>
          {levels}
        </div>
        <div style={{display: 'inline-block'}}>
          <div style={{
            display: 'inline-block',
            margin: '0 0.5rem',
          }}>
            <label htmlFor='sortSelect'>
              Sort by:
            </label>
          </div>
          {sortSelect}
        </div>
        <div style={{display: 'inline-block'}}>
          <div style={{display: 'inline-block'}} className={styles.controlMargin}>
            {viewToggle}
          </div>
        </div>
        <div style={{display: 'inline-block', float: 'right'}}>
          <div style={{display: 'inline-block'}} className={styles.controlMargin}>
            {topSequences}
          </div>
        </div>
        <div style={{
          position: 'relative',
          textAlign: 'center',
          height: this.metrics.lineHeight * 2,
          fontSize: 12,
        }}>
          Sequence Reads
          <svg style={{
            position: 'absolute',
            left: this.metrics.leftSidebar,
            pointerEvents: 'none',
            paddingLeft: this.metrics.padding * 0.5,
            width: (this.state.width - (this.metrics.padding * 2.5)),
            height: (this.metrics.chartHeight + (this.metrics.lineHeight * 2)),
          }}>
            <g transform={`
              translate(
                ${this.metrics.idWidth + this.metrics.hideWidth + this.metrics.nameWidth},
                ${this.metrics.lineHeight}
              )
            `}>
              {ticks}
            </g>
          </svg>
        </div>
        <SideMenu
          showLeftSidebar={this.state.showLeftSidebar}
          leftSidebar={this.metrics.leftSidebar}
          leftMin={this.metrics.left.min}
          chartHeight={this.metrics.chartHeight}
          items={this.menuItems}
          toggleMenu={this.toggleMenu}
        />
        <div
          className={`${gstyle.panel} ${styles.leftGutter}`}
          style={{
            backgroundColor: '#ffffff',
            color: '#808080',
            width: (this.metrics.chartWidth + this.metrics.nonbarWidth - this.metrics.padding * 2),
            height: this.metrics.chartHeight,
          }}
        >
          {bars}
          {tooltip}
        </div>
        {displayFilters}
        <RemovedRows
          deleted={this.state.deleted}
          deletedColumns={this.deletedColumns}
        />
      </div>
    );
  }
}
