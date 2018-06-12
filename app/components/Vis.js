import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Table from 'rc-table';
import _sortBy from 'lodash.sortby';
import { nest } from 'd3-collection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';

import { removeRows, restoreRows, sortBy, getSortArrow } from '../FilterFunctions';
import DataContainer from '../DataContainer';

import StackedBar from './StackedBar';
import StackedBarTooltip from './StackedBarTooltip';
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
      deleted: [],
      width: window.innerWidth,
      height: window.innerHeight,
      redirect: null,
      level: 1,
      highlightedDatum: null,
      mode: 'value',
      showSequences: false,
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
      barHeight: 12,
      height: 600,
      hideWidth: 20,
      idWidth: 32,
      nameWidth: 144,
    };
    this.metrics.chartWidth = this.state.width - ((this.metrics.padding * 4.5) + (this.metrics.idWidth + this.metrics.hideWidth + this.metrics.nameWidth));
    this.metrics.chartHeight = this.state.height - 251;

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

      this.state.data = sortBy(
        this,
        this.sort.key,
        this.formatTaxonomyData(this.state.initdata, this.state.level),
        false,
        false,
        );
      this.setColorScale(this.state.data);
    }

    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  _hoverDatum = (datum, sample, position) => {
    if (datum == null) {
      this.setState({ highlightedDatum: null })
    } else {
      this.setState({ highlightedDatum: { datum, sample, position }})
    }
  }

  updateDimensions() {
    this.metrics.chartWidth = window.innerWidth - ((this.metrics.padding * 4.5) + (this.metrics.idWidth + this.metrics.hideWidth + this.metrics.nameWidth));
    this.metrics.chartHeight = window.innerHeight - 251;
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
    const data = this.updateTaxonomyData(this.state.data, level, true);
    const deleted = this.updateTaxonomyData(this.state.deleted, level, false);
    this.setState({level, data, deleted});
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
        title: (<div className={`${styles.heading} ${styles.restore}`}>Restore</div>),
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
        title: (<div className={`${styles.heading} ${styles.biomid}`}>BIOM ID</div>),
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
        title: (<div className={`${styles.heading} ${styles.phinchName}`}>Phinch Name</div>),
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

  renderBars(data) {
    return data
      .map((d, i) => {
        const sequence = _sortBy(d.sequences, (s) => -s.reads);
        return (
          <div key={d.sampleName} className={styles.row}>
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
              data={sequence}
              sample={d}
              width={this.metrics.chartWidth}
              height={this.metrics.barHeight}
              xscale={this.scales.x}
              cscale={this.scales.c}
              isPercent={(this.state.mode === 'percent')}
              highlightedDatum={this.state.highlightedDatum}
            />
          </div>
        );
      });
  }
  
  renderSort() {
    const buttons = [
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
    return buttons.map(b => {
      const onClick = () => { sortBy(this, b.id, this.state.data, true, false) };
      const arrow = getSortArrow(this, b.id);
      return (
        <div
          key={b.id}
          className={`${styles.heading} ${styles.button} ${styles.controlMargin}`}
          onClick={onClick}
        >
          {b.name} {arrow}
        </div>
      );
    });
  }

  renderToggle() {
    const buttons = [
      {
        id: 'value',
        name: 'Value',
      },
      {
        id: 'percent',
        name: '%',
      },
    ];
    return buttons.map(b => {
      const classes = (this.state.mode === b.id) ? (
          `${styles.heading} ${styles.button}`
        ) : `${styles.heading} ${styles.button} ${styles.deselected}`;
      const onClick = () => {
        this.setState({mode: b.id});
      }
      return (
        <div
          key={b.id}
          className={classes}
          onClick={onClick}
        >
          {b.name}
        </div>
      );
    });
  }

  renderTopSequences(seqObj) {
    ///
    const label = this.state.showSequences ? 'Hide' : 'Show';
    const button = (
        <div
          className={`${styles.heading}`}
          style={{
            cursor: 'pointer',
          }}
          onClick={() => {
            const showSequences = !this.state.showSequences;
            this.setState({showSequences});
          }}
        >
          {label} Top Sequences
        </div>
      );
    const columns = [
      {
        title: (<div className={`${styles.heading} ${styles.rank}`}>Rank</div>),
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
        title: (<div className={`${styles.heading} ${styles.name}`}>Name</div>),
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
        title: (<div className={`${styles.heading} ${styles.reads}`}>Reads</div>),
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
          className={`${styles.button} ${selected}`}
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
    const sortButtons = this.renderSort();
    const viewToggle = this.renderToggle();
    const topSequences = this.renderTopSequences(this.readsBySequence);
    const ticks = this.renderTicks();

    const tooltip = this.state.highlightedDatum == null ? null :
      <StackedBarTooltip {...this.state.highlightedDatum} totalDataReads={this.totalDataReads} />

    this.deletedColumns = this.generateDeletedColumns();

    return (
      <div className={gstyle.container}>
        {redirect}
        <div className={gstyle.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <Summary summary={this.state.summary} datalength={this.state.data.length} />
        <Link to="/Filter">
          <div className={`${styles.button} ${styles.heading} ${styles.controlMargin}`}>
            <div className={gstyle.arrow} style={{transform: `rotate(${-90}deg)`}}>⌃</div>
            Back to Filter
          </div>
        </Link>
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
            Sort
          </div>
          {sortButtons}
        </div>
        <div style={{display: 'inline-block'}}>
          <div style={{
            display: 'inline-block',
            margin: '0 0.5rem',
          }}>
            View
          </div>
          <div style={{display: 'inline-block'}} className={styles.controlMargin}>
            {viewToggle}
          </div>
        </div>
        <div style={{display: 'inline-block'}}>
          <div style={{
            display: 'inline-block',
            margin: '0 0.5rem',
          }}>
            Sequences
          </div>
          <div style={{display: 'inline-block'}} className={styles.controlMargin}>
            {topSequences}
          </div>
        </div>
        <div style={{
          position: 'relative',
          textAlign: 'center',
          height: this.metrics.lineHeight * 2,
          fontSize: this.metrics.barHeight,
        }}>
          Sequence Reads
          <svg style={{
            position: 'absolute',
            left: 0,
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
        <div style={{
          height: this.metrics.chartHeight,
          paddingLeft: this.metrics.padding * 0.5,
          overflowY: 'scroll',
        }}>
          {bars}
          {tooltip}
        </div>
        <RemovedRows
          deleted={this.state.deleted}
          deletedColumns={this.deletedColumns}
        />
      </div>
    );
  }
}
