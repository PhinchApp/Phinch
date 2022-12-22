import React, { Component } from 'react';

import Toggle from 'react-toggle';
import { Range } from 'rc-slider';
import { scaleLinear, scaleLog } from 'd3-scale';

import close from 'images/orangeX.svg';

import styles from './FilterChart.css';
import gstyle from './general.css';
import classNames from 'classnames'

export default class FilterChart extends Component {
  constructor(props) {
    super(props);

    this.updateFilter = this.updateFilter.bind(this);
  }

  updateScales() {
    this.padding = 0;
    if (this.props.data.log) {
      const counts = this.props.data.values.map(d => d.count);
      this.yscale = scaleLog()
        .domain([1, Math.max(...counts)])
        .range([1, this.props.height - this.padding]);
    } else {
      const percentages = this.props.data.values.map(d => d.percent);
      this.yscale = scaleLinear()
        .domain([0, Math.max(...percentages)])
        .range([0, this.props.height - this.padding]);
    }
    this.xscale = scaleLinear()
      .clamp(true)
      .domain([0, this.props.data.values.length])
      .range([this.padding, this.props.width - this.padding]);
  }

  updateFilter(name, values) {
    this.props.update(
      this.props.filters,
      name,
      Math.round(this.xscale.invert(values[0])),
      Math.round(this.xscale.invert(values[1]) - 1),
      this.props.callback,
    );
  }

  render() {
    this.updateScales();
    const isDate = (this.props.name.toLowerCase().includes('date'));
    let isYear = false;
    const maybeYear = this.props.name.toLowerCase().includes('year') && !isDate;
    if (maybeYear) {
      const valueLengths = [
        ...new Set([...this.props.data.values.map(d => d.value.toString().length)])
      ];
      if (valueLengths.length === 1 && valueLengths[0] === 4) {
        isYear = true;
      }
    }

    const barWidth = Math.max(0.1, (this.xscale(1) - this.xscale(0)));
    const strokeWidth = barWidth > 2 ? 2 : 0;
    const filter = this.props.filters[this.props.name];

    const bars = this.props.data.values.map((d, i) => {
      const valueInRange = (isDate) ? (
        !(
          new Date(d.value).valueOf() < new Date(filter.range.min.value).valueOf()
          ||
          new Date(d.value).valueOf() > new Date(filter.range.max.value).valueOf()
        )
      ) : (
        !(
          d.value < filter.range.min.value
          ||
          d.value > filter.range.max.value
        )
      );
      const fillOpacity = valueInRange ? 1 : 0.3;
      const height = this.props.data.log ? (
        this.yscale(d.count)
      ) : (
        this.yscale(d.percent)
      );
      return (
        <rect
          key={`r-${d.index}`}
          x={this.xscale(i)}
          y={this.props.height - height}
          width={barWidth}
          height={height}
          fill={this.props.fill}
          fillOpacity={fillOpacity}
          stroke={this.props.stroke}
          strokeWidth={strokeWidth}
        />
      );
    });
    let range = '';
    const marks = {};
    if (filter.expanded) {
      let min = this.props.data.log ? (
        filter.range.min.value
      ) : (
        `${Math.floor(filter.range.min.percent * 10000) / 100} %`
      );
      let max = this.props.data.log ? (
        filter.range.max.value
      ) : (
        `${Math.floor(filter.range.max.percent * 10000) / 100} %`
      );
      if (isDate) {
        [min] = new Date(filter.range.min.value).toLocaleString().split(', ');
        [max] = new Date(filter.range.max.value).toLocaleString().split(', ');
      }
      if (!isYear) {
        min = min.toLocaleString();
        max = max.toLocaleString();
      }

      range = (min !== undefined) ? (
        <div className={styles.range} style={{ color: this.props.color }}>
          min: {min} — max: {max}
        </div>
      ) : '';
      marks[this.xscale(filter.range.min.index)] = {
        label: (
          <div className={styles.mark} style={{ color: this.props.color }}>
            {min}
          </div>
        )
      };
      marks[this.xscale(filter.range.max.index + 1)] = {
        label: (
          <div className={styles.mark} style={{ color: this.props.color }}>
            {max}
          </div>
        )
      };
    }
    const remove = (this.props.remove !== undefined) ? (
      <div
        role="button"
        tabIndex={0}
        className={classNames(gstyle.close, styles.close)}
        onClick={() => { this.props.remove(this.props.name); }}
        onKeyPress={e => (e.key === ' ' ? this.props.remove(this.props.name) : null)}
      >
        <img src={close} alt="close" />
      </div>
    ) : '';
    const info = filter.expanded ? (
      <div>
        <span>{this.props.data.unit}</span>
        {range}
      </div>
    ) : <div />;
    const style = {
        width: (this.props.width - (this.padding * 2)),
        margin: this.props.noMargin ? '0 8px' : '0 24px',
    };
    const brush = filter.expanded ? (
      <div style={style}>
        <Range
          className={this.props.simpleHandles ? 'simpleHandles' : ''}
          min={this.xscale(0)}
          max={this.xscale(this.props.data.values.length)}
          marks={marks}
          step={barWidth}
          allowCross={false}
          trackStyle={[{ background: this.props.handle }]}
          railStyle={{ background: '#262626' }}
          handleStyle={[{ background: this.props.handle }, { background: this.props.handle }]}
          value={[this.xscale(filter.range.min.index), this.xscale(filter.range.max.index + 1)]}
          onChange={values => this.updateFilter(this.props.name, values)}
        />
      </div>
    ) : '';
    const scaleToggle = this.props.showScale ? (
      <div style={{ marginTop: '2em'}}>
        <div className={styles.toggleLabel}>
          Percentage
        </div>
        <Toggle
          id="scale"
          icons={false}
          defaultChecked={this.props.data.log}
          onChange={() => this.props.toggleLog(this.props.name)}
          style={{backgroundColor: "red !important", height: "12px !important", }}
        />
        <div className={styles.toggleLabel}>
          Log Scale
        </div>
      </div>
    ) : '';
    const taxa = this.props.name.split(',');
    const name = taxa[taxa.length - 1].replace(/[a-zA-Z]__/g, '');
    const circle = this.props.showCircle ? (
      <div className={gstyle.circle} style={{ verticalAlign: 'middle', background: this.props.fill,
      transform: 'scale(1.1)',
      marginRight: '0.5em',
      border: 'none',
    }} />
    ) : '';
    return (
      <div className={styles.filterChart} style={{ paddingBottom: this.props.noMargin ? '0.5rem' : null}}>
        {circle}
        {remove}
        <div
          className={styles.name}
          style={{
            color: this.props.color,
            display: this.props.showCircle ? 'inline-block' : 'block',
            maxWidth: this.props.width,
          }}
        >
          {name}
        </div>
        {info}
        <svg
          width={this.props.width}
          height={this.props.height}
          className={styles.svg}
          onMouseOut={() => { document.addEventListener('mousemove', null); }}
          onBlur={() => {}}
          style={{
            margin: this.props.noMargin ? '0 8px' : null
          }}
        >
          {bars}
        </svg>
        {brush}
        {scaleToggle}
      </div>
    );
  }
}
