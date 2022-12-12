import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

import Spotlight from "rc-spotlight";
import 'antd/dist/antd.css';
import { Tooltip } from 'antd';
import ReactTooltip from 'react-tooltip';
import SpotlightWithToolTip from './SpotlightWithToolTip';

import _debounce from 'lodash.debounce';
import _cloneDeep from 'lodash.clonedeep';
import classNames from 'classnames'
import stackedbar from 'images/stackedbar.svg';
import bubblegraph from 'images/bubblegraph.svg';
import sankeygraph from 'images/sankeygraph.svg';
import logo from 'images/phinch.svg';
import minus from 'images/minus.svg';
import plus from 'images/plus.svg';
import back from 'images/back.svg';
import save from 'images/save.svg';
import needHelp from 'images/needHelpDefault.png';
import needHelpHover from 'images/needHelpHover.png';
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


import {
  updateFilters,
  removeRows,
  restoreRows,
  visSortBy,
  getSortArrow,
  countObservations
} from '../filterfunctions';
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

const isMac = () => process.platform === 'darwin';

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

    this.state = {
      summary: DataContainer.getSummary(),
      data: DataContainer.getSamples(),
      filters: DataContainer.getAttributes(),
      observations: 0,
      deleted: [],
      names: {},
      height: window.innerHeight,
      width: window.innerWidth,
      result: null,
      loading: false,
      redirect: null,
      showLeftSidebar: true,
      sortReverse: false,
      sortKey: 'biomid',
      helpButton: needHelp,
      deleting: false,
      counter: 0, //tracks what help step we are on to allow global click advance
      selectedVisualization: null ,
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
      order: 0.06,
      phinchName: 0.325,
      biomid: 0.15,
      sampleName: 0.325,
      reads: 0.14,
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
      this.state.sortReverse = this.init.sort.sortReverse === undefined
        ? this.state.sortReverse
        : this.init.sort.sortReverse;
      this.state.sortKey = this.init.sort.sortKey === undefined
        ? this.state.sortKey
        : this.init.sort.sortKey;
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
    this.countUp = this.countUp.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    this.applyFilters(this.state.filters);
    window.addEventListener('click', this.countUp);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
    window.removeEventListener('resize', this.updateDimensions);
    window.removeEventListener('click', this.countUp);
  }

  componentDidUpdate() {
    ReactTooltip.rebuild()
  }

  countUp() {
    if(this.state.counter > 0) {
      const currCount = this.state.counter;
      const newCount = currCount + 1;
      newCount > 8 ? this.setState({ counter: 1, }) : this.setState({ counter: newCount, });
      console.log(this.state.counter);
    }
  }

  save = (callback) => {
    const viewMetadata = {
      type: 'filter',
      filters: this.state.filters,
      deleted: this.state.deleted,
      sort: {
        sortReverse: this.state.sortReverse,
        sortKey: this.state.sortKey,
      },
      showLeftSidebar: true,
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
    console.log(this.metrics.tableWidth);
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
        name: 'Observations',
      },
    ];
    return columns.map(c => {
      const onClick = (c.id === 'order') ? (() => {}) : (
        () => {
          const sortReverse = !this.state.sortReverse;
          const sortKey = c.id;
          const data = visSortBy(this.state.data, sortReverse, sortKey);
          const deleted = visSortBy(this.state.deleted, sortReverse, sortKey);
          this.setState({
            data, deleted, sortReverse, sortKey
          }, () => this.save(this.setResult));
        }
      );
      const arrow = (c.id !== 'order')
        ? getSortArrow(this.state.sortReverse, this.state.sortKey, c.id)
        : '';
      return (
        <div
          key={c.id}
          role="button"
          tabIndex={0}
          className={styles.columnHeading}
          // This -250 from the width is so drag and close buttons are always visible
          style={{ width: (this.metrics.tableWidth - 250) * this.columnWidths[c.id],
                   textAlign: c.id === 'biomid' ? 'right':'left', }}
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
      deleting={this.state.deleting}
      delete={() => this.setState({ deleting: true })}
      cancel={() => this.setState({ deleting: false })}
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
              value.valueOf() < new Date(filters[k].range.min.value).valueOf()
                ||
              value.valueOf() > new Date(filters[k].range.max.value).valueOf()
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
    data = visSortBy(data, this.state.sortReverse, this.state.sortKey);
    const observations = countObservations(data);
    this.setState({ filters, data, observations }, _debounce(() => {
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
            fill="#4D4D4D"
            stroke="#ffffff"
            handle="#F09E6A"
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

  renderModal() {
    return (
      <Modal
        show={this.state.counter == 7}
        spotlight={this.state.counter == 7 && (this.state.deleted.length > 0)}
        buttonTitle="Archived Samples"
        modalTitle="Archived Samples"
        buttonPosition={{
          position: 'absolute',
          bottom: 0,
        }}
        modalPosition={this.state.counter == 7 ? {
          position: 'absolute',
          bottom: '5rem',
          width: this.metrics.tableWidth - 15,
        } : {
          position: 'absolute',
          bottom: this.metrics.padding * 2,
          width: this.metrics.tableWidth - 15,
        }}
        useList
        data={this.state.deleted}
        row={this.row}
        dataKey="sampleName"
        itemHeight={28}
        badge
        />);
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
      Number.isNaN(source)
        ||
      Number.isNaN(target)
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

    const sortReverse = true;
    const sortKey = 'order';

    if (this.dragged.dataset.group === this.over.dataset.group) {
      const isRemoved = this.over.dataset.group === 'removed';
      let data = isRemoved ? _cloneDeep(this.state.deleted) : _cloneDeep(this.state.data);
      data.splice(target, 0, data.splice(source, 1)[0]);
      data = data.map((d, i) => {
        d.order = i;
        return d;
      });
      data = visSortBy(data, sortReverse, sortKey);
      if (isRemoved) {
        this.setState({ deleted: data, sortReverse, sortKey }, () => this.save(this.setResult));
      } else {
        this.setState({ data, sortReverse, sortKey }, () => this.save(this.setResult));
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
      data = visSortBy(data, sortReverse, sortKey);
      deleted = visSortBy(deleted, sortReverse, sortKey);
      this.setState({
        data, deleted, sortReverse, sortKey
      }, () => this.save(this.setResult));
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
    this.setState({ showLeftSidebar });
  }

  redirectToVis(result) {
    if (result === 'error') {
      this.setResult(result);
    } else {
      this.setState({ redirect: `/vis/${this.state.selectedVisualization}` });
    }
  }

  makeHelpButtons() {
    return (
      <div className={gstyle.helpIcons}>
        <div
        role="button"
        className={gstyle.helpIcons}
        onClick={() => {this.setState({ counter: 0 }); this.forceUpdate(); this.deleteBackdropTooltip()} }
        >
          <img src={closeHelp} alt="close-walkthrough" />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ counter: 8 })}
        >
          <img src={this.state.counter == 1 ? help1Hover : help1} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ counter: 1 })}
        >
          <img src={this.state.counter == 2 ? help2Hover : help2} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ counter: 2 })}
        >
          <img src={this.state.counter == 3 ? help3Hover : help3} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ counter: 3 })}
        >
          <img src={this.state.counter == 4 ? help4Hover : help4} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ counter: 4 })}

        >
          <img src={this.state.counter == 5 ? help5Hover : help5} />
        </div>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => this.setState({ counter: 5 })}
        >
          <img src={this.state.counter == 6 ? help6Hover : help6} />
        </div>

        <SpotlightWithToolTip
          isActive={this.state.counter == 7 && (this.state.deleted.length == 0)}
          toolTipPlacement="top"
          toolTipTitle={<div>
            To explore the 'Archived Samples' feature more, please use the{' '}
            navigation bar in the bottom left to close the walkthrough. {' '}
            Once closed, delete at least 1 sample row by clicking the 'X' on the far right{' '}
            of the rows that is visible when the row is hovered. Then return to feature 7. </div>}
          >
          <div
          role="button"
          tabIndex={0}
          className={gstyle.helpIcons}
          onClick={() => {this.setState({ counter: 6 }); this.renderModal();}}
          >
            <img src={this.state.counter == 7 ? help7Hover : help7} />
          </div>
        </SpotlightWithToolTip>

        <div
        role="button"
        tabIndex={0}
        className={gstyle.helpIcons}
        onClick={() => {this.setState({ counter: 7 }); this.forceUpdate();}}
        >
          <img src={this.state.counter == 8 ? help8Hover : help8} />
        </div>
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

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;
    const helpButtons = this.state.counter > 0 ? this.makeHelpButtons() : '';

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
          top: 'calc(100vh - 40px)',
          right: '16px',
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
      if (!this.state.selectedVisualization) {
        return
      }
      this.setState({ loading: true }, () => {
        setTimeout(() => {
          DataContainer.applyFiltersToData(this.state.data);
          this.save(this.redirectToVis);
        }, 1);
      });
    };

    this.allData = this.state.data.concat(this.state.deleted);

    const notMac = isMac() ? '' : gstyle.notMac;
    return (
      <div className={`${gstyle.container} ${notMac}`}>
        <Loader loading={this.state.loading} />
        {redirect}
        {result}
        <div className={`${styles.header}`}>
          <div className={`${styles.filterLogo}`}>
            <Link to="/">
              <img src={logo} alt="Phinch" />
            </Link>
            <button
              className={gstyle.help}
              // on click command is still undefined outside of home page, set to issues page for now until later
              onClick={() => this.setState({ counter: 8 })}
              onMouseEnter={() => this.handleMouseOver("help")}
              onMouseLeave={() => this.handleMouseLeave("help")}
              >
                <img src={this.state.helpButton} alt="needHelp" />
            </button>
          </div>
          <div className={gstyle.header}>
            <Summary
              summary={this.state.summary}
              observations={this.state.observations}
              datalength={this.state.data.length}
              helping={this.state.counter == 2}
              />

            <SpotlightWithToolTip
              isActive={this.state.counter == 3}
              inheritParentBackgroundColor={false}
              toolTipPlacement="bottomRight"
              toolTipTitle={<div>
                The uploaded data file can be explored through a number{' '}
                of distinct visualization types.
                <br /><br />
                Click on one of the listed options to select that visualization type,{' '}
                and then click “View Visualization” to see the graphs made by the option{' '}
                you choose.
              </div>}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', boxShadow: 'inset rgba(255, 255, 255, 0.5) 0px 0px 10px'}}
            >
              <div>
                <div className={styles.visRowLabel}>Visualization Type</div>
                <div className={styles.visOption} onClick={() => this.setState({ selectedVisualization: 'stackedbar' })}>
                  <img src={stackedbar} alt="Stacked bargraph" />
                  <div className={classNames(styles.visOptionLabel, { [styles.selected]: this.state.selectedVisualization === 'stackedbar'})}
                    id="stackedgraph" >Stacked Bargraph</div>
                </div>
                <div className={styles.visOption} onClick={() => this.setState({ selectedVisualization: 'sankey' })}>
                  <img src={sankeygraph} alt="Sankey bargraph" id="sankeygraph" />
                  <div
                    className={classNames(styles.visOptionLabel, { [styles.selected]: this.state.selectedVisualization === 'sankey'})}
                  >Sankey graph</div>
                </div>
                <div className={styles.futureVis}>
                  <img src={bubblegraph} alt="Bubble Graph" id="bubblegraph" />
                  <div className={styles.visOptionLabel}>Bubble Graph</div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className={classNames(gstyle.button, styles.button, { [styles.buttonDisabled]: !this.state.selectedVisualization })}
                  onClick={viewVisualization}
                  onKeyPress={e => (e.key === ' ' ? viewVisualization() : null)}
                  onMouseEnter={this.state.selectedVisualization ? () =>  this.handleMouseOver("viewViz") : null}
                  onMouseLeave={this.state.selectedVisualization ? () => this.handleMouseLeave("viewViz") : null}
                  data-tip={this.state.selectedVisualization ? null : 'Please select a visualization type'}
                  >
                  View Visualization
                </div>
              </div>
            </SpotlightWithToolTip>
            <SpotlightWithToolTip
              isActive={this.state.counter == 6}
              toolTipPlacement="bottomRight"
                >
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
              </SpotlightWithToolTip>
          </div>
        </div>
        <div style={{ position: 'inherit', backgroundColor: '#fdfdfa', color: '#808080' }}>
          <SideMenu
            showLeftSidebar={this.state.showLeftSidebar}
            leftSidebar={this.metrics.leftSidebar}
            leftMin={this.metrics.left.min}
            chartHeight={(this.state.height - 155)}
            items={this.menuItems}
            toggleMenu={this.toggleMenu}
            spotlight={this.state.counter == 8}
            />
          <SpotlightWithToolTip
            isActive = {this.state.counter == 1}
            inheritParentBackgroundColor={false}
            toolTipPlacement="topLeft"
            toolTipTitle={"All metadata (left column) and sample info (right columns) are loaded FROM THE FILE ITSELF, and the app dynamically populates all this information after file upload. "}
            overlayStyle={{zIndex: '1001'}}
            style={{backgroundColor: '#ffffff', boxShadow: 'none'}}
          >

            <div
              className={`${styles.section} ${styles.left}`}
              style={{
                display: 'inline-block',
                height: (this.state.height - (this.state.counter == 1 ? 240 : 155)),
                overflowY: 'overlay',
              }}
            >
              <SpotlightWithToolTip
                isActive={this.state.counter == 4 || this.state.counter == 5}
                toolTipPlacement="rightBottom"
                toolTipTitle={this.state.counter == 4 ? <div>
                  On the left panel, click the arrow button to view filtering{' '}
                  options for file metadata. There are three categories for{' '}
                  filtering: “Date Range” (to filter by time/date),{' '}
                  “Numerical Range” (for metadata categories that are exclusively{' '}
                  numerical, such as pH, temperature, etc), and “Categories”{' '}
                  (For metadata categories that are text only or alphanumeric{' '}
                  combinations).
                  <br /><br />
                  “Date Range” and “Numerical Range” display the file data as histograms,{' '}
                  while “Categories” show the metadata values with associated checkboxes.{' '}
                  Histograms can be filtered using slider bars, while Categorical data can{' '}
                  be filtered by selecting or unselecting each checkbox.
                  <br /><br />
                  All metadata populated in this panel is generated FROM THE FILE ITSELF,{' '}
                  and the app dynamically populates all this information after file upload.
                  <br /><br />
                  Changing filter selections in this panel will cause the sample list{' '}
                  to automatically update, displaying only those samples that meet the{' '}
                  chosen filtering selections.
                  </div>
                  :
                  <div>
                    If you would like to reset the filters, scroll all the way down{' '}
                    on the left column to find the “Reset Filters” button.
                  </div>}
                overlayStyle={{maxWidth: '600px'}}
                  >
                  <div style={{
                    height: (this.state.counter == 4 || this.state.counter == 5 ? this.state.height - 240 : 'auto'),
                    overflowY: 'overlay',
                  }}>
                    {this.displayFilters()}
                    <div
                      role="button"
                      id="reset"
                      tabIndex={0}
                      className={`${gstyle.button} ${styles.reset}`}
                      onClick={this.resetFilters}
                      onKeyPress={e => (e.key === ' ' ? this.resetFilters() : null)}
                    >
                      Reset Filters
                    </div>
                  </div>
              </SpotlightWithToolTip>
            </div>
            <div
              className={`${styles.section} ${styles.right}`}
              style={{
                width: this.metrics.tableWidth - 6,
                height: (this.state.height - (this.state.counter >= 1 ? 240 : 155)),
                overflowY: 'overlay',
              }}
              onDragStart={this.dragStart}
              onDrop={this.dragEnd}
            >
              <SpotlightWithToolTip
                isActive={this.state.counter == 6 || this.state.counter == 8}
                toolTipPlacement="leftTop"
                toolTipTitle={this.state.counter == 6 ? <div>
                  In the sample info panel, the graph shows the distribution of samples{' '}
                  (e.g. range of sequencing depth across samples in the uploaded file).{' '}
                  The red line indicates the position of the present sample row in the{' '}
                  overall dataset.
                  <br /><br />
                  There will be icons appear for only one row at a time, on mouse over in{' '}
                  the filter page window. You can change the order of the samples by using{' '}
                  a long press of the mouse on the “up/down arrow” button on the left, or{' '}
                  remove the sample from the pool by the “delete” button on the right{' '}
                  (After the sample is manually removed, it will be listed under{' '}
                  “Archived Sample” at the bottom). </div> : ''}
                  overlayStyle={{width: '250px', paddingBottom: '5rem'}}
                  style={this.state.counter == 8 ? {zIndex: 0} : ''}
                  >
                <List
                  className={`${styles.divlist}`}
                  width={this.metrics.tableWidth}
                  height={this.state.height - 155}
                  itemSize={28}
                  itemCount={this.state.data.length}
                  itemKey={index => this.state.data[index].sampleName}
                  >
                  {this.tableRow}
                </List>
                {this.renderModal()}
              </SpotlightWithToolTip>
            </div>
          </SpotlightWithToolTip>
          <SpotlightWithToolTip
            isActive = {this.state.counter > 0}
            inheritParentBackgroundColor={false}
            toolTipTitle={" *mouse click anywhere to advance"}
            overlayStyle={{zIndex: '1001'}}
            innerStyle={{color: 'white', fontWeight: '600', fontSize: '10px'}}
            style={{boxShadow: 'none'}}
          >
            <div className={gstyle.helpButtons}>
              {helpButtons}
            </div>
          </SpotlightWithToolTip>
        </div>
      </div>
    );
  }
}
