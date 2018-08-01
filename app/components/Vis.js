import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Table from 'rc-table';
import _sortBy from 'lodash.sortby';
import _cloneDeep from 'lodash.clonedeep';
import { nest } from 'd3-collection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';

import { updateFilters, removeRows, restoreRows, visSortBy, getSortArrow } from '../FilterFunctions';
import DataContainer from '../DataContainer';
import palette from '../palette';

import Search from './Search';
import SideMenu from './SideMenu';
import StackedBarRow from './StackedBarRow';
import StackedBarTooltip from './StackedBarTooltip';
import FilterChart from './FilterChart';
import RemovedRows from './RemovedRows';
import Summary from './Summary';
import Modal from './Modal';

import styles from './Vis.css';
import tstyle from './tables.css';
import gstyle from './general.css';
import logo from 'images/phinch-logo.png';

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

    this.sortOptions = [
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
      lineHeight: 14,
      barContainerHeight: 56,
      barHeight: 44,
      miniBarContainerHeight: 8,
      miniBarHeight: 6,
      height: 600,
      hideWidth: 20,
      idWidth: 28,
      nameWidth: 140,
      barInfoWidth: 188,
      heightOffset: 158,
      leftSidebar: 25,
      left: {
        min: 25,
        max: 119,
      },
      rightSidebar: 216,
    };

    // this.metrics.nonbarWidth = (this.metrics.padding * 3) + (this.metrics.idWidth + this.metrics.hideWidth + this.metrics.nameWidth);
    this.metrics.nonbarWidth = (this.metrics.padding * 3) + (this.metrics.barInfoWidth);
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

    this.onSuggestionHighlighted = this.onSuggestionHighlighted.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.onValueCleared = this.onValueCleared.bind(this);

    this.updateDimensions = this.updateDimensions.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
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
      this.setState({ highlightedDatum: { datum, sample, position }});
    }
  }

  _clickDatum = (datum) => {
    if (!this.filters.hasOwnProperty(this.state.level)) {
      this.filters[this.state.level] = {};
    }
    const filters = this.state.filters;
    if (!this.filters[this.state.level].hasOwnProperty(datum.name)) {
      // const sequences = [{reads: 0}];
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
          count: (s.reads === 0) ? 1 : s.reads,
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

  renderTicks() {
    const tickCount = Math.floor(this.metrics.chartWidth / 64);
    const ticks = this.scales.x.ticks(tickCount);
    if (!ticks.length) {
      return '';
    }
    let tickArray = [...new Set([0].concat(...ticks))];
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
            fontFamily='IBM Plex Sans Condensed'
            textAnchor='middle'
            dy={-4}
            dx={2}
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
              display: 'inline-block',
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
          className={`${gstyle.panel}`}
          style={{
            borderTop: '1px solid #262626',
            width: this.state.showRightSidebar ? this.metrics.rightSidebar : 0,
            height: this.metrics.chartHeight + this.metrics.lineHeight * 2,
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

  onSuggestionSelected(e, { suggestion }) {
    const data = this.filterData(
      this.state.filters,
      this.state.preData,
      this.state.deleted,
    ).filter(d => {
      return d.sequences.map(d => d.name).includes(suggestion.name);
    });
    const highlightedDatum = {
      datum: suggestion,
      sample: null,
      position: null,
    };
    const showTooltip = false;
    this.setState({ data, highlightedDatum, showTooltip });
  }

  onSuggestionHighlighted({ suggestion }) {
    if (suggestion === null) {
      return;
    }
    const highlightedDatum = {
      datum: suggestion,
      sample: null,
      position: null,
    };
    const showTooltip = false;
    this.setState({ highlightedDatum, showTooltip });
  }

  onValueCleared() {
    // const data = this.state.preData;
    const data = this.filterData(
      this.state.filters,
      this.state.preData,
      this.state.deleted,
      );
    const highlightedDatum = null;
    const showTooltip = false;
    this.setState({ data, highlightedDatum, showTooltip });
  }

  renderBars(data, isRemoved) {
    return data
      .map((d, i) => {
        return (
          <StackedBarRow
            key={d.id}
            data={d}
            index={i}
            filters={this.state.filters}
            metrics={this.metrics}
            scales={this.scales}
            isPercent={(this.state.mode === 'percent')}
            isRemoved={isRemoved}
            highlightedDatum={this.state.highlightedDatum}
            removeDatum={() => { removeRows(this, [d]) }}
            restoreDatum={() => { restoreRows(this, [d]) }}
            hoverDatum={this._hoverDatum}
            clickDatum={this._clickDatum}
          />
        );
      });
  }

  renderShow() {
    const options = this.sortOptions.map(o => {
      return <option key={o.id} value={o.id}>{o.name}</option>;
    });
    const onSelectChange = (event) => {
      console.log('change display now');
      // this.sort.key = event.target.value;
      // visSortBy(this, this.state.data, true);
    };
    return (
      <div className={styles.inlineControl}>
        <label htmlFor='showSelect'>Show:</label>
        <select
          id='showSelect'
          onChange={onSelectChange}
          className={styles.inlineControl}
        >
          {options}
        </select>
      </div>
    );
  }

  renderSort() {
    /* 
      TODO: add deselect when manually sorted
    */
    const options = this.sortOptions.map(o => {
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
        <label htmlFor='sortSelect'>Sort by:</label>
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

  renderTopSequences(sequences) {
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
        title: (<div
                  style={{
                    width: `${this.metrics.chartWidth + this.metrics.nonbarWidth - (4 * 2 + 180)}px`
                  }}
                  className={`${gstyle.heading} ${styles.name}`}
                >
                  Name
                </div>),
        dataIndex: 'name',
        key: 'name',
        render: (d) => {
          return (
            <div
              style={{
                width: `${this.metrics.chartWidth + this.metrics.nonbarWidth - (4 * 2 + 180)}px`
              }}
              className={styles.name}
            >
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

    return (
      <Table
        className={tstyle.table}
        rowClassName={(r, i) => {
          if (i%2 === 0) {
            return gstyle.grey;
          }
          return;
        }}
        scroll={{ y: (292) }}
        columns={columns}
        data={sequences}
        rowKey={row => `d-${row.name}`}
      />
    );
  }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    const levels = this.levels.map((l, i) => {
      const selected = (l.order <= this.state.level) ? styles.selected : '';
      return (
        <div key={l.name} style={{display: 'inline-block'}}>
          {(i === 0) ? '' : (<div className={`${selected} ${styles.dash}`}>—</div>)}
          <div
            className={`${selected} ${styles.selector}`}
            onClick={() => this.setLevel(l.order)}
          >
            {l.name}
          </div>
        </div>
      );
    });

    this.scales.x
      .domain([0, Math.max(...this.state.data.map(d => d.reads))])
      .range([0, this.metrics.chartWidth])
      .clamp();

    const color = this.state.highlightedDatum ? (
        this.scales.c(this.state.highlightedDatum.datum.name)
      ) : '';
    const tooltip = this.state.showTooltip ? (
        <StackedBarTooltip
          {...this.state.highlightedDatum}
          totalDataReads={this.totalDataReads}
          color={color}
        />
      ) : null;

    const sequences = Object.keys(this.readsBySequence)
      .map(k => {
        return {
          name: k,
          reads: this.readsBySequence[k],
        };
      }).sort((a, b) => {
        return b.reads - a.reads;
      }).map((s, i) => {
        s.rank = (i + 1);
        return s;
      });

    return (
      <div className={gstyle.container}>
        {redirect}
        <div className={gstyle.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <div className={styles.heading}>
          <Summary summary={this.state.summary} datalength={this.state.data.length} />
          <div className={styles.controls}>
            {/* ROW 1 */}
            <div className={styles.controlRow}>
              <Search
                options={sequences}
                onValueCleared={this.onValueCleared}
                onSuggestionSelected={this.onSuggestionSelected}
                onSuggestionHighlighted={this.onSuggestionHighlighted}
              />
              {this.renderShow()}
              {this.renderSort()}
              {this.renderToggle()}
            </div>
            {/* ROW 2 */}
            <div className={styles.controlRow}>
              {levels}
              <Modal
                title={'Top Sequences'}
                rotation={0}
                buttonPosition={{
                  position: 'absolute',
                  top: 95,
                  right: this.metrics.padding,
                }}
                modalPosition={{
                  position: 'absolute',
                  top: 130,
                  left: this.metrics.leftSidebar + 4,
                  width: this.metrics.chartWidth + this.metrics.nonbarWidth - (4 * 2),
                }}
                data={[this.renderTopSequences(sequences)]}
              />
            </div>
          </div>
        </div>
        <SideMenu
          showLeftSidebar={this.state.showLeftSidebar}
          leftSidebar={this.metrics.leftSidebar}
          leftMin={this.metrics.left.min}
          chartHeight={this.metrics.chartHeight + this.metrics.lineHeight * 2}
          items={this.menuItems}
          toggleMenu={this.toggleMenu}
        />
        <div
          className={gstyle.panel}
          style={{width: this.metrics.chartWidth + this.metrics.nonbarWidth}}
        >
          <div
            className={styles.axis}
            style={{
              width: (this.metrics.chartWidth + this.metrics.nonbarWidth - this.metrics.padding),
              height: this.metrics.lineHeight * 2,
              fontSize: 12,
            }}
          >
            Sequence Reads
            <svg style={{
              position: 'absolute',
              left: this.metrics.leftSidebar + 3,
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
                {this.renderTicks()}
              </g>
            </svg>
          </div>
          <div
            className={`${gstyle.panel} ${styles.leftGutter}`}
            style={{
              backgroundColor: '#ffffff',
              display: 'inline-block',
              color: '#808080',
              width: (this.metrics.chartWidth + this.metrics.nonbarWidth - this.metrics.padding),
              height: this.metrics.chartHeight,
            }}
          >
            {this.renderBars(this.state.data, false)}
            {tooltip}
          </div>
        </div>
        {this.renderFilters()}
        <Modal
          title={'Removed Samples'}
          rotation={180}
          buttonPosition={{
            position: 'absolute',
            bottom: 0,
            left: this.metrics.leftSidebar + 4,
          }}
          modalPosition={{
            position: 'absolute',
            bottom: 0,
            left: this.metrics.leftSidebar + 4,
            width: this.metrics.chartWidth + this.metrics.nonbarWidth - (4 * 2),
          }}
          data={this.renderBars(this.state.deleted, true)}
        />
      </div>
    );
  }
}
