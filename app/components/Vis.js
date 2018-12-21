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

import { updateFilters, removeRows, restoreRows, visSortBy } from '../filterfunctions';
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
import FilterChart from './FilterChart';
import Summary from './Summary';
import Modal from './Modal';

import styles from './Vis.css';
import gstyle from './general.css';

export default class Vis extends Component {
  constructor(props) {
    super(props);

    pageView('/vis');

    this.state = {
      summary: DataContainer.getSummary(),
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
      selectedAttribute: '',
      showTooltip: false,
      showTags: false,
      mode: 'percent',
      labelKey: 'phinchName',
      showRightSidebar: false,
      showLeftSidebar: false,
      showEmptyAttrs: true,
      result: null,
      renderSVG: false,
      dialogVisible: false,
    };

    this._inputs = {};

    this.initdata = DataContainer.getFilteredData();

    this.attributes = DataContainer.getAttributes();

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
        name: 'No Tags',
        selected: true
      }, ...tagColors.map((c, i) => ({
        id: `tag-${i}`,
        name: `Tag ${i}`,
        color: c,
        selected: true,
      }))
    ];

    this.levels = [];
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
      // move to config / metadata
      const ignoreLevels = ['', 'unclassified', 'unassigned', 'unassignable', 'ambiguous taxa', 'ambiguous_taxa'];

      // Autogenerate levels from data
      // TODO: Test w/ addtional data formats
      const uniqTaxa = [
        ...new Set([]
          .concat(...[
            ...new Set(this.initdata.rows
              .map(r => r.metadata.taxonomy.filter(t => t.includes('__'))
                .map(t => t.split('__')[0])
                .join('|')))
          ]
            .map(r => r.split('|').map((l, i) => JSON.stringify({
              name: l,
              order: i,
            })))))
      ]
        .map(l => JSON.parse(l))
        .filter(l => !ignoreLevels.includes(l.name.trim().toLowerCase()));

      const defaultTaxa = {
        k: 'kingdom',
        p: 'phylum',
        c: 'class',
        o: 'order',
        f: 'family',
        g: 'genus',
        s: 'species',
      };

      this.levels = nest()
        .key(t => t.name)
        .entries(uniqTaxa)
        .map(l => {
          let number = null;
          const numbers = l.key.match(/\d+/g);
          if (numbers) {
            number = Number(numbers[0]);
          }
          return {
            name: l.key,
            number,
            order: Math.min(...l.values.map(t => t.order)),
          };
        })
        .sort((a, b) => {
          if (a.number && b.number) {
            return a.number - b.number;
          }
          return a.order - b.order;
        })
        .map((l, i) => {
          if (l.name in defaultTaxa) {
            l.name = defaultTaxa[l.name];
          }
          l.order = i;
          return l;
        });

      // Break this whole chunk into a function or something
      //
      this.init = getProjectFilters(this.state.summary.path, this.state.summary.dataKey, 'vis');
      //
      this.state.names = this.init.names;
      this.state.level = (this.init.level !== undefined) ? this.init.level : this.state.level;
      this.filters = this.init.filters ? this.init.filters : {};
      this.state.deleted = this.init.deleted ? this.init.deleted : [];
      this.state.tags = this.init.tags ? this.init.tags : this.state.tags;
      //
      // Can lose this after next version
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
      // Consolidate these  VVVV
      this.sort = this.init.sort ? this.init.sort : this.sort;
      this.state.labelKey = this.sort.show;
      this.state.mode = this.sort.type;
      //
      this.state.data = visSortBy(
        this,
        this.formatTaxonomyData(this.initdata, this.state.level),
        false,
      );
      //
      this.updateAttributeValues(this.state.selectedAttribute, this.state.data);
      //
      this.state.preData = this.state.data;
      this.setColorScale(this.state.data);
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
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    this.setLevel(this.state.level);
  }

  componentDidUpdate() {
    if (this.state.renderSVG && !this.state.dialogVisible) {
      this.setDialogVisible();
      handleExportButton(_cloneDeep(this.state.summary.path), this._svg, this.exportComplete);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.tooltip.handle);
    clearTimeout(this.timeout);
    this.exportComplete();
    window.removeEventListener('resize', this.updateDimensions);
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
      sort: this.sort,
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
    this.updateAttributeValues(this.state.selectedAttribute, data);
    this.setState({ data, filters, showRightSidebar }, () => {
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

  setColorScale(data) {
    const uniqSequences = _sortBy([...new Set([]
      .concat(...data.map(d => []
        .concat(...d.matches.map(s => []
          .concat(...s.taxonomy.map((t, k) => {
            const taxa = [];
            let j = 0;
            while (j <= k) {
              taxa.push(s.taxonomy[j]);
              j += 1;
            }
            return taxa.join();
          })))))))]);
    // .sort((a, b) => { // sort to make adjacent less likely to be equal
    //   return this.readsBySequence[b] - this.readsBySequence[a];
    // });
    this.scales.c.domain(uniqSequences);
  }

  setLevel(level) {
    if (!Object.prototype.hasOwnProperty.call(this.filters, level)) {
      this.filters[level] = {};
    }
    const preData = this.updateTaxonomyData(this.state.preData, level, true);
    const deleted = this.updateTaxonomyData(this.state.deleted, level, false);
    const filters = this.filters[level];
    const showRightSidebar = Object.keys(filters).length > 0;
    this.updateChartWidth(showRightSidebar);
    const data = this.filterData(filters, this.state.tags, preData, deleted);
    this.updateAttributeValues(this.state.selectedAttribute, data);
    this.setState({
      level, data, preData, deleted, filters, showRightSidebar
    }, () => {
      this.topSequences = this.renderTopSequences();
      this.save(this.setResult);
    });
  }

  // data.data schema: [row(observations), column(samples), count]
  // Move to data container?
  formatTaxonomyData(data, level) {
    let totalDataReads = 0;
    const formatedData = this.updateTaxonomyData(data.columns.map(c => {
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
        reads: c.reads,
        sequences: [],
        date: collectionDate,
        tags,
        matches,
      };
    }), level, true);
    this.totalDataReads = totalDataReads;
    return formatedData;
  }

  updateTaxonomyData(data, level, updateSequences) {
    if (updateSequences) {
      this.readsBySequence = {};
    }
    // return data.map(d => {
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
    return taxonomyData;
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
    const data = visSortBy(this, samples, false);
    return data;
  }

  applyFilters(filters) {
    const data = this.filterData(filters, this.state.tags, this.state.preData, this.state.deleted);
    this.updateAttributeValues(this.state.selectedAttribute, data);
    this.setState({ filters, data }, _debounce(() => {
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
    const data = this.filterData(
      this.state.filters,
      tags,
      this.state.preData,
      this.state.deleted,
    );
    this.updateAttributeValues(this.state.selectedAttribute, data);
    this.setState({ tags, data }, () => {
      this.save(this.setResult);
    });
  }

  toggleEmptyAttrs() {
    const showEmptyAttrs = !this.state.showEmptyAttrs;
    this.setState({ showEmptyAttrs }, () => {
      this.save(this.setResult);
    });
  }

  stack = (datum, index, yOffset, removed) => {
    return (
      <StackedBarRow
        key={datum.id}
        data={datum}
        index={index}
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
  }

  stackRow = ({ index, style }) => this.stack(this.state.data[index], index, style.top, false)

  attr = (datum, index, yOffset) => {
    return (
      <StackedBarRow
        key={`${this.state.selectedAttribute}-${datum.value}`}
        data={datum}
        index={index}
        yOffset={yOffset}
        labelKey="name"
        metrics={this.metrics}
        scales={this.scales}
        filters={this.state.filters} // TODO: replace w/ minibar count prop
        highlightedDatum={this.state.highlightedDatum}
        hoverDatum={this._hoverDatum}
        clickDatum={this._clickDatum}
        isPercent={(this.props.mode === 'percent')}
        isRemoved={null}
        isAttribute
        unit={this.attribute.unit}
        styles={{
          cell: styles.cell,
          circle: gstyle.circle,
          name: styles.name,
          reads: styles.reads,
        }}
        tags={[]}
        renderSVG={this.state.renderSVG}
      />
    );
  }

  attrRow = ({ index, style }) => this.attr(this.attribute.values[index], index, style.top)

  updateAttributeValues(attribute, data) {
    if (attribute !== '') {
      this.attributes[attribute].values.map(a => {
        a.name = (attribute === 'Year') ? a.value.toString() : a.value.toLocaleString();
        a.samples = [...new Set(a.samples)];
        a.sampleObjects = a.samples.map(s => {
          const [sample] = data.filter(d => d.sampleName === s);
          return sample;
        }).filter(s => s !== undefined);
        a.reads = a.sampleObjects.map(s => s.reads).reduce((ac, v) => ac + v, 0);
        a.sequences = nest()
          .key(s => s.name)
          .entries(a.sampleObjects
            .map(s => s.sequences)
            .reduce((ac, v) => ac.concat(v), []))
          .map(s => ({
            name: s.key,
            reads: s.values.map(v => v.reads).reduce((ac, v) => ac + v, 0),
            taxonomy: s.values[0].taxonomy,
          }));
        return a;
      });
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
      this.sort.show = labelKey;
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
    const options = sortOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>);
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
    };
    const buttons = radioOptions.map(o => {
      const checked = this.sort.reverse === o.value ? 'checked' : '';
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
            value={this.sort.key}
            disabled={this.state.selectedAttribute !== ''}
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
        this.sort.type = event.target.id;
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

  renderLevelSelector(levels) {
    const modalLevel = (this.state.width - 580) < ((800 / 12) * this.levels.length);
    const levelButtons = levels.map((l, i) => {
      const selected = (l.order <= this.state.level) ? styles.selected : '';
      return (
        <div
          key={l.name}
          style={{
            display: 'inline-block',
            marginBottom: '4px',
          }}
        >
          {(i === 0) ? '' : (<div className={`${selected} ${styles.dash}`}>—</div>)}
          <div
            role="button"
            tabIndex={0}
            className={`${selected} ${styles.selector}`}
            onClick={() => this.setLevel(l.order)}
            onKeyPress={() => this.setLevel(l.order)}
          >
            {l.name}
          </div>
        </div>
      );
    });
    const [currentLevel] = _cloneDeep(this.levels).filter(l => l.order === this.state.level);
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
          position: 'absolute',
          top: 136,
          left: this.metrics.leftSidebar,
          width: this.metrics.chartWidth + (this.metrics.nonbarWidth - 4),
          height: '90px',
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
    return this.sequences.map((s, i) => {
      return (
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
      );
    });
  }

  renderTagFilter() {
    const tagFilter = this.state.showTags ? (
      <div key="tagFilter" className={styles.tagFilter}>
        <div
          role="button"
          tabIndex={0}
          className={gstyle.close}
          style={{
            margin: '4px 0',
          }}
          onClick={() => { this._toggleTags(); }}
          onKeyPress={() => { this._toggleTags(); }}
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
                  onKeyDown={e => (e.key === 'Enter' ? this._inputs[t.id].blur() : null)}
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
          onKeyPress={this._toggleTags}
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

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

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
        onKeyPress={this.clearResult}
      >
        {this.state.result}
      </div>
    ) : '';

    const spacer = <div className={styles.spacer} />;
    const isAttribute = !(this.state.selectedAttribute === '');
    this.attribute = isAttribute ? _cloneDeep(this.attributes[this.state.selectedAttribute]) : null;
    if (isAttribute) {
      this.attribute.values = this.attribute.values
        .filter(v => {
          if (this.state.showEmptyAttrs) return true;
          return v.reads > 0;
        })
        .sort((a, b) => {
          if (this.sort.reverse) {
            if (a.value === 'no_data') return -Infinity;
            if (b.value === 'no_data') return +Infinity;
            if (a.value < b.value) return -1;
            if (a.value > b.value) return 1;
          } else {
            if (b.value === 'no_data') return -Infinity;
            if (a.value === 'no_data') return +Infinity;
            if (b.value < a.value) return -1;
            if (b.value > a.value) return 1;
          }
          return 0;
        });
    }
    const unit = isAttribute ? this.attribute.unit : null;

    const dataLength = isAttribute ? (
      this.attribute.values
        .filter(v => {
          if (this.state.showEmptyAttrs) return true;
          return v.reads > 0;
        }).length
    ) : this.state.data.length;
    //
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
    
    return (
      <div className={gstyle.container}>
        {redirect}
        {result}
        <div className={gstyle.logo}>
          <Link to="/">
            <img src={logo} alt="Phinch" />
          </Link>
        </div>
        <div className={gstyle.header}>
          <Summary summary={this.state.summary} datalength={this.state.data.length} />
          <div className={styles.controls}>
            {/* ROW 1 */}
            <div className={styles.controlRow}>
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
            </div>
            {/* ROW 2 */}
            <div className={styles.controlRow}>
              {this.renderLevelSelector(this.levels)}
              {spacer}
              {this.renderAttributesSelect()}
              {spacer}
              {this.renderTagFilter()}
            </div>
          </div>
        </div>
        <SideMenu
          showLeftSidebar={this.state.showLeftSidebar}
          leftSidebar={this.metrics.leftSidebar}
          leftMin={this.metrics.left.min}
          chartHeight={this.metrics.chartHeight + (this.metrics.lineHeight * 2)}
          items={this.menuItems}
          toggleMenu={this.toggleMenu}
        />
        <div
          className={`${gstyle.panel} ${gstyle.noscrollbar}`}
          style={{
            width: this.metrics.chartWidth + this.metrics.nonbarWidth,
          }}
        >
          <div
            className={styles.axis}
            style={{
              width: this.metrics.chartWidth + (this.metrics.nonbarWidth - this.metrics.padding),
              // height: this.metrics.lineHeight * 2.5,
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
                // paddingLeft: this.metrics.padding * 0.5,
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
                    onKeyPress={this.toggleEmptyAttrs}
                  >
                    {`${this.state.showEmptyAttrs ? 'Hide' : 'Show'} Empty`}
                  </div>
                </div>
              ) : ''
            }
          </div>
          <div
            className={`${gstyle.panel} ${gstyle.noscrollbar}`}
            style={{
              backgroundColor: '#ffffff',
              width: (this.metrics.chartWidth + this.metrics.nonbarWidth),
              height: this.metrics.chartHeight,
            }}
          >
          <List
            className={`${styles.svglist}`}
            innerTagName='svg'
            width={this.metrics.chartWidth + this.metrics.nonbarWidth}
            height={this.metrics.chartHeight - (this.metrics.padding * 4)}
            itemSize={this.metrics.barContainerHeight + (
              this.metrics.miniBarContainerHeight * Object.keys(this.state.filters).length
            )}
            itemCount={dataLength}
            itemKey={index => (
              isAttribute ? this.attribute.values[index].name : this.state.data[index].sampleName
            )}
          >
            {isAttribute ? this.attrRow : this.stackRow}
          </List>
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
            marginBottom: '-8px',
            left: (
              this.metrics.leftSidebar + this.metrics.barInfoWidth + (this.metrics.padding / 2) + 2
            ),
          }}
          modalPosition={{
            position: 'absolute',
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
            marginBottom: '-8px',
            left: (
              this.metrics.leftSidebar + this.metrics.barInfoWidth + this.metrics.padding + 2 + 130
            ),
          }}
          modalPosition={{
            position: 'absolute',
            bottom: this.metrics.padding * 2,
            left: this.metrics.leftSidebar,
            width: this.metrics.chartWidth + (this.metrics.nonbarWidth - 4),
          }}
          useList
          data={this.state.deleted}
          row={this.stack}
          dataKey='sampleName'
          itemHeight={this.metrics.barContainerHeight +
            (this.metrics.miniBarContainerHeight * Object.keys(this.state.filters).length)
          }
          svgContainer
          // svgHeight={((this.metrics.padding * 2) + (this.metrics.barContainerHeight +
          //     (this.metrics.miniBarContainerHeight * Object.keys(this.state.filters).length)
          //   ) * this.state.deleted.length
          // )}
          badge
        />
      </div>
    );
  }
}
