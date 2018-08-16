import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Table from 'rc-table';
import _sortBy from 'lodash.sortby';
import _cloneDeep from 'lodash.clonedeep';
import { nest } from 'd3-collection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';

import { updateFilters, removeRows, restoreRows, visSortBy, getSortArrow } from '../FilterFunctions';
import { setProjectFilters, getProjectFilters } from '../projects.js';
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
      names: [],
      data: [],
      preData: [],
      deleted: [],
      tags: [],
      rowTags: {},
      filters: {},
      width: window.innerWidth,
      height: window.innerHeight,
      redirect: null,
      level: 1,
      highlightedDatum: null,
      showTooltip: false,
      showTags: false,
      mode: 'percent',
      labelKey: 'phinchName',
      showSequences: false,
      showRightSidebar: false,
      showLeftSidebar: false,
      result: null,
    };

    // move to config or own file
    this.menuItems = [
      {
        id: 'save',
        name: 'Save',
        action: () => { 
          this.save(this.setResult);
        },
        icon: (<div className={gstyle.arrow} style={{transform: `rotate(${-180}deg)`}}>⌃</div>),
      },
      {
        id: 'filter',
        name: 'Back',
        action: () => { 
          this.save(() => (this.setState({ redirect: '/Filter' })));
        },
        icon: (<div className={gstyle.arrow} style={{transform: `rotate(${-90}deg)`}}>⌃</div>),
      },
    ];

    this.filters = {};

    this.tooltip = {
      timer: null,
      duration: 1500,
    };

    // duplicate values in state - move to state?
    this.sort = {
      reverse: true,
      key: 'biomid',
      type: 'percent',
      show: 'phinchName',
    };


    // Move this to data
    const tagColors = [
      '#ff0000',
      '#ffc400',
      '#00adff',
      '#00ffc4',
    ];
    this.state.tags = [
      {
        id: 'none',
        color: null,
        name: 'None',
        selected: true
      }, ...tagColors.map((c, i) => {
        return {
          id: `tag-${i}`,
          name: `Tag ${i}`,
          color: c,
          selected: true,
        };
      })
    ];

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

      // Break this whole chunk into a function or something
      // 
      this.init = getProjectFilters(this.state.summary.path, this.state.summary.name, 'vis');
      //
      this.state.names = this.init.names;
      this.state.level = (this.init.level !== undefined) ? this.init.level : this.state.level;
      this.filters = this.init.filters ? this.init.filters : {};
      this.state.deleted = this.init.deleted ? this.init.deleted : []; 
      this.state.tags = this.init.tags ? this.init.tags : this.state.tags;
      this.state.rowTags = this.init.rowTags ? this.init.rowTags : this.state.rowTags;
      // 
      // Ugly... 
      this.state.showLeftSidebar = (this.init.showLeftSidebar !== undefined) ? (
          this.init.showLeftSidebar
        ) : this.state.showLeftSidebar;
      this.metrics.leftSidebar = this.state.showLeftSidebar ?
        this.metrics.left.max : this.metrics.left.min;
      //
      // Consolidate these  VVVV
      this.sort = this.init.sort ? this.init.sort : this.sort;
      this.state.labelKey = this.sort.show;
      this.state.mode = this.sort.type;
      //

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
    this.updatePhinchName = this.updatePhinchName.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleLog = this.toggleLog.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    this.setLevel(this.state.level);
  }

  componentWillUnmount() {
    clearTimeout(this.tooltip.handle);
    window.removeEventListener('resize', this.updateDimensions);
  }

  save = (callback) => {
    const viewMetadata = {
      type: 'vis',
      level: this.state.level,
      filters: this.filters,
      deleted: this.state.deleted,
      sort: this.sort,
      tags: this.state.tags,
      rowTags: this.state.rowTags,
      showLeftSidebar: this.state.showLeftSidebar,
    };
    setProjectFilters(
      this.state.summary.path,
      this.state.summary.name,
      this.state.names,
      viewMetadata,
      (value) => {
        callback(value);
      },
      );
  }

  setResult = (value) => {
    const result = value;
    this.timeout = setTimeout(() => {
      this.clearResult();
    }, 3000);
    // const loading = false;
    // this.setState({result, loading});
    this.setState({result});
  }

  clearResult = () => {
    const result = null;
    this.setState({result});
  }

  _toggleTag = (datum, tag, isRemoved) => {
    if (datum.tags[tag.id]) {
      delete datum.tags[tag.id];
    } else {
      datum.tags[tag.id] = tag;
    }
    const rowTags = this.state.rowTags;
    rowTags[datum.sampleName] = datum.tags;
    // ugly 
    if (isRemoved) {
      const deleted = this.state.deleted.map((d) => {
        if (d.sampleName === datum.sampleName) {
          d.tags = datum.tags;
        }
        return d;
      });
      this.setState({ deleted });
    } else {
      const data = this.state.data.map((d) => {
        if (d.sampleName === datum.sampleName) {
          d.tags = datum.tags;
        }
        return d;
      });
      this.setState({ data });
    }
  }

  _toggleTags = () => {
    const showTags = !this.state.showTags;
    this.setState({ showTags });
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
      const totalReads = sequences.map(s => s.reads).reduce((s, v) => s + v);
      const values = _sortBy(sequences, (s) => s.reads).map((s, i) => {
        return {
          index: i,
          value: s.reads,
          count: (s.reads === 0) ? 1 : s.reads,
          // percent: Math.floor((s.reads / totalReads) * 100),
          percent: s.reads / totalReads,
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
        log: true,
        expanded: true,
      };
      filters[datum.name] = this.filters[this.state.level][datum.name];
    }
    const showRightSidebar = Object.keys(filters).length > 0 ? true : false;

    this.updateChartWidth(showRightSidebar);
    this.setState({ filters, showRightSidebar });
  }

  toggleLog(name) {
    const filters = this.state.filters;
    filters[name].log = !filters[name].log;
    this.filters[this.state.level] = filters;
    this.setState({ filters });
  }

  removeFilter(name) {
    const filters = this.state.filters;
    delete filters[name];
    this.filters[this.state.level] = filters;
    const showRightSidebar = Object.keys(filters).length > 0 ? true : false;
    this.updateChartWidth(showRightSidebar);
    const data = this.filterData(filters, this.state.tags, this.state.preData, this.state.deleted);
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
    const data = this.filterData(filters, this.state.tags, preData, deleted);
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
        let phinchName = c.phinchName
        if (this.state.names[c.sampleName]) {
          phinchName = this.state.names[c.sampleName];
        }
        const tags = this.state.rowTags[c.sampleName] ? this.state.rowTags[c.sampleName] : {};
        Object.keys(tags).forEach(k => {
          const [tag] = this.state.tags.filter(t => t.id === k);
          tags[k] = tag;
        });
        const collectionDate = c.metadata.collection_date ? (
            new Date(c.metadata.collection_date).toLocaleString().split(', ')[0]
          ) : '';
        return {
          id: c.id,
          biomid: c.biomid,
          phinchID: c.metadata.phinchID,
          order: c.order,
          sampleName: c.sampleName,
          phinchName: phinchName,
          reads: c.reads,
          sequences: [],
          date: collectionDate,
          tags: tags,
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

  filterData(filters, tags, preData, deleted) {
    const deletedSamples = deleted.map(d => d.sampleName);
    const samples = preData.filter((s, i) => {
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
      const showNoneTags = (tags.filter(t => t.selected && t.id === 'none').length > 0);
      const countTags = Object.keys(s.tags).length;
      const countSelectedTags = Object.keys(s.tags).filter(t => !s.tags[t].selected).length;
      if (
        (!showNoneTags && countTags === 0)
          ||
        (countTags > 0 && countTags === countSelectedTags)
      ) {
        include = false;
      }
      return include;
    });
    const data = visSortBy(this, samples, false);    
    return data;
  }

  applyFilters(filters) {
    const data = this.filterData(filters, this.state.tags, this.state.preData, this.state.deleted);
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
              showScale={true}
              showCircle={true}
              fill={this.scales.c(k)}
              stroke={'#333333'}
              handle={this.scales.c(k)}
              data={this.state.filters[k]}
              width={this.metrics.rightSidebar - this.metrics.padding * 3.25}
              height={this.metrics.rightSidebar / 4}
              filters={this.state.filters}
              update={updateFilters}
              remove={this.removeFilter}
              toggleLog={this.toggleLog}
              callback={this.applyFilters}
            />
          </div>
        );
      });
      return (
        <div
          className={`${gstyle.panel} ${gstyle.darkbgscrollbar}`}
          style={{
            borderTop: '1px solid #262626',
            position: 'fixed',
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
      this.state.tags,
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
    const data = this.filterData(
      this.state.filters,
      this.state.tags,
      this.state.preData,
      this.state.deleted,
      );
    const highlightedDatum = null;
    const showTooltip = false;
    this.setState({ data, highlightedDatum, showTooltip });
  }

  updatePhinchName(e, r, isRemoved) {
    // ugly - similar to function in Filter.js
    const names = this.state.names;
    if (isRemoved) {
      const deleted = this.state.deleted.map((d) => {
        if (d.sampleName === r.sampleName) {
          d.phinchName = e.target.value;
        }
        names[d.sampleName] = d.phinchName;
        return d;
      });
      this.setState({ deleted });
    } else {
      const data = this.state.data.map((d) => {
        if (d.sampleName === r.sampleName) {
          d.phinchName = e.target.value;
        }
        names[d.sampleName] = d.phinchName;
        return d;
      });
      this.setState({ data, names });
    }
  }

  updateTagName(event, tag) {
    const tags = this.state.tags.map(t => {
      if (t.id === tag.id) {
        t.name = event.target.value;
      }
      return t;
    });
    this.setState({ tags });
  }

  filterByTag(event, tag) {
    let tags = this.state.tags.map(t => {
      if (tag.id === t.id) {
        t.selected = event.target.checked;
      }
      return t;
    });
    const data = this.filterData(
      this.state.filters,
      tags,
      this.state.preData,
      this.state.deleted,
      );
    this.setState({ tags, data });
  }

  renderBars(data, isRemoved) {
    return data
      .map((d, i) => {
        return (
          <StackedBarRow
            key={d.id}
            data={d}
            index={i}
            labelKey={this.state.labelKey}
            filters={this.state.filters}
            metrics={this.metrics}
            scales={this.scales}
            tags={this.state.tags.filter(t => t.id !== 'none')}
            toggleTag={this._toggleTag}
            isPercent={(this.state.mode === 'percent')}
            isRemoved={isRemoved}
            highlightedDatum={this.state.highlightedDatum}
            removeDatum={() => { removeRows(this, [d]) }}
            restoreDatum={() => { restoreRows(this, [d]) }}
            hoverDatum={this._hoverDatum}
            clickDatum={this._clickDatum}
            updatePhinchName={this.updatePhinchName}
          />
        );
      });
  }

  renderShow() {
    const showOptions = [
      {
        id: 'phinchName',
        name: 'Phinch Name',
      },
      {
        id: 'sampleName',
        name: 'Sample Name',
      },
    ];
    const options = showOptions.map(o => {
      return <option key={o.id} value={o.id}>{o.name}</option>;
    });
    const onSelectChange = (event) => {
      const labelKey = event.target.value;
      this.sort.show = labelKey;
      this.setState({ labelKey });
    };
    return (
      <div className={styles.inlineControl}>
        <label htmlFor='showSelect'>Show:</label>
        <select
          id='showSelect'
          onChange={onSelectChange}
          className={styles.inlineControl}
          value={this.state.labelKey}
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
        <label htmlFor='sortSelect'>Sort by:</label>
        <select
          id='sortSelect'
          onChange={onSelectChange}
          className={styles.inlineControl}
          value={this.sort.key}
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
        this.sort.type = event.target.id;
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
    const metrics = {
      width: (this.metrics.chartWidth + this.metrics.nonbarWidth) - (4 + 30 + 20),
      rank: 48,
      circle: 24,
      reads: 108,
    };
    metrics.name = metrics.width - (metrics.rank + metrics.circle + metrics.reads);
    return sequences.map((s, i) => {
      const color = this.scales.c(s.name);
      const seqs = s.name.replace(/[a-zA-Z]__/g,'').trim().split(',').filter(q => q);
      const name = seqs[seqs.length - 1];
      const highlighted = this.state.filters.hasOwnProperty(s.name) ? (
          styles.seqRowHighlighted
        ) : '';
      return (
        <div
          key={`${s.name}-${i}`}
          style={{
            backgroundColor: (i%2 === 0) ? '#121212' : '#000000',
            color: highlighted ? color : '#ffffff',
          }}
          className={`${styles.seqRow} ${highlighted}`}
          onClick={() => {
            if (highlighted) {
              this.removeFilter(s.name);
            } else {
              this._clickDatum(s);
            }
          }}
        >
          <div
            className={`${styles.cell} ${styles.rank}`}
            style={{width: metrics.rank}}
          >
            {s.rank.toLocaleString()}
          </div>
          <div
            className={`${styles.cell} ${styles.circle}`}
            style={{width: metrics.circle}}
          >
            <div
              className={gstyle.circle}
              style={{background: color}}
            />
          </div>
          <div
            className={`${styles.cell} ${styles.name}`}
            style={{width: metrics.name}}
          >
            {name}
          </div>
          <div
            className={`${styles.cell} ${styles.reads}`}
            style={{width: metrics.reads}}
          >
            {s.reads.toLocaleString()}
          </div>
        </div>
      );
    });
  }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    const levels = (
      <div className={styles.inlineControl}>
        {
          this.levels.map((l, i) => {
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
          })
        }
      </div>
    );

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
    
    //
    // Breakout -> function renderTagFilter();
    const tagFilter = this.state.showTags ? (
        <div key='tagFilter' className={styles.tagFilter}>
          <div
            className={gstyle.close}
            style={{
              margin: '4px 0',
            }}
            onClick={() => { this._toggleTags() }}
          >x</div>
          {
            this.state.tags.map(t => {
              const hasColor = t.color ? true : false;
              return (
                <div
                  key={`tf-${t.id}`}
                  style={{
                    padding: '2px 0',
                  }}
                >
                  <label className={styles.checkbox}>
                    <input
                      type='checkbox'
                      checked={t.selected}
                      onChange={(e) => this.filterByTag(e, t)}
                    />
                    <span className={styles.checkmark}></span>
                  </label>
                  {
                    hasColor ? (
                      <div className={gstyle.circle} style={{
                        backgroundColor: t.color,
                        borderColor: '#333333',
                        marginLeft: '4px',
                        opacity: t.selected ? 1 : 0.5,
                      }} />
                    ) : ''
                  }
                  <input
                    className={`${gstyle.input} ${styles.tagName} ${t.selected ? styles.selected : ''}`}
                    type="text"
                    value={t.name}
                    onChange={(e) => this.updateTagName(e, t)}
                    disabled={!hasColor}
                  />
                </div>
              );
            })
          }
        </div>
      ) : '';
    const showTags = this.state.showTags ? styles.selected : '';
    const tags = (
      <div
        className={styles.inlineControl}
      >
        <div
          className={styles.inlineControl}
          onClick={this._toggleTags}
        >
          <div key='tags' className={`${styles.selector} ${styles.button} ${showTags}`}>Tags</div>
          {
            this.state.tags.map(t => {
              return t.color ? (
                <div
                  key={`c-${t.id}`}
                  className={gstyle.circle}
                  style={{
                    background: t.color,
                    opacity: t.selected ? 1 : 0.5,
                    verticalAlign: 'middle',
                  }}
                />
              ) : '';
            })
          }
        </div>
        {tagFilter}
      </div>
    );
    //

    const result = this.state.result ? (
      <div 
        className={gstyle.button}
        style={{
          position: 'absolute',
          top: '148px',
          left: '90px',
          zIndex: 10,
          fontWeight: 400,
          background: (this.state.result === 'error') ? '#FF0000' : '#00FF00',
        }}
        onClick={this.clearResult}
      >
          {this.state.result}
      </div>
    ) : '';

    return (
      <div className={gstyle.container}>
        {redirect}
        {result}
        <div className={gstyle.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <div className={gstyle.header}>
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
              {tags}
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
          className={`${gstyle.panel} ${gstyle.noscrollbar}`}
          style={{width: this.metrics.chartWidth + this.metrics.nonbarWidth}}
        >
          <div
            className={styles.axis}
            style={{
              width: (this.metrics.chartWidth + this.metrics.nonbarWidth),
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
              width: (this.state.width - (this.metrics.padding * 2)),
              height: (this.metrics.chartHeight + (this.metrics.lineHeight * 2)),
            }}>
              <g transform={`
                translate(
                  ${this.metrics.barInfoWidth},
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
              width: (this.metrics.chartWidth + this.metrics.nonbarWidth),
              height: this.metrics.chartHeight,
            }}
          >
            {this.renderBars(this.state.data, false)}
            {tooltip}
          </div>
        </div>
        {this.renderFilters()}
        <Modal
          title={'Top Sequences'}
          buttonPosition={{
            position: 'absolute',
            bottom: 0,
            marginBottom: '-8px',
            left: this.metrics.leftSidebar + this.metrics.barInfoWidth + (this.metrics.padding / 2) + 2,
          }}
          modalPosition={{
            position: 'absolute',
            bottom: this.metrics.padding * 2,
            left: this.metrics.leftSidebar,
            width: this.metrics.chartWidth + this.metrics.nonbarWidth - 4,
          }}
          data={this.renderTopSequences(sequences)}
          badge={false}
        />
        <Modal
          title={'Archived Samples'}
          buttonPosition={{
            position: 'absolute',
            bottom: 0,
            marginBottom: '-8px',
            left: this.metrics.leftSidebar + this.metrics.barInfoWidth + this.metrics.padding + 2 + 130,
          }}
          modalPosition={{
            position: 'absolute',
            bottom: this.metrics.padding * 2,
            left: this.metrics.leftSidebar,
            width: this.metrics.chartWidth + this.metrics.nonbarWidth - 4,
          }}
          data={this.renderBars(this.state.deleted, true)}
          badge={true}
        />
      </div>
    );
  }
}
