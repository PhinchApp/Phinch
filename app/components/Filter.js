import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

import _debounce from 'lodash.debounce';
import _cloneDeep from 'lodash.clonedeep';

import stackedbar from 'images/stackedbar.svg';
import logo from 'images/phinch.svg';
import minus from 'images/minus.svg';
import plus from 'images/plus.svg';
import back from 'images/back.svg';
import save from 'images/save.svg';

import { updateFilters, removeRows, restoreRows, visSortBy, getSortArrow } from '../filterfunctions';
import { setProjectFilters, getProjectFilters } from '../projects';
import DataContainer from '../datacontainer';
import { pageView } from '../analytics';

import FilterChart from './FilterChart';
import CheckBoxes from './CheckBoxes';
import FilterRow from './FilterRow';
import SideMenu from './SideMenu';
import Summary from './Summary';
import Loader from './Loader';
import Modal from './Modal';

import gstyle from './general.css';
import styles from './Filter.css';

function filterFloat(value) {
  if (/^(-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
    return Number(value);
  }
  return null;
}

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
      filters: DataContainer.getAttributes(),
      deleted: [],
      names: {},
      height: window.innerHeight,
      width: window.innerWidth,
      result: null,
      loading: false,
      redirect: null,
      showLeftSidebar: false,
    };

    this.filters = DataContainer.getFilters();

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
      phinchName: 0.18,
      biomid: 0.12,
      sampleName: 0.18,
      reads: 0.24,
    };

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
        id: 'back',
        name: 'Back',
        action: () => {
          this.save(() => {
            this.setState({ redirect: '/Home' });
          });
        },
        icon: <img src={back} alt="back" />,
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
    this.metrics.tableWidth = this.state.width
      - (this.metrics.leftSidebar + this.metrics.filterWidth + (this.metrics.padding * 4));

    Object.keys(this.state.filters).forEach(k => {
      if (!this.init.filters) {
        this.init.filters = {};
      }
      if (this.init.filters[k]) {
        this.init.filters[k].values = this.state.filters[k].values;
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
      callback || (() => {}),
    );
  }

  updateDimensions() {
    this.metrics.leftSidebar = this.state.showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.metrics.tableWidth = window.innerWidth
    - (this.metrics.leftSidebar + this.metrics.filterWidth + (this.metrics.padding * 4));
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
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
          const data = visSortBy(this, this.state.data, false);
          const deleted = visSortBy(this, this.state.deleted, false);
          this.setState({ data, deleted }, () => this.save(this.setResult));
        }
      );
      const arrow = (c.id !== 'order') ? (getSortArrow(this, c.id)) : '';
      return (
        <div
          key={c.id}
          role="button"
          tabIndex={0}
          className={styles.columnHeading}
          style={{ width: this.metrics.tableWidth * this.columnWidths[c.id] }}
          onClick={onClick}
          onKeyPress={e => (e.key === ' ' ? onClick() : null)}
        >
          {`${c.name} `}
          {arrow}
        </div>
      );
    });
  }

  row = (datum, index, yOffset, removed) => (
    <FilterRow
      key={datum.sampleName}
      index={index}
      yOffset={yOffset}
      data={datum}
      allData={this.allData}
      isRemoved={removed}
      columnWidths={this.columnWidths}
      tableWidth={this.metrics.tableWidth}
      dragOver={this.dragOver}
      updatePhinchName={this.updatePhinchName}
      removeDatum={() => { removeRows(this, [datum]); }}
      restoreDatum={() => { restoreRows(this, [datum]); }}
    />
  );

  tableRow = ({ index, style }) => this.row(this.state.data[index], index, style.top, false)

  setResult(value) {
    const result = value;
    this.timeout = setTimeout(() => {
      this.clearResult();
    }, 3000);
    const loading = false;
    this.setState({ result, loading });
  }

  clearResult() {
    const result = null;
    this.setState({ result });
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
    let data = DataContainer.getSamples().map(d => {
      if (this.state.names[d.sampleName]) {
        d.phinchName = this.state.names[d.sampleName];
      }
      return d;
    }).filter(d => {
      let include = true;
      if (deletedSamples.includes(d.sampleName)) {
        include = false;
      }
      Object.keys(filters).forEach((k) => {
        let value = d.metadata[k];
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
          [value] = value.split(' ');
          if (filterFloat(value) !== null) {
            value = filterFloat(value);
            if (value < filters[k].range.min.value || value > filters[k].range.max.value) {
              include = false;
            }
          }
        } else if (value !== 'no_data' && !filters[k].range[value]) {
          include = false;
        }
      });
      return include;
    });
    data = visSortBy(this, data, false);
    this.setState({ filters, data }, _debounce(() => {
      this.save(this.setResult);
    }), this.metrics.debounce, { leading: false, trailing: true });
  }

  toggleChecks(attribute, value) {
    const filters = _cloneDeep(this.state.filters);
    Object.keys(filters[attribute].range).forEach(k => {
      filters[attribute].range[k] = value;
    });
    this.applyFilters(filters);
  }

  updateChecks(attribute, type, value) {
    const filters = _cloneDeep(this.state.filters);
    filters[attribute].range[type] = value;
    this.applyFilters(filters);
  }

  displayFilters() {
    const SectionNames = {
      date: 'Date Range',
      number: 'Numeric Range',
      string: 'Categories',
    };
    return Object.keys(this.filters).map(k => {
      const group = Object.keys(this.filters[k]).map(g => {
        const { expanded } = this.state.filters[g];
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
            fill="#4c4c4c"
            stroke="#ffffff"
            handle="#00bbda"
            color="#000000"
            data={this.filters[k][g]}
            width={this.metrics.filterWidth}
            height={height}
            filters={this.state.filters}
            update={updateFilters}
            callback={this.applyFilters}
          />
        );
        const toggleExpand = () => {
          const filters = Object.assign({}, this.state.filters);
          filters[g].expanded = !filters[g].expanded;
          this.setState({ filters }, () => {
            this.save(this.setResult);
          });
        };
        return (
          <div key={g} className={styles.filter}>
            <div
              role="button"
              tabIndex={0}
              className={styles.expand}
              onClick={toggleExpand}
              onKeyPress={e => (e.key === ' ' ? toggleExpand() : null)}
            >
              <img src={icon} alt={expanded ? 'minus' : 'plus'} />
            </div>
            {filter}
          </div>
        );
      });
      return (
        <div
          key={k}
          className={styles.bottom}
          style={{
            width: this.metrics.filterWidth + (this.metrics.padding * 3),
          }}
        >
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
    const names = _cloneDeep(this.state.names);
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

  dragEnd(e) {
    const source = Number(this.dragged.dataset.id);
    let target = Number(this.over.dataset.id);

    this.over.style.background = '';
    this.over.style.outline = '';

    if (
      isNaN(source)
        ||
      isNaN(target)
        ||
      (source === target && this.dragged.dataset.group === this.over.dataset.group)
    ) {
      return;
    }
    
    if ((e.clientY - this.over.offsetTop) > (this.over.offsetHeight / 2)) {
      target += 1;
    }
    if (source <= target) {
      target -= 1;
    }

    this.sort.reverse = true;
    this.sort.key = 'order';    

    if (this.dragged.dataset.group === this.over.dataset.group) {
      const isRemoved = this.over.dataset.group === 'removed';
      let data = isRemoved ? _cloneDeep(this.state.deleted) : _cloneDeep(this.state.data);
      data.splice(target, 0, data.splice(source, 1)[0]);
      data = data.map((d, i) => {
        d.order = i;
        return d;
      });
      data = visSortBy(this, data, false);
      if (isRemoved) {
        this.setState({ deleted: data }, () => this.save(this.setResult));
      } else {
        this.setState({ data }, () => this.save(this.setResult));
      }
    } else {
      let data = _cloneDeep(this.state.data);
      let deleted = _cloneDeep(this.state.deleted);
      if (this.dragged.dataset.group === 'data') {
        const [datum] = data.splice(source, 1);
        deleted.splice(target, 0, datum);
      } else {
        const [datum] = deleted.splice(source, 1);
        data.splice(target, 0, datum);
      }
      data = data.map(d => {
        d.order = 1;
        return d;
      });
      deleted = deleted.map(d => {
        d.order = 1;
        return d;
      });
      data = visSortBy(this, data, false);
      deleted = visSortBy(this, deleted, false);
      this.setState({ data, deleted }, () => this.save(this.setResult));
    }

    this.over.style.background = '';
    this.over.style.outline = '';
    this.over = null;
    this.dragged = null;
  }

  dragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    if (this.over) {
      this.over.style.background = '';
      this.over.style.outline = '';
    }
    this.over = e.currentTarget;
    this.over.style.background = '#e4e4e4';
  }

  dragStart(e) {
    this.dragged = {
      dataset: Object.assign({}, e.target.dataset),
    };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', null);
  }

  toggleMenu() {
    const showLeftSidebar = !this.state.showLeftSidebar;
    this.metrics.leftSidebar = showLeftSidebar ?
      this.metrics.left.max : this.metrics.left.min;
    this.metrics.tableWidth = this.state.width - (
      this.metrics.leftSidebar + this.metrics.filterWidth + (this.metrics.padding * 4)
    );
    this.setState({ showLeftSidebar }, () => {
      this.save(this.setResult);
    });
  }

  redirectToVis(result) {
    if (result === 'error') {
      this.setResult(result);
    } else {
      this.setState({ redirect: '/vis' });
    }
  }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    if (redirect) {
      return redirect;
    }

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

    const viewVisualization = () => {
      this.setState({ loading: true }, () => {
        setTimeout(() => {
          DataContainer.applyFiltersToData(this.state.data);
          this.save(this.redirectToVis);
        }, 1);
      });
    };

    this.allData = this.state.data.concat(this.state.deleted);

    return (
      <div className={gstyle.container}>
        <Loader loading={this.state.loading} />
        {redirect}
        {result}
        <div className={styles.header}>
          <div className={gstyle.logo}>
            <Link to="/">
              <img src={logo} alt="Phinch" />
            </Link>
          </div>
          <div className={gstyle.header}>
            <Summary summary={this.state.summary} datalength={this.state.data.length} />
            <div className={styles.visRowLabel}>Visualization Type</div>
            <div className={styles.visOption}>
              <img src={stackedbar} alt="Stacked bargraph" />
              <div className={styles.visOptionLabel}>Stacked bargraph</div>
            </div>
            <div
              role="button"
              tabIndex={0}
              className={`${gstyle.button} ${styles.button}`}
              onClick={viewVisualization}
              onKeyPress={e => (e.key === ' ' ? viewVisualization() : null)}
            >
              View Visualization
            </div>
            <div className={styles.headingRow}>
              <div
                className={styles.spacer}
                style={{
                  width: (
                    this.metrics.leftSidebar + this.metrics.filterWidth + (
                      this.metrics.padding * 4
                    )
                  ) - 100,
                }}
              />
              {this.renderHeader()}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', backgroundColor: '#ffffff', color: '#808080' }}>
          <SideMenu
            showLeftSidebar={this.state.showLeftSidebar}
            leftSidebar={this.metrics.leftSidebar}
            leftMin={this.metrics.left.min}
            chartHeight={(this.state.height - 130)}
            items={this.menuItems}
            toggleMenu={this.toggleMenu}
          />
          <div
            className={`${styles.section} ${styles.left}`}
            style={{
              display: 'inline-block',
              height: (this.state.height - 130),
              overflowY: 'overlay',
            }}
          >
            {this.displayFilters()}
            <div
              role="button"
              tabIndex={0}
              className={`${gstyle.button} ${styles.reset}`}
              onClick={this.resetFilters}
              onKeyPress={e => (e.key === ' ' ? this.resetFilters() : null)}
            >
              Reset Filters
            </div>
          </div>
          <div
            className={`${styles.section} ${styles.right}`}
            style={{
              width: this.metrics.tableWidth,
              height: this.state.height - 130,
            }}
            onDragStart={this.dragStart}
            onDrop={this.dragEnd}
          >
            <List
              className={`${styles.divlist}`}
              width={this.metrics.tableWidth}
              height={this.state.height - 130}
              itemSize={28}
              itemCount={this.state.data.length}
              itemKey={index => this.state.data[index].sampleName}
            >
              {this.tableRow}
            </List>
            <Modal
              buttonTitle="Archived Samples"
              modalTitle="Archived Samples"
              buttonPosition={{
                position: 'absolute',
                bottom: 0,
                left: this.state.width - (this.metrics.tableWidth + (this.metrics.padding / 2)),
              }}
              modalPosition={{
                position: 'absolute',
                bottom: this.metrics.padding * 2,
                left: this.state.width - (this.metrics.tableWidth + (this.metrics.padding / 2)),
                width: this.metrics.tableWidth,
              }}
              useList
              data={this.state.deleted}
              row={this.row}
              dataKey="sampleName"
              itemHeight={28}
              badge
            />
          </div>
        </div>
      </div>
    );
  }
}
