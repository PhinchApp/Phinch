import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import _debounce from 'lodash.debounce';
import { nest } from 'd3-collection';

import { updateFilters, removeRows, restoreRows, visSortBy, getSortArrow } from '../FilterFunctions';
import { setProjectFilters, getProjectFilters } from '../projects.js';
import DataContainer from '../DataContainer';
import { pageView } from '../analytics.js'

import FilterChart from './FilterChart';
import CheckBoxes from './CheckBoxes';
import FilterRow from './FilterRow';
import SideMenu from './SideMenu';
import Summary from './Summary';
import Loader from './Loader';
import Modal from './Modal';

import gstyle from './general.css';
import styles from './Filter.css';

import stackedbar from 'images/stackedbar.svg';
import logo from 'images/phinch.svg';
import minus from 'images/minus.svg';
import plus from 'images/plus.svg';
import back from 'images/back.svg';
import save from 'images/save.svg';

export default class Filter extends Component {
  constructor(props) {
    super(props);

    pageView('/filter');

    this.timeout = null;

    this.sort = {
      reverse: false,
      key: 'biomid',
    };

    this.state = {
      summary: DataContainer.getSummary(),
      data: DataContainer.getSamples(),
      deleted: [],
      names: {},
      height: window.innerHeight,
      width: window.innerWidth,
      filters: {},
      result: null,
      loading: false,
      redirect: null,
      showRightSidebar: false,
      showLeftSidebar: false,
    };

    this.metrics = {
      padding: 16,
      filterWidth: 175,
      filter: {
        min: 75,
        max: 175,
      },
      leftSidebar: 27,
      left: {
        min: 27,
        max: 121,
      },
      debounce: 350,
    };

    this.columnWidths = {
      order: 0.08,
      phinchName: 0.20,
      biomid: 0.12,
      sampleName: 0.20,
      reads: 0.24,
    };

    this.menuItems = [
      {
        id: 'save',
        name: 'Save',
        action: () => {
          this.save(this.setResult);
        },
        icon: <img src={save} />,
      },
      {
        id: 'back',
        name: 'Back',
        action: () => { 
          this.save(() => {
            this.setState({ redirect: '/Home' });
          });
        },
        icon: <img src={back} />,
      },
    ];

    this.state.redirect = (this.state.summary.path !== '' && this.state.summary.dataKey !== '') ? null : '/';

    this.init = getProjectFilters(this.state.summary.path, this.state.summary.dataKey, 'filter');

    // Ugly... 
    this.state.showLeftSidebar = (this.init.showLeftSidebar !== undefined) ? (
        this.init.showLeftSidebar
      ) : this.state.showLeftSidebar;
    this.metrics.leftSidebar = this.state.showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.metrics.tableWidth = this.state.width - (this.metrics.leftSidebar + this.metrics.filterWidth + this.metrics.padding * 4);

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
      this.metadataKeys = [...new Set(
        this.state.data
          .map(d => Object.keys(d.metadata))
          .reduce((a, v) => a.concat(v), [])
        )]
        .filter(k => k !== 'phinchID')
        .sort();
      this.metadataKeys.forEach((k) => {
        const units = [];
        const values = nest()
          .key(d => d.value)
          .entries(
            this.state.data.slice().map((d, i) => {
              const [value, unit] = d.metadata[k].split(' ');
              if (unit !== undefined && !units.includes(unit)) {
                units.push(unit);
              }
              return {
                sampleName: d.sampleName,
                value: d.metadata[k].slice(),
                splitValue: value,
                unit,
              }
            }).filter(d => d.value !== 'no_data')
          ).map((d, i) => {
            return {
              index: i,
              value: d.key,
              splitValue: d.values.map(v => v.splitValue)[0],
              count: d.values.length,
              samples: d.values.map(v => v.sampleName),
            };
          });
        const unit = units.length ? units[0] : '';
        let groupKey = 'string';
        let filterValues = values.slice();

        if (k.toLowerCase().trim().includes('date') || k.toLowerCase().trim().includes('year')) {
          groupKey = 'date';
          filterValues = values.slice().map((d, i) => {
              if (k.toLowerCase().trim().includes('date')) {
                d.value = new Date(d.value);
              }
              return d;
            })
            .filter(v => {
              return !v.value.toString().toLowerCase().trim().includes('invalid date');
            });
        } else if (this.filterFloat(values.filter(v => v.splitValue !== 'no_data')[0].splitValue) !== null) {
          groupKey = 'number';
          filterValues = values.slice().map((v) => {
              v.value = this.filterFloat(v.splitValue);
              return v;
            })
            .filter(v => {
              return v.value !== null;
            });
        }

        filterValues = filterValues
          .sort((a, b) => {
            return a.value.valueOf() - b.value.valueOf();
          })
          .map((d, i) => {
            d.index = i;
            return d;
          });
        
        let range = {
          min: filterValues[0],
          max: filterValues[filterValues.length - 1],
        };
        if (groupKey === 'string') {
          range = {};
          filterValues.map((v) => {
            range[v.value] = true;
          });
        }

        this.state.filters[k] = {
          key: k,
          unit: unit,
          range: range,
          type: groupKey,
          values: filterValues,
          expanded: false,
        };
        this.filters[groupKey][k] = {
          values: filterValues,
          unit: unit,
          log: true,
        };

        if (!this.init.filters) {
          this.init.filters = {};
        }
        if (this.init.filters[k]) {
          this.init.filters[k].values = filterValues;
          if (k.toLowerCase().trim().includes('date')) {
            this.init.filters[k].range.max.value = new Date(this.init.filters[k].range.max.value);
            this.init.filters[k].range.min.value = new Date(this.init.filters[k].range.min.value);
          }
          this.state.filters[k] = this.init.filters[k];
        }

      });

      this.state.deleted = this.init.deleted ? this.init.deleted : [];
      this.state.names = this.init.names;
      if (this.init.sort) {
        this.sort = this.init.sort;
      }

      DataContainer.setAttributes(this.state.filters);
    }

    this.dragEnd = this.dragEnd.bind(this);
    this.dragOver = this.dragOver.bind(this);
    this.dragStart = this.dragStart.bind(this);
    this.setResult = this.setResult.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.clearResult = this.clearResult.bind(this);
    this.toggleChecks = this.toggleChecks.bind(this);
    this.updateChecks = this.updateChecks.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
    this.redirectToVis = this.redirectToVis.bind(this);
    this.updatePhinchName = this.updatePhinchName.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    this.applyFilters(this.state.filters);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
    window.removeEventListener('resize', this.updateDimensions);
  }

  save = (callback) => {
    const viewMetadata = {
      type: 'filter',
      filters: this.state.filters,
      deleted: this.state.deleted,
      sort: this.sort,
      showLeftSidebar: this.state.showLeftSidebar,
    };
    setProjectFilters(
      this.state.summary.path,
      this.state.summary.dataKey,
      this.state.names,
      viewMetadata,
      callback ? callback : () => {},
      );
  }

  updateDimensions() {
    this.metrics.leftSidebar = this.state.showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.metrics.tableWidth = window.innerWidth - (this.metrics.leftSidebar + this.metrics.filterWidth + this.metrics.padding * 4);
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  filterFloat(value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
      return Number(value);
    }
    return null;
  }

  renderHeader() {
    const columns = [
      {
        id: 'order',
        name: '',
      },
      {
        id: 'phinchName',
        name: 'Phinch Name',
      },
      {
        id: 'biomid',
        name: 'BIOM ID',
      },
      {
        id: 'sampleName',
        name: 'Sample Name',
      },
      {
        id: 'reads',
        name: 'Sequence Reads',
      },
    ];
    return columns.map(c => {
      const onClick = (c.id === 'order') ? (() => {}) : (
          () => { 
            this.sort.key = c.id;
            this.sort.reverse = !this.sort.reverse;
            visSortBy(this, this.state.data, true);
          }
        );
      const arrow = (c.id !== 'order') ? (getSortArrow(this, c.id)) : '';
      return (
        <div
          key={c.id}
          className={styles.columnHeading}
          style={{ width: this.metrics.tableWidth * this.columnWidths[c.id] }}
          onClick={onClick}
        >
          {`${c.name} `}
          {arrow}
        </div>
      );
    });
  }

  renderRows(data, isRemoved) {
    const allData = this.state.data.concat(this.state.deleted);
    return data.map((d, i) => {
      return (
        <FilterRow
          key={d.sampleName}
          index={i}
          data={d}
          allData={allData}
          isRemoved={isRemoved}
          columnWidths={this.columnWidths}
          tableWidth={this.metrics.tableWidth}
          dragEnd={isRemoved ? null : this.dragEnd}
          dragOver={isRemoved ? null : this.dragOver}
          dragStart={isRemoved ? null : this.dragStart}
          updatePhinchName={this.updatePhinchName}
          removeDatum={() => { removeRows(this, [d]) }}
          restoreDatum={() => { restoreRows(this, [d]) }}
        />
      );
    });
  }

  setResult(value) {
    const result = value;
    this.timeout = setTimeout(() => {
      this.clearResult();
    }, 3000);
    const loading = false;
    this.setState({result, loading});
  }

  clearResult() {
    const result = null;
    this.setState({result});
  }

  resetFilters() {
    const filters = {};
    Object.keys(this.state.filters).forEach((k) => {
      const filter = this.state.filters[k];
      if (filter.type === 'string') {
        Object.keys(filter.range).forEach((r) => {
          filter.range[r] = true;
        });
      } else {
        filter.range.min = Object.assign({}, filter.values[0]);
        filter.range.max = Object.assign({}, filter.values[filter.values.length - 1]);
      }
      filters[k] = filter;
    });
    this.applyFilters(filters);
  }

  applyFilters(filters) {
    const deletedSamples = this.state.deleted.map(d => d.sampleName);
    let data = DataContainer.getSamples().map((d, i) => {
      if (this.state.names[d.sampleName]) {
        d.phinchName = this.state.names[d.sampleName];
      }
      return d;
    }).filter((d, i) => {
      let include = true;
      if (deletedSamples.includes(d.sampleName)) {
        include = false;
      }
      Object.keys(filters).forEach((k) => {
        let value = d.metadata[k].slice();
        if (k.toLowerCase().trim().includes('date')) {
          value = new Date(value);
          if (
            !value.toString().toLowerCase().trim().includes('invalid date')
              &&
            (
              value.valueOf() < filters[k].range.min.value.valueOf()
                ||
              value.valueOf() > filters[k].range.max.value.valueOf()
            )
          ) {
            include = false;
          }
        } else if (filters[k].type === 'number' || filters[k].type === 'date') {
          value = value.split(' ')[0];
          if (this.filterFloat(value) !== null) {
            value = this.filterFloat(value);
            if (value < filters[k].range.min.value || value > filters[k].range.max.value) {
              include = false;
            }
          }
        } else {
          if (value !== 'no_data' && !filters[k].range[value]) {
            include = false;
          }
        }
      });
      return include;
    });
    data = visSortBy(this, data, false);
    this.setState({filters, data}, _debounce(() => {
        this.save(this.setResult);
      }), this.metrics.debounce, { leading: false, trailing: true });
  }

  toggleChecks(attribute, value) {
    const filters = this.state.filters;
    Object.keys(filters[attribute].range).forEach(k => {
      filters[attribute].range[k] = value;
    });
    this.applyFilters(filters);
  }

  updateChecks(attribute, type, value) {
    const filters = this.state.filters;
    filters[attribute].range[type] = value;
    this.applyFilters(filters);
  }

  displayFilters() {
    const SectionNames = {
      date: 'Date Range',
      number: 'Numeric Range',
      string: 'Categories',
    };
    return Object.keys(this.filters).map((k, i) => {
      const group = Object.keys(this.filters[k]).map((g) => {
        const expanded = this.state.filters[g].expanded;
        const icon = expanded ? minus : plus;
        const height = expanded ? 60 : 20;
        const filter = (this.state.filters[g].type === 'string') ? (
            <CheckBoxes
              name={g}
              data={this.filters[k][g]}
              filter={this.state.filters[g]}
              update={this.updateChecks}
              setAll={this.toggleChecks}
            />
          ) : (
            <FilterChart
              name={g}
              showScale={false}
              showCircle={false}
              fill={'#4c4c4c'}
              stroke={'#ffffff'}
              handle={'#00bbda'}
              color={'#000000'}
              data={this.filters[k][g]}
              width={this.metrics.filterWidth}
              height={height}
              filters={this.state.filters}
              update={updateFilters}
              callback={this.applyFilters}
            />
          );
        return (
          <div key={g} className={styles.filter}>
            <div className={styles.expand} onClick={() => {
              const filters = this.state.filters;
              filters[g].expanded = !filters[g].expanded;
              this.setState({filters}, () => {
                  this.save(this.setResult);
                });
            }}>
              <img src={icon} alt={expanded ? 'minus' : 'plus'} />
            </div>
            {filter}
          </div>
        );
      });
      return (
        <div key={k} className={styles.bottom} style={{
          width: this.metrics.filterWidth + this.metrics.padding * 3,
        }}>
          <div className={styles.filterHeading}>
            {SectionNames[k]}
          </div>
          <div className={styles.group}>
            {group}
          </div>
        </div>
      );
    });
  }

  updatePhinchName(e, r) {
    const names = this.state.names;
    const data = this.state.data.map((d) => {
      if (d.sampleName === r.sampleName) {
        d.phinchName = e.target.value;
      }
      names[d.sampleName] = d.phinchName;
      return d;
    });
    this.setState({data, names}, _debounce(() => {
        this.save(this.setResult);
      }), this.metrics.debounce, { leading: false, trailing: true });
  }

  dragEnd(e) {
    let target = Number(this.over.dataset.id);
    if ((e.clientY - this.over.offsetTop) > (this.over.offsetHeight / 2)) {
      target++;
    }
    if (this.dragged <= target) {
      target--;
    }
    let data = this.state.data;
    data.splice(target, 0, data.splice(this.dragged, 1)[0]);
    data = data.map((d, i) => {
      d.order = i;
      return d;
    }); 
    this.over.style = null;
    this.over = null;
    this.dragged = null;
    this.sort.reverse = true;
    this.sort.key = 'order';
    visSortBy(this, data, true);
  }
  dragOver(e) {
    e.preventDefault();
    if (this.over) {
      this.over.style = null;
    }
    this.over = e.currentTarget;
    // I know this isn't the React way, but re-rendering the whole table takes forever
    this.over.style = 'background: #e4e4e4; height: 3rem; vertical-align: top;';
  }
  dragStart(e) {
    this.dragged = Number(e.currentTarget.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', null);
  }

  toggleMenu() {
    const showLeftSidebar = !this.state.showLeftSidebar;
    this.metrics.leftSidebar = showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.metrics.tableWidth = this.state.width - (this.metrics.leftSidebar + this.metrics.filterWidth + this.metrics.padding * 4);
    this.setState({ showLeftSidebar }, () => {
        this.save(this.setResult);
      });
  }

  redirectToVis(result) {
    if (result === 'error') {
      this.setResult(result);
    } else {
      this.setState({redirect: '/vis'});
    }
  }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    if (redirect) {
      return redirect;
    }

    const result = this.state.result ? (
      <div 
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
      >
          {this.state.result}
      </div>
    ) : '';

    return (
      <div className={gstyle.container}>
        <Loader loading={this.state.loading} />
        {redirect}
        <div className={styles.header}>
          <div className={gstyle.logo}>
            <Link to="/">
              <img src={logo} alt='Phinch' />
            </Link>
          </div>
          <div className={gstyle.header}>
            <Summary summary={this.state.summary} datalength={this.state.data.length} />
            <div className={styles.visRowLabel}>Visualization Type</div>
            <div className={styles.visOption}>
              <img src={stackedbar} alt='Stacked bargraph' />
              <div className={styles.visOptionLabel}>Stacked bargraph</div>
            </div>
            <div
              className={`${gstyle.button} ${styles.button}`}
              onClick={() => {  
                this.setState({ loading: true }, () => {
                  setTimeout(() => {
                    DataContainer.applyFiltersToData(this.state.data);
                    this.save(this.redirectToVis);
                  }, 1);
                });
              }}
            >
              View Visualization
            </div>
            <div className={styles.headingRow}>
              <div
                className={styles.spacer}
                style={{
                  width: (
                    this.metrics.leftSidebar + this.metrics.filterWidth + this.metrics.padding * 4
                  ) - 100,
                }} />
              {this.renderHeader()}
            </div>
            {result}
          </div>
        </div>
        <div style={{ position: 'relative', backgroundColor: '#ffffff', color: '#808080'}}>
          <SideMenu
            showLeftSidebar={this.state.showLeftSidebar}
            leftSidebar={this.metrics.leftSidebar}
            leftMin={this.metrics.left.min}
            chartHeight={(this.state.height - 130)}
            items={this.menuItems}
            toggleMenu={this.toggleMenu}
          />
          <div className={`${styles.section} ${styles.left}`} style={{
            display: 'inline-block',
            height: (this.state.height - 130),
            overflowY: 'overlay',
          }}>
            {this.displayFilters()}
            <div
              className={`${gstyle.button} ${styles.reset}`}
              onClick={this.resetFilters}
            >
              Reset Filters
            </div>
          </div>
          <div
            className={`${styles.section} ${styles.right}`}
            style={{
              width: this.metrics.tableWidth,
              height: this.state.height - 130,
              overflowY: 'scroll',
            }}
          >
            {this.renderRows(this.state.data, false)}
            <Modal
              buttonTitle={'Archived Samples'}
              modalTitle={'Archived Samples'}
              buttonPosition={{
                position: 'absolute',
                bottom: 0,
                marginBottom: '-8px',
                left: this.state.width - (this.metrics.tableWidth + this.metrics.padding / 2),
              }}
              modalPosition={{
                position: 'absolute',
                bottom: this.metrics.padding * 2,
                left: this.state.width - (this.metrics.tableWidth + this.metrics.padding / 2),
                width: this.metrics.tableWidth,
              }}
              data={this.renderRows(this.state.deleted, true)}
              badge={true}
            />
          </div>
        </div>
      </div>
    );
  }
}
