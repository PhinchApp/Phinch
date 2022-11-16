import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

import _sortBy from 'lodash.sortby';
import _debounce from 'lodash.debounce';
import _cloneDeep from 'lodash.clonedeep';
import { nest } from 'd3-collection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';

import logo from 'images/phinch.svg';
import back from 'images/back.svg';
import save from 'images/save.svg';

import {
  updateFilters,
  removeRows,
  restoreRows,
  visSortBy,
  countObservations
} from '../filterfunctions';
import { setProjectFilters, getProjectFilters } from '../projects';
import handleExportButton from '../export';
import DataContainer from '../datacontainer';
import { pageView } from '../analytics';
import palette from '../palette';

import Search from './Search';
import SideMenu from './SideMenu';
import Sequence from './Sequence';
import StackedBarRow from './StackedBarRow';
import StackedBarTicks from './StackedBarTicks';
import StackedBarTooltip from './StackedBarTooltip';
import StackedBarsSVG from './StackedBarsSVG';
import FilterChart from './FilterChart';
import Summary from './Summary';
import Modal from './Modal';
import Sankey from './Sankey/'
import styles from './Vis.css';
import gstyle from './general.css';
import classNames from 'classnames';
import SpotlightWithToolTip from './SpotlightWithToolTip';

import needHelp from 'images/needHelp.svg';
import needHelpHover from 'images/needHelpHover.svg';
import closeHelp from 'images/closeHelpHP.svg';

import help1 from 'images/help1.svg';
import help1Hover from 'images/help1Hover.svg';
import help2 from 'images/help2.svg';
import help2Hover from 'images/help2Hover.svg';
import help3 from 'images/help3.svg';
import help3Hover from 'images/help3Hover.svg';
import help4 from 'images/help4.svg';
import help4Hover from 'images/help4Hover.svg';
import help5 from 'images/help5.svg';
import help5Hover from 'images/help5Hover.svg';
import help6 from 'images/help6.svg';
import help6Hover from 'images/help6Hover.svg';
import help7 from 'images/help7.svg';
import help7Hover from 'images/help7Hover.svg';
import help8 from 'images/help8.svg';
import help8Hover from 'images/help8Hover.svg';


export default class Vis extends Component {
  constructor(props) {
    super(props);
    console.log(props)
    pageView('/vis');

    this.state = {
      summary: DataContainer.getSummary(),
      names: [],
      data: [],
      observations: 0,
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
      selectedAttribute: '',
      showTooltip: false,
      showTags: false,
      mode: 'percent',
      labelKey: 'phinchName',
      sortReverse: true,
      sortKey: 'biomid',
      showRightSidebar: false,
      showLeftSidebar: false,
      showEmptyAttrs: true,
      result: null,
      renderSVG: false,
      dialogVisible: false,
      sankeyColors: 'right',
      helpCounter: 0,
      helpButton: needHelp,

    };

    this._inputs = {};

    this.initdata = DataContainer.getFilteredData();
    this.attributes = DataContainer.getAttributes();
    this.levels = DataContainer.getLevels() || [];

    // move to config or own file
    this.menuItems = [
      {
        id: 'save',
        name: 'Save',
        action: () => {
          this.save(this.setResult);
        },
        icon: <img src={save} alt="save" />,
      },
      {
        id: 'filter',
        name: 'Back',
        action: () => {
          this.save(() => (this.setState({ redirect: '/Filter' })));
        },
        icon: <img src={back} alt="back" />,
      },
      {
        id: 'export',
        name: 'Export SVG',
        action: () => {
          this.setState({ renderSVG: true });
        },
        icon: <img src={save} alt="save" />,
      }
    ];

    this.filters = {};

    this.tooltip = {
      timer: null,
      duration: 1500,
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
        name: 'No Tags',
        selected: true
      }, ...tagColors.map((c, i) => ({
        id: `tag-${i}`,
        name: `Tag ${i}`,
        color: c,
        selected: true,
      }))
    ];

    this.readsBySequence = {};
    this.sequences = [];
    this.topSequences = [];

    this.metrics = {
      padding: 16,
      lineHeight: 14,
      sequenceRowHeight: 24,
      barContainerHeight: 56,
      barHeight: 44,
      attrBarContainerHeight: 40,
      attrBarHeight: 28,
      miniBarContainerHeight: 8,
      miniBarHeight: 6,
      height: 600,
      hideWidth: 20,
      idWidth: 32,
      nameWidth: 140,
      barInfoWidth: 188,
      heightOffset: 130, // 158,
      leftSidebar: 27,
      left: {
        min: 27,
        max: 121,
      },
      rightSidebar: 216,
      debounce: 350,
    };

    this.metrics.nonbarWidth = (this.metrics.padding * 3) + (this.metrics.barInfoWidth);
    this.metrics.chartWidth = this.state.width
      - (this.metrics.leftSidebar + this.metrics.nonbarWidth);
    this.metrics.chartHeight = this.state.height - this.metrics.heightOffset;

    this.scales = {
      x: scaleLinear(),
      c: scaleOrdinal().range(palette),
    };

    this.totalDataReads = 0;

    if (Object.keys(this.initdata).length === 0) {
      this.state.redirect = '/';
    } else {
      // Break this whole chunk into a function or something
      //
      this.init = getProjectFilters(this.state.summary.path, this.state.summary.dataKey, 'vis');
      //
      this.state.names = this.init.names;
      console.log('initial level', this.state.level)
      this.state.level = (this.init.level !== undefined) ? this.init.level : this.state.level;
      console.log(this.init, this.state.level)
      this.filters = this.init.filters ? this.init.filters : {};
      this.state.deleted = this.init.deleted ? this.init.deleted : [];
      this.state.tags = this.init.tags ? this.init.tags : this.state.tags;
      //
      // Can probably lose this for release
      this.state.tags = this.state.tags.map(t => {
        if (t.id === 'none') {
          t.name = 'No Tags';
        }
        return t;
      });
      //
      this.state.rowTags = this.init.rowTags ? this.init.rowTags : this.state.rowTags;
      this.state.selectedAttribute = this.init.selectedAttribute ? (
        this.init.selectedAttribute
      ) : this.state.selectedAttribute;
      this.state.showEmptyAttrs = this.init.showEmptyAttrs === undefined
        ? true : this.init.showEmptyAttrs;
      //
      // Ugly...
      this.state.showLeftSidebar = (this.init.showLeftSidebar !== undefined) ? (
        this.init.showLeftSidebar
      ) : this.state.showLeftSidebar;
      this.metrics.leftSidebar = this.state.showLeftSidebar ?
        this.metrics.left.max : this.metrics.left.min;
      //
      if (this.init.sort) {
        this.state.mode = this.init.sort.mode === undefined
          ? this.state.mode
          : this.init.sort.mode;
        this.state.labelKey = this.init.sort.labelKey === undefined
          ? this.state.labelKey
          : this.init.sort.labelKey;
        this.state.sortReverse = this.init.sort.sortReverse === undefined
          ? this.state.sortReverse
          : this.init.sort.sortReverse;
        this.state.sortKey = this.init.sort.sortKey === undefined
          ? this.state.sortKey
          : this.init.sort.sortKey;
      }
      //
    }

    this.onSuggestionHighlighted = this.onSuggestionHighlighted.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.onValueCleared = this.onValueCleared.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.updatePhinchName = this.updatePhinchName.bind(this);
    this.toggleEmptyAttrs = this.toggleEmptyAttrs.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleLog = this.toggleLog.bind(this);
    this.countUpHelp = this.countUpHelp.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    if (this.initdata) {
      this.formatTaxonomyData(this.initdata, this.state.level, (data) => {
        this.setState({ data, preData: data }, () => {
          this.updateAttributeValues(this.state.selectedAttribute, this.state.data);
          this.setLevel(this.state.level);
        });
      });
    }
    window.addEventListener('click', this.countUpHelp);

  }

  componentDidUpdate() {
    if (this.state.renderSVG && !this.state.dialogVisible) {
      this.setDialogVisible();
      console.log(this.state.summary.path)
      console.log(this._svg)
      handleExportButton(_cloneDeep(this.state.summary.path), this._svg, this.exportComplete, this._visType);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.tooltip.handle);
    clearTimeout(this.timeout);
    window.removeEventListener('resize', this.updateDimensions);
    window.removeEventListener('click', this.countUpHelp);

  }
  countUpHelp() {

    if(this.state.helpCounter > 0) {
      const currCount = this.state.helpCounter;
      const newCount = currCount + 1;
      newCount > 6 ? this.setState({ helpCounter: 2, }) : this.setState({ helpCounter: newCount, });
    }
  }

  exportComplete = () => {
    this.setState({ renderSVG: false, dialogVisible: false });
  }

  setDialogVisible = () => {
    this.setState({ dialogVisible: true });
  }

  save = (callback) => {
    const viewMetadata = {
      type: 'vis',
      level: this.state.level,
      filters: this.filters,
      deleted: this.state.deleted,
      sort: {
        mode: this.state.mode,
        labelKey: this.state.labelKey,
        sortReverse: this.state.sortReverse,
        sortKey: this.state.sortKey,
      },
      tags: this.state.tags,
      rowTags: this.state.rowTags,
      showLeftSidebar: this.state.showLeftSidebar,
      selectedAttribute: this.state.selectedAttribute,
      showEmptyAttrs: this.state.showEmptyAttrs,
    };
    setProjectFilters(
      this.state.summary.path,
      this.state.summary.dataKey,
      this.state.names,
      viewMetadata,
      (value) => {
        callback(value);
      },
    );
  };

  setResult = (value) => {
    const result = value;
    this.timeout = setTimeout(() => {
      this.clearResult();
    }, 3000);
    this.setState({ result });
  }

  clearResult = () => {
    const result = null;
    this.setState({ result });
  }

  _toggleTag = (datum, tag, isRemoved) => {
    if (datum.tags[tag.id]) {
      delete datum.tags[tag.id];
    } else {
      datum.tags[tag.id] = tag;
    }
    const rowTags = _cloneDeep(this.state.rowTags);
    rowTags[datum.sampleName] = datum.tags;
    // ugly
    if (isRemoved) {
      const deleted = this.state.deleted.map((d) => {
        if (d.sampleName === datum.sampleName) {
          d.tags = datum.tags;
        }
        return d;
      });
      this.setState({ deleted }, () => {
        this.save(this.setResult);
      });
    } else {
      const data = this.state.data.map((d) => {
        if (d.sampleName === datum.sampleName) {
          d.tags = datum.tags;
        }
        return d;
      });
      this.setState({ data }, () => {
        this.save(this.setResult);
      });
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
      this.setState({ highlightedDatum: { datum, sample, position } });
    }
  }

  _clickDatum = (datum) => {
    if (!Object.prototype.hasOwnProperty.call(this.filters, this.state.level)) {
      this.filters[this.state.level] = {};
    }
    const filters = _cloneDeep(this.state.filters);
    if (!Object.prototype.hasOwnProperty.call(this.filters[this.state.level], datum.name)) {
      const sequences = [];
      this.state.preData.forEach(d => {
        d.sequences.forEach(s => {
          if (datum.name === s.name && s.reads > 0) {
            sequences.push(s);
          }
        });
      });
      const totalReads = sequences.map(s => s.reads).reduce((s, v) => s + v);
      const values = _sortBy(sequences, (s) => s.reads).map((s, i) => ({
        index: i,
        value: s.reads,
        count: (s.reads === 0) ? 1 : s.reads,
        percent: s.reads / totalReads,
      }));
      this.filters[this.state.level][datum.name] = {
        key: datum.name,
        values,
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
    const showRightSidebar = Object.keys(filters).length > 0;
    this.updateChartWidth(showRightSidebar);
    this.setState({ filters, showRightSidebar }, () => {
      this.topSequences = this.renderTopSequences();
      this.save(this.setResult);
    });
  }

  toggleLog(name) {
    const filters = _cloneDeep(this.state.filters);
    filters[name].log = !filters[name].log;
    this.filters[this.state.level] = filters;
    this.setState({ filters }, () => {
      this.save(this.setResult);
    });
  }

  removeFilter(name) {
    const filters = _cloneDeep(this.state.filters);
    delete filters[name];
    this.filters[this.state.level] = filters;
    const showRightSidebar = Object.keys(filters).length > 0;
    this.updateChartWidth(showRightSidebar);
    const data = this.filterData(filters, this.state.tags, this.state.preData, this.state.deleted);
    const observations = countObservations(data);
    this.updateAttributeValues(this.state.selectedAttribute, data);
    this.setState({
      data, observations, filters, showRightSidebar
    }, () => {
      this.topSequences = this.renderTopSequences();
      this.save(this.setResult);
    });
  }

  updateChartWidth(showRightSidebar) {
    if (showRightSidebar) {
      this.metrics.chartWidth = window.innerWidth
        - (this.metrics.leftSidebar + this.metrics.rightSidebar + this.metrics.nonbarWidth);
    } else {
      this.metrics.chartWidth = window.innerWidth
        - (this.metrics.leftSidebar + this.metrics.nonbarWidth);
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

  setLevel(level) {
    if (!Object.prototype.hasOwnProperty.call(this.filters, level)) {
      this.filters[level] = {};
    }
    const filters = this.filters[level];
    const showRightSidebar = Object.keys(filters).length > 0;
    this.updateChartWidth(showRightSidebar);
    this.updateTaxonomyData(this.state.preData, level, true, (preData) => {
      this.updateTaxonomyData(this.state.deleted, level, false, (deleted) => {
        const data = this.filterData(filters, this.state.tags, preData, deleted);
        const observations = countObservations(data);
        this.updateAttributeValues(this.state.selectedAttribute, data);
        this.setState({
          level, data, observations, preData, deleted, filters, showRightSidebar
        }, () => {
          this.topSequences = this.renderTopSequences();
          this.save(this.setResult);
        });
      });
    });
  }

  // data.data schema: [row(observations), column(samples), count]
  // Move to data container?
  formatTaxonomyData(data, level, callback) {
    let totalDataReads = 0;
    const indata = data.columns.map(c => {
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
      let phinchName = c.phinchName.toString();
      if (this.state.names[c.sampleName]) {
        phinchName = this.state.names[c.sampleName];
      }
      const tags = this.state.rowTags[c.sampleName] ? this.state.rowTags[c.sampleName] : {};
      Object.keys(tags).forEach(k => {
        const [tag] = this.state.tags.filter(t => t.id === k);
        tags[k] = tag;
      });
      const [dateAttribute] = Object.keys(this.attributes)
        .map(k => this.attributes[k])
        .filter(a => a.type === 'date');
      let collectionDate = '';
      if (dateAttribute) {
        collectionDate = c.metadata[dateAttribute.key] ? (
          new Date(c.metadata[dateAttribute.key]).toLocaleString().split(', ')[0]
        ) : '';
      }
      return {
        id: c.id,
        biomid: c.biomid,
        phinchID: c.metadata.phinchID,
        order: c.order,
        sampleName: c.sampleName,
        phinchName,
        observations: c.observations,
        reads: c.reads,
        sequences: [],
        date: collectionDate,
        tags,
        matches,
      };
    });
    this.totalDataReads = totalDataReads;
    this.updateTaxonomyData(indata, level, true, (formatedData) => {
      callback(formatedData);
    });
  }

  updateTaxonomyData(data, level, updateSequences, callback) {
    if (updateSequences) {
      this.readsBySequence = {};
    }
    const taxonomyData = data.map(d => {
      d.sequences = nest()
        .key(s => s.taxonomy.slice(0, level + 1))
        .entries(d.matches)
        .map(s => {
          const reads = s.values.map(v => v.count).reduce((a, v) => a + v);
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
            reads,
          };
        });
      return d;
    });
    if (updateSequences) {
      this.sequences = this.updateSequences();
    }
    callback(taxonomyData);
  }

  filterData(filters, tags, preData, deleted) {
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
    return visSortBy(samples, this.state.sortReverse, this.state.sortKey);
  }

  applyFilters(filters) {
    const data = this.filterData(filters, this.state.tags, this.state.preData, this.state.deleted);
    const observations = countObservations(data);
    this.updateAttributeValues(this.state.selectedAttribute, data);
    this.setState({ filters, data, observations }, _debounce(() => {
      this.save(this.setResult);
    }), this.metrics.debounce, { leading: false, trailing: true });
  }

  renderFilters() {
    if (Object.keys(this.state.filters).length) {
      const segments = Object.keys(this.state.filters).map(k => (
        <div
          key={k}
          style={{
            display: 'inline-block',
            borderBottom: '1px solid #262626',
            margin: '0.5rem',
          }}
        >
          <FilterChart
            name={k}
            showScale
            showCircle
            fill={this.scales.c(k)}
            handle={this.scales.c(k)}
            data={this.state.filters[k]}
            width={this.metrics.rightSidebar - (this.metrics.padding * 3.25)}
            height={this.metrics.rightSidebar / 4}
            filters={this.state.filters}
            update={updateFilters}
            remove={this.removeFilter}
            toggleLog={this.toggleLog}
            callback={this.applyFilters}
          />
        </div>
      ));
      return (
        <div
          className={`${gstyle.panel} ${gstyle.darkbgscrollbar}`}
          style={{
            borderTop: '1px solid #262626',
            position: 'fixed',
            width: this.state.showRightSidebar ? this.metrics.rightSidebar : 0,
            height: this.metrics.chartHeight + (this.metrics.lineHeight * 2),
          }}
        >
          {segments}
        </div>
      );
    }
    return null;
  }

  toggleMenu() {
    const showLeftSidebar = !this.state.showLeftSidebar;
    this.metrics.leftSidebar = showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.updateChartWidth(this.state.showRightSidebar);
    this.setState({ showLeftSidebar }, () => {
      this.save(this.setResult);
    });
  }

  onSuggestionSelected(e, { suggestion }) {
    const highlightedDatum = null;
    const showTooltip = false;
    this.setState({ highlightedDatum, showTooltip }, () => {
      this._clickDatum(suggestion);
    });
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
    const highlightedDatum = null;
    const showTooltip = false;
    this.setState({ highlightedDatum, showTooltip }, () => {
      this.save(this.setResult);
    });
  }

  updatePhinchName(e, r, isRemoved) {
    // ugly - similar to function in Filter.js
    const names = _cloneDeep(this.state.names);
    if (isRemoved) {
      const deleted = this.state.deleted.map((d) => {
        if (d.sampleName === r.sampleName) {
          d.phinchName = e.target.value;
        }
        names[d.sampleName] = d.phinchName;
        return d;
      });
      this.setState({ deleted }, _debounce(() => {
        this.save(this.setResult);
      }), this.metrics.debounce, { leading: false, trailing: true });
    } else {
      const data = this.state.data.map((d) => {
        if (d.sampleName === r.sampleName) {
          d.phinchName = e.target.value;
        }
        names[d.sampleName] = d.phinchName;
        return d;
      });
      this.setState({ data, names }, _debounce(() => {
        this.save(this.setResult);
      }), this.metrics.debounce, { leading: false, trailing: true });
    }
  }

  updateTagName(event, tag) {
    const tags = this.state.tags.map(t => {
      if (t.id === tag.id) {
        t.name = event.target.value;
      }
      return t;
    });
    this.setState({ tags }, _debounce(() => {
      this.save(this.setResult);
    }), this.metrics.debounce, { leading: false, trailing: true });
  }

  filterByTag(event, tag) {
    const tags = this.state.tags.map(t => {
      if (tag.id === t.id) {
        t.selected = event.target.checked;
      }
      return t;
    });
    const data = this.filterData(this.state.filters, tags, this.state.preData, this.state.deleted);
    const observations = countObservations(data);
    this.updateAttributeValues(this.state.selectedAttribute, data);
    this.setState({ tags, data, observations }, () => {
      this.save(this.setResult);
    });
  }

  toggleEmptyAttrs() {
    const showEmptyAttrs = !this.state.showEmptyAttrs;
    this.setState({ showEmptyAttrs }, () => {
      this.updateAttributeValues(this.state.selectedAttribute, this.state.data);
      this.save(this.setResult);
    });
  }

  stack = (datum, index, yOffset, removed) => (
    <StackedBarRow
      key={datum.id}
      data={datum}
      index={index}
      zIndex={this.state.data.length - index}
      isLast={index === this.state.data.length - 1}
      yOffset={yOffset}
      labelKey={this.state.labelKey}
      filters={this.state.filters}
      metrics={this.metrics}
      scales={this.scales}
      tags={this.state.tags.filter(t => t.id !== 'none')}
      toggleTag={this._toggleTag}
      isPercent={(this.state.mode === 'percent')}
      isRemoved={removed}
      highlightedDatum={this.state.highlightedDatum}
      removeDatum={() => { removeRows(this, [datum]); }}
      restoreDatum={() => { restoreRows(this, [datum]); }}
      hoverDatum={this._hoverDatum}
      clickDatum={this._clickDatum}
      updatePhinchName={this.updatePhinchName}
      renderSVG={this.state.renderSVG}
    />
  );

  stackRow = ({ index, style }) => this.stack(this.state.data[index], index, style.top, false)

  attr = (datum, index, yOffset) => (
    <StackedBarRow
      key={`${this.state.selectedAttribute}-${datum.name}`}
      data={datum}
      index={index}
      zIndex={this.attribute.displayValues.length - index}
      isLast={index >= Math.max(4, this.attribute.displayValues.length - 4)}
      yOffset={yOffset}
      labelKey="name"
      filters={this.state.filters} // TODO: replace w/ minibar count prop
      metrics={this.metrics}
      scales={this.scales}
      tags={[]}
      isPercent={(this.state.mode === 'percent')}
      isRemoved={null}
      highlightedDatum={this.state.highlightedDatum}
      hoverDatum={this._hoverDatum}
      clickDatum={this._clickDatum}
      isAttribute
      unit={this.attribute.unit}
      styles={{
        cell: styles.cell,
        circle: gstyle.circle,
        name: styles.name,
        reads: styles.reads,
      }}
      renderSVG={this.state.renderSVG}
    />
  );

  attrRow = ({ index, style }) => this.attr(this.attribute.displayValues[index], index, style.top)

  updateAttributeValues(attribute, data) {
    if (attribute !== '') {
      this.attributes[attribute].displayValues = visSortBy(
        this.attributes[attribute].values.map(a => {
          const datum = {};
          datum.name = (attribute === 'Year') ? a.value.toString() : a.value.toLocaleString();
          datum.samples = [...new Set(a.samples)];
          datum.sampleObjects = datum.samples.map(s => {
            const [sample] = data.filter(d => d.sampleName === s);
            return sample;
          }).filter(s => s !== undefined);
          datum.reads = datum.sampleObjects.map(s => s.reads).reduce((ac, v) => ac + v, 0);
          datum.sequences = nest()
            .key(s => s.name)
            .entries(datum.sampleObjects
              .map(s => s.sequences)
              .reduce((ac, v) => ac.concat(v), []))
            .map(s => ({
              name: s.key,
              reads: s.values.map(v => v.reads).reduce((ac, v) => ac + v, 0),
              taxonomy: s.values[0].taxonomy,
            }));
          return datum;
        })
          .filter(v => {
            if (this.state.showEmptyAttrs) return true;
            return v.reads > 0;
          }),
        this.state.sortReverse,
        this.state.sortKey,
      );
    }
  }

  renderAttributesSelect() {
    const options = [<option key="none" value="">None</option>]
      .concat(Object.keys(this.attributes).map(a => <option key={a} value={a}>{a}</option>));
    const onSelectChange = (event) => {
      const selectedAttribute = event.target.value;
      this.updateAttributeValues(selectedAttribute, this.state.data);
      this.setState({ selectedAttribute }, () => {
        this.save(this.setResult);
      });
    };
    const active = (this.state.selectedAttribute !== '') ? styles.selected : '';
    return (
      <div className={styles.inlineControl}>
        <label htmlFor="attributesSelect">
          {'Attributes '}
          <select
            id="attributesSelect"
            onChange={onSelectChange}
            className={`${active}`}
            style={{ marginRight: 0 }}
            value={this.state.selectedAttribute}
          >
            {options}
          </select>
        </label>
      </div>
    );
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
    const options = showOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>);
    const onSelectChange = (event) => {
      const labelKey = event.target.value;
      this.setState({ labelKey }, () => {
        this.save(this.setResult);
      });
    };
    return (
      <div className={styles.inlineControl}>
        <label htmlFor="showSelect">
          {'Show: '}
          <select
            id="showSelect"
            onChange={onSelectChange}
            className={styles.inlineControl}
            value={this.state.labelKey}
            disabled={this.state.selectedAttribute !== ''}
          >
            {options}
          </select>
        </label>
      </div>
    );
  }

  renderSort() {
    const sampleOptions = [
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
    const attrOptions = [
      {
        id: 'name',
        name: 'Name',
      },
      {
        id: 'reads',
        name: 'Sequence Reads',
      },
    ];
    const sortOptions = this.state.selectedAttribute !== '' ? attrOptions : sampleOptions;
    const options = sortOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>);
    const onSelectChange = (event) => {
      const sortKey = event.target.value;
      const isAttribute = this.state.selectedAttribute !== '';
      const indata = isAttribute
        ? this.attributes[this.state.selectedAttribute].displayValues
        : this.state.data;
      const data = visSortBy(indata, this.state.sortReverse, sortKey);
      if (isAttribute) {
        this.attributes[this.state.selectedAttribute].displayValues = data;
        this.setState({ sortKey }, () => this.save(this.setResult));
      } else {
        this.setState({ data, sortKey }, () => this.save(this.setResult));
      }
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
      const sortReverse = event.target.name === 'Ascending';
      const isAttribute = this.state.selectedAttribute !== '';
      const indata = isAttribute
        ? this.attributes[this.state.selectedAttribute].displayValues
        : this.state.data;
      const data = visSortBy(indata, sortReverse, this.state.sortKey);
      if (isAttribute) {
        this.attributes[this.state.selectedAttribute].displayValues = data;
        this.setState({ sortReverse }, () => this.save(this.setResult));
      } else {
        this.setState({ data, sortReverse }, () => this.save(this.setResult));
      }
    };
    const buttons = radioOptions.map(o => {
      const checked = this.state.sortReverse === o.value ? 'checked' : '';
      return (
        <div key={o.name} className={styles.inlineControl}>
          <label htmlFor={o.name}>
            <input
              type="radio"
              id={o.name}
              key={o.name}
              name={o.name}
              checked={checked}
              onChange={onRadioChange}
            />
            {o.name}
          </label>
        </div>
      );
    });
    return (
      <div className={styles.inlineControl} style={{ marginRight: 0 }}>
        <label htmlFor="sortSelect">
          {'Sort by: '}
          <select
            id="sortSelect"
            onChange={onSelectChange}
            className={styles.inlineControl}
            value={this.state.sortKey}
          >
            {options}
          </select>
        </label>
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
    const toggle = buttons.map(b => {
      const onRadioChange = (event) => {
        this.setState({ mode: event.target.id }, () => {
          this.save(this.setResult);
        });
      };
      const checked = this.state.mode === b.id ? 'checked' : '';
      return (
        <div key={b.id} className={styles.inlineControl}>
          <label htmlFor={b.id}>
            <input
              type="radio"
              id={b.id}
              name={b.name}
              checked={checked}
              onChange={onRadioChange}
            />
            {b.name}
          </label>
        </div>
      );
    });
    return (
      <div className={styles.inlineControl}>
        {toggle}
      </div>
    );
  }

  renderLevelSelector(levels, dataLength) {
    const modalLevel = (this.state.width - 580) < ((800 / 12) * this.levels.length);
    const levelButtons = levels.map((l, i) => {
      const selected = (l.order <= this.state.level) ? styles.selected : '';
      return (
        <div
          key={l.name}
          style={{
            display: 'inline-block',
            marginBottom: '4px',
            position: 'relative',
            zIndex: dataLength + 1,
          }}
        >
          {(i === 0) ? '' : (<div className={`${selected} ${styles.dash}`}>—</div>)}
          <div
            role="button"
            tabIndex={0}
            className={`${selected} ${styles.selector}`}
            onClick={() => this.setLevel(l.order)}
            onKeyPress={e => (e.key === ' ' ? this.setLevel(l.order) : null)}
          >
            {l.name}
          </div>
        </div>
      );
    });
    const [currentLevel] = this.levels.filter(l => l.order === this.state.level);
    const levelSelector = modalLevel ? (
      <Modal
        buttonTitle={`Level: ${currentLevel.name}`}
        modalTitle={`Level: ${currentLevel.name}`}
        buttonPosition={{
          position: 'relative',
          height: '24px',
          borderRadius: '4px',
          backgroundColor: '#4d4d4d',
        }}
        modalPosition={{
          position: 'fixed',
          zIndex: dataLength + 1,
          top: 136,
          left: this.metrics.leftSidebar,
          width: this.metrics.chartWidth + (this.metrics.nonbarWidth - 4),
          height: '98px',
          color: 'white',
        }}
        data={levelButtons}
      />
    ) : (
      <div className={styles.inlineControl}>
        {levelButtons}
      </div>
    );
    return levelSelector;
  }

  updateSequences() {
    return Object.keys(this.readsBySequence)
      .map(k => ({ name: k, reads: this.readsBySequence[k] }))
      .sort((a, b) => b.reads - a.reads)
      .map((s, i) => {
        s.rank = (i + 1);
        return s;
      });
  }

  renderTopSequences() {
    return this.sequences.map((s, i) => (
      <Sequence
        seq={s}
        index={i}
        key={s.name}
        scales={this.scales}
        metrics={this.metrics}
        filters={this.state.filters}
        renderSVG={this.state.renderSVG}
        yOffset={this.metrics.sequenceRowHeight * i}
        removeFilter={this.removeFilter}
        clickDatum={this._clickDatum}
      />
    ));
  }

  renderTagFilter() {
    const tagFilter = this.state.showTags ? (
      <div key="tagFilter" className={styles.tagFilter}>
        <div
          role="button"
          tabIndex={0}
          className={gstyle.close}
          style={{ marginTop: '4px' }}
          onClick={this._toggleTags}
          onKeyPress={e => (e.key === ' ' ? this._toggleTags() : null)}
        >
          x
        </div>
        {
          this.state.tags.map(t => {
            const tagClass = t.id === 'none' ? '' : styles.tag;
            return (
              <div
                key={`tf-${t.id}`}
                style={{
                  padding: '2px 0',
                }}
                className={tagClass}
              >
                <label htmlFor={`c-${t.id}`} className={gstyle.checkbox}>
                  <input
                    id={`c-${t.id}`}
                    type="checkbox"
                    checked={t.selected}
                    onChange={(e) => this.filterByTag(e, t)}
                    style={{ top: 0, left: '-3px' }}
                  />
                  <span className={gstyle.checkmark} />
                </label>
                {
                  t.color ? (
                    <div
                      className={gstyle.circle}
                      style={{
                        backgroundColor: t.color,
                        borderColor: '#333333',
                        marginLeft: '4px',
                        opacity: t.selected ? 1 : 0.5,
                      }}
                    />
                  ) : ''
                }
                <input
                  className={`${gstyle.input} ${styles.tagName} ${t.selected ? styles.selected : ''}`}
                  type="text"
                  value={t.name}
                  id={t.id}
                  ref={i => { this._inputs[t.id] = i; }}
                  onChange={e => this.updateTagName(e, t)}
                  onKeyPress={e => (e.key === 'Enter' ? this._inputs[t.id].blur() : null)}
                  onMouseOver={this._hoverTag}
                  onFocus={this._hoverTag}
                  onMouseOut={this._unhoverTag}
                  onBlur={this._unhoverTag}
                  disabled={!t.color}
                />
                <div className={styles.editTag}>edit</div>
              </div>
            );
          })
        }
      </div>
    ) : '';
    const showTags = this.state.showTags ? styles.selected : '';
    return (
      <div
        className={styles.inlineControl}
      >
        <div
          role="button"
          tabIndex={0}
          className={styles.inlineControl}
          onClick={this._toggleTags}
          onKeyPress={e => (e.key === ' ' ? this._toggleTags() : null)}
        >
          <div key="tags" className={`${styles.selector} ${styles.button} ${showTags}`}>Tags</div>
          {
            this.state.tags.map(t => (t.color ? (
              <div
                key={`c-${t.id}`}
                className={gstyle.circle}
                style={{
                  background: t.color,
                  opacity: t.selected ? 1 : 0.5,
                  verticalAlign: 'middle',
                }}
              />
            ) : ''))
          }
        </div>
        {tagFilter}
      </div>
    );
  }

  /*This function deals with when the mouse hovers over the browse icon on top right of
   and changes img src accordingly to correct svg file */
   handleMouseOver (button) {
    switch(button) {
      case "help":
        if(this.state.helpButton === needHelp) {
          this.setState({helpButton: needHelpHover});
        }
        break;
    }
  }

  /*This function deals with the mouse leaving an icon (no longer hovering) and
  changed img src to correct svg file */
  handleMouseLeave (button) {
    switch(button) {
      case "help":
        if(this.state.helpButton === needHelpHover) {
          this.setState({helpButton: needHelp});
        }
        break;
    }
  }

  makeHelpButtons() {
    return (
      <div className={gstyle.helpIcons}>
        <div
        role="button"
        className={gstyle.helpIcons}
        onClick={() => {this.setState({ helpCounter: 0 }); this.forceUpdate();} }
        >
          <img src={closeHelp} alt="close-walkthrough" />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ helpCounter: 1 })}
        >
          <img src={this.state.helpCounter == 2 ? help1Hover : help1} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ helpCounter: 2 })}
        >
          <img src={this.state.helpCounter == 3 ? help2Hover : help2} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ helpCounter: 3 })}
        >
          <img src={this.state.helpCounter == 4 ? help3Hover : help3} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ helpCounter: 4 })}
        >
          <img src={this.state.helpCounter == 5 ? help4Hover : help4} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ helpCounter: 5 })}

        >
          <img src={this.state.helpCounter == 6 ? help5Hover : help5} />
        </div>

      </div>
    );
  }


  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    const isAttribute = (
      this.state.selectedAttribute !== ''
        &&
      this.attributes[this.state.selectedAttribute].displayValues
    );

    this.attribute = isAttribute ? this.attributes[this.state.selectedAttribute] : null;
    const dataLength = isAttribute ? this.attribute.displayValues.length : this.state.data.length;

    let maxReads = 1;
    if (dataLength) {
      maxReads = isAttribute
        ? Math.max(...this.attribute.displayValues.map(d => d.reads))
        : Math.max(...this.state.data.map(d => d.reads));
    }
    this.scales.x
      .domain([0, maxReads])
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

    const result = this.state.result ? (
      <div
        role="button"
        tabIndex={0}
        className={gstyle.button}
        style={{
          position: 'absolute',
          top: '96px',
          left: '16px',
          width: '68px',
          textAlign: 'center',
          zIndex: 10,
          fontWeight: 400,
          color: '#191919',
          border: 'none',
          borderRadius: '8px',
          padding: 0,
          background: (this.state.result === 'error') ? '#ff2514' : '#00da3e',
        }}
        onClick={this.clearResult}
        onKeyPress={e => (e.key === ' ' ? this.clearResult() : null)}
      >
        {this.state.result}
      </div>
    ) : '';

    const spacer = <div className={styles.spacer} />;

    const svgHeight = (this.metrics.lineHeight * 4) + (
      (this.metrics.barContainerHeight + (
        this.metrics.miniBarContainerHeight * Object.keys(this.state.filters).length
      )) * dataLength);

    const ticks = (
      <StackedBarTicks
        metrics={this.metrics}
        scale={this.scales.x}
        mode={this.state.mode}
        width={this.state.width}
        svgWidth={this.metrics.chartWidth + this.metrics.nonbarWidth}
        svgHeight={svgHeight - (this.metrics.lineHeight * 3)}
      />
    );

    const visType = this.props.match.params.visType || 'stackedbar';
    this._visType = visType;
    return (
      <div className={gstyle.container}>
        {redirect}
        {result}
        <div className={gstyle.logo}>
          <Link to="/">
            <img src={logo} alt="Phinch" />
          </Link>
          {
            visType === 'sankey' ?
            <button
              className={gstyle.help}
              // on click command is still undefined outside of home page, set to issues page for now until later
              onClick={() => this.setState({ helpCounter: 1 })}
              onMouseEnter={() => this.handleMouseOver("help")}
              onMouseLeave={() => this.handleMouseLeave("help")}
              >
                <img src={this.state.helpButton} alt="needHelp" />
            </button>
            : null
          }
        </div>
        <div
          className={gstyle.header}
          style={{
            zIndex: visType === 'stackedbar' ? dataLength + 1 :
              visType === 'sankey' ?
                this.state.helpCounter === 2 ? 2000 : 1000
                : 2000
              }}>
          <Summary
            summary={this.state.summary}
            observations={this.state.observations}
            datalength={this.state.data.length}
            opacity={this.state.helpCounter === 0 ? 1 : 0.2}
          />
          <div className={styles.controls}>
            <div className={styles.controlRow} style={{
              opacity: this.state.helpCounter === 0? 1 : 0.2
            }}>
              {
                visType === 'stackedbar' ? <React.Fragment>
                <Search
                  options={this.sequences}
                  onValueCleared={this.onValueCleared}
                  onSuggestionSelected={this.onSuggestionSelected}
                  onSuggestionHighlighted={this.onSuggestionHighlighted}
                />
                {this.renderShow()}
                {this.renderSort()}
                {spacer}
                {this.renderToggle()}
              </React.Fragment> : visType === 'sankey' ? <React.Fragment>
                <div className={styles.inlineControl}>
                  <label htmlFor='sankeyColors'>
                    Link Colors:{' '}
                    <select
                      id='sankeyColors'
                      value={this.state.sankeyColors}
                      onChange={e => this.setState({ sankeyColors: e.target.value })}
                    >
                      {/* <option value="mix">mix</option> */}
                      <option value="left">left</option>
                      <option value="right">right</option>
                    </select>
                  </label>

                </div>

              </React.Fragment> : null
            }
            </div>
            <SpotlightWithToolTip
              isActive={this.state.helpCounter === 2}
              style={{ boxShadow: 'rgba(255, 255, 255, 0.4) 0 0 10px 3px',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
              }}
            >
              <div className={styles.controlRow}>
                {this.renderLevelSelector(this.levels, dataLength)}
                {this.levels.length ? spacer : null}
                {this.renderAttributesSelect()}
                {spacer}
                {this.renderTagFilter()}
              </div>
            </SpotlightWithToolTip>
          </div>
        </div>

        <SideMenu
          showLeftSidebar={this.state.showLeftSidebar}
          leftSidebar={this.metrics.leftSidebar}
          leftMin={this.metrics.left.min}
          chartHeight={this.metrics.chartHeight + (this.metrics.lineHeight * 2)}
          items={this.menuItems}
          toggleMenu={this.toggleMenu}
          spotlight={this.state.helpCounter === 6}
          helpText="Paragraph to mention about the save, back and export features again in sankey visualization."
        />
        <div
          className={classNames(gstyle.panel,  gstyle.noscrollbar)}
          style={{
            width: this.metrics.chartWidth + this.metrics.nonbarWidth,
          }}
        >
          { visType === 'stackedbar' ? (
            <div
              className={styles.axis}
              style={{
                width: this.metrics.chartWidth + (this.metrics.nonbarWidth - this.metrics.padding),
                height: this.metrics.lineHeight * 2,
              }}
            >
              <svg
                fontFamily="IBM Plex Sans Condensed"
                fontWeight="200"
                fontSize="12px"
                style={{
                  position: 'absolute',
                  left: 0,
                  pointerEvents: 'none',
                  width: (this.metrics.chartWidth + this.metrics.nonbarWidth),
                  height: this.metrics.chartHeight,
                }}
              >
                {ticks}
              </svg>
              {
                isAttribute ? (
                  <div className={styles.attrInfo}>
                    <div className={styles.attrLabel}>
                      {this.attribute.key} {this.attribute.unit ? `(${this.attribute.unit})` : ''}
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      className={styles.attrToggle}
                      onClick={this.toggleEmptyAttrs}
                      onKeyPress={e => (e.key === ' ' ? this.toggleEmptyAttrs() : null)}
                    >
                      {`${this.state.showEmptyAttrs ? 'Hide' : 'Show'} Empty`}
                    </div>
                  </div>
                ) : ''
              }
            </div>
          ) : null }
          <div
            className={classNames(gstyle.panel,  gstyle.noscrollbar, {
              [gstyle.panelNoYScroll]: visType === 'sankey'
            })}
            style={{
              backgroundColor: '#ffffff',
              width: (this.metrics.chartWidth + this.metrics.nonbarWidth),
              height: this.metrics.chartHeight,
            }}
          >
            {
              this.state.renderSVG && visType === 'stackedbar' ? (
                <StackedBarsSVG
                  setRef={r => { this._svg = r; }}
                  id={this.state.summary.path.slice(-1)}
                  svgWidth={this.metrics.chartWidth + this.metrics.nonbarWidth}
                  svgHeight={svgHeight}
                  seqHeight={this.metrics.sequenceRowHeight * this.topSequences.length}
                  data={isAttribute ? this.attribute.displayValues : this.state.data}
                  row={isAttribute ? this.attrRow : this.stackRow}
                  itemSize={this.metrics.barContainerHeight + (
                    this.metrics.miniBarContainerHeight * Object.keys(this.state.filters).length
                  )}
                  padding={this.metrics.padding}
                  ticks={ticks}
                  topSequences={this.renderTopSequences()}
                />
              ) : (
                visType === 'stackedbar' ?
                  <List
                    className={`${styles.svglist}`}
                    innerElementType="svg"
                    width={this.metrics.chartWidth + this.metrics.nonbarWidth}
                    height={this.metrics.chartHeight - (this.metrics.padding * 4)}
                    itemSize={this.metrics.barContainerHeight + (
                      this.metrics.miniBarContainerHeight * Object.keys(this.state.filters).length
                    )}
                    itemCount={dataLength}
                    itemKey={index => (isAttribute
                      ? this.attribute.displayValues[index].name : this.state.data[index].sampleName
                    )}
                  >
                    {isAttribute ? this.attrRow : this.stackRow}
                  </List>
                : visType === 'sankey' ?
                  <Sankey
                    setRef={r => { this._svg = r; }}

                    data={this.state.data} preData={this.state.preData}
                    width={this.metrics.chartWidth + this.metrics.nonbarWidth}
                    height={this.metrics.chartHeight}
                    colors={this.state.sankeyColors}
                    renderSVG={this.state.renderSVG}
                    helpCounter={this.state.helpCounter}
                    clickDatum={this._clickDatum}
                    colorScale={this.scales.c || (() => {})}
                  />
                : null
              )

            }
          </div>
        </div>
        {this.renderFilters()}
        {tooltip}
        <Modal
          buttonTitle="Top Sequences"
          modalTitle="Top Sequences"
          buttonPosition={{
            position: 'absolute',
            bottom: 0,
            left: (
              this.metrics.leftSidebar + this.metrics.barInfoWidth + (this.metrics.padding / 2) + 2
            ),
          }}
          modalPosition={{
            position: 'absolute',
            zIndex: dataLength + 1,
            bottom: this.metrics.padding * 2,
            left: this.metrics.leftSidebar,
            width: this.metrics.chartWidth + (this.metrics.nonbarWidth - 4),
          }}
          data={this.topSequences}
          svgContainer
          svgHeight={this.metrics.sequenceRowHeight * this.topSequences.length}
        />
        <Modal
          buttonTitle="Archived Samples"
          modalTitle="Archived Samples"
          buttonPosition={{
            position: 'absolute',
            bottom: 0,
            left: (
              this.metrics.leftSidebar + this.metrics.barInfoWidth + this.metrics.padding + 2 + 130
            ),
          }}
          modalPosition={{
            position: 'absolute',
            zIndex: dataLength + 1,
            bottom: this.metrics.padding * 2,
            left: this.metrics.leftSidebar,
            width: this.metrics.chartWidth + (this.metrics.nonbarWidth - 4),
          }}
          useList
          data={this.state.deleted}
          row={this.stack}
          dataKey="sampleName"
          itemHeight={this.metrics.barContainerHeight +
            (this.metrics.miniBarContainerHeight * Object.keys(this.state.filters).length)
          }
          svgContainer
          badge
        />

          <SpotlightWithToolTip
            isActive = {this.state.helpCounter > 0}
            inheritParentBackgroundColor={false}
            toolTipTitle={"*mouse click anywhere to advance"}
            overlayStyle={{zIndex: '1001'}}
            innerStyle={{color: 'white', fontWeight: '600', fontSize: '10px'}}
            style={{boxShadow: 'none'}}
          >
            <div className={gstyle.helpButtons}>
              {this.state.helpCounter > 0 ? this.makeHelpButtons() : null}
            </div>
          </SpotlightWithToolTip>
      </div>
    );
  }
}
