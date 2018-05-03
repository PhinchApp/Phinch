import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { nest } from 'd3-collection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { interpolateRainbow } from 'd3-scale-chromatic';

import DataContainer from '../DataContainer';
import StackedBar from './StackedBar';
import StackedBarTooltip from './StackedBarTooltip';

import styles from './Vis.css';
import logo from 'images/phinch.png';

export default class Vis extends Component {
  constructor(props) {
    super(props);

    this.state = {
      initdata: DataContainer.getFilteredData(),
      data: [],
      width: window.innerWidth,
      height: window.innerHeight,
      redirect: null,
      level: 1,
      highlightedDatum: null,
    };

    this.levels = [];

    this.metrics = {
      padding: 16,
      lineHeight: 14,
      barHeight: 12,
      height: 600,
      idWidth: 32,
      nameWidth: 144,
    };
    this.metrics.chartWidth = this.state.width - ((this.metrics.padding * 4) + (this.metrics.idWidth + this.metrics.nameWidth));
    this.metrics.chartHeight = this.state.height - 195;

    this.time = {
      start: performance.now(),
      end: null,
    };

    this.scales = {
      x: scaleLinear(),
      c: scaleOrdinal(),
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

      this.state.data = this.formatTaxonomyData(this.state.initdata, this.state.level);
      // this.updateColorScale(this.state.data);
      this.setColorScale(this.state.data);
    }

    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentDidMount() {
    this.time.end = performance.now();
    console.log(`executed in ${(this.time.end - this.time.start).toLocaleString()}ms`);
    window.addEventListener('resize', this.updateDimensions);
  }

  componentDidUpdate() {
    this.time.end = performance.now();
    console.log(`executed in ${(this.time.end - this.time.start).toLocaleString()}ms`);
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
    this.metrics.chartWidth = window.innerWidth - ((this.metrics.padding * 4) + (this.metrics.idWidth + this.metrics.nameWidth));
    this.metrics.chartHeight = window.innerHeight - 195;
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
    // .sort();
    const sequenceRange = uniqSequences.map((s,i) => {
      return ((i + 1) / uniqSequences.length);
    });
    this.scales.c.domain(uniqSequences).range(sequenceRange);
  }

  setLevel(level) {
    this.time.start = performance.now();
    const data = this.updateTaxonomyData(this.state.data, level);
    // this.updateColorScale(data);
    this.setState({level, data});
  }

  // data.data schema: [row(observations), column(samples), count]

  // Move to data container?
  formatTaxonomyData(data, level) {
    let totalDataReads = 0;
    const formatedData = data.columns.map((c, i) => {

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

      const sequences = nest()
        .key(d => d.taxonomy.slice(0, level + 1))
        .entries(matches)
        .map(s => {
          return {
            name: s.key,
            taxonomy: s.values[0].taxonomy,
            reads: s.values.map(v => v.count).reduce((a, v) => a + v),
          };
        });

      totalDataReads += c.reads;
      return {
        phinchID: c.metadata.phinchID,
        order: c.order,
        sampleName: c.sampleName,
        phinchName: c.phinchName,
        reads: c.reads,
        sequences: sequences,
        matches: matches,
      };
    });
    this.totalDataReads = totalDataReads;
    return formatedData;
  }

  updateTaxonomyData(data, level) {
    return data.map(d => {
      d.sequences = nest()
        .key(d => d.taxonomy.slice(0, level + 1))
        .entries(d.matches)
        .map(s => {
          return {
            name: s.key,
            taxonomy: s.values[0].taxonomy,
            reads: s.values.map(v => v.count).reduce((a, v) => a + v),
          };
        });
      return d;
    });
  }

  renderBars(data) {
    return data.sort((a, b) => {
        return a.phinchID - b.phinchID;
      })
      .map((d, i) => {
        const sequence = d.sequences
          .sort((a, b) => {
            return b.reads - a.reads;
          });
        // this.scales.c.domain([sequence.length, 1]);
        return (
          <div key={d.sampleName} className={styles.row}>
            <div className={styles.rowLabel} style={{width: this.metrics.idWidth}}>
              {d.phinchID}
            </div>
            <div className={styles.rowLabel} style={{width: this.metrics.nameWidth}}>
              {d.phinchName}
            </div>
            <StackedBar
              onHoverDatum={this._hoverDatum}
              data={sequence}
              sample={d}
              width={this.scales.x(d.reads)}
              height={this.metrics.barHeight}
              xscale={this.scales.x}
              cscale={this.scales.c}
              rainbow={interpolateRainbow}
              highlightedDatum={this.state.highlightedDatum}
            />
          </div>
        );
      });
  }

  render() {
    const redirect = this.state.redirect === null ? '' : <Redirect push to={this.state.redirect} />;

    if (this.state.data.length) {
      this.metrics.height = (this.state.data.length * this.metrics.lineHeight);
    }

    const levels = this.levels.map(l => {
      const selected = (l.order <= this.state.level) ? styles.selected : '';
      return (
        <div
          key={l.name}
          className={`${styles.button} ${selected}`}
          onClick={() => this.setLevel(l.order)}
        >
          {l.name}
        </div>
      );
    });

    this.scales.x
      .domain([1, Math.max(...this.state.data.map(d => d.reads))])
      .range([1, this.metrics.chartWidth])
      .clamp();

    const bars = this.renderBars(this.state.data);

    const ticks = [0].concat(...this.scales.x.ticks(9)).map(t => {
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
            {t.toLocaleString()}
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

    const tooltip = this.state.highlightedDatum == null ? null :
      <StackedBarTooltip {...this.state.highlightedDatum} totalDataReads={this.totalDataReads} />

    return (
      <div className={styles.container}>
        {redirect}
        <div className={styles.logo}>
          <Link to="/">
            <img src={logo} alt='Phinch' />
          </Link>
        </div>
        <Link to="/Filter">
          Back to Filter
        </Link>
        <div>
          Levels
          {levels}
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
            width: (this.state.width - (this.metrics.padding * 2)),
            height: (this.metrics.chartHeight + (this.metrics.lineHeight * 2)),
          }}>
            <g transform={`
              translate(
                ${this.metrics.idWidth + this.metrics.nameWidth},
                ${this.metrics.lineHeight}
              )
            `}>
              {ticks}
            </g>
          </svg>
        </div>
        <div style={{
          height: this.metrics.chartHeight,
          overflowY: 'scroll',
        }}>
          {bars}
          {tooltip}
        </div>
      </div>
    );
  }
}
