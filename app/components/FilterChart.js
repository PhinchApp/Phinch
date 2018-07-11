import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Slider, { Range } from 'rc-slider';
import { scaleLinear, scaleLog } from 'd3-scale';

import styles from './FilterChart.css';

export default class FilterChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      update: false,
    };
    this.state.log = this.props.log;

    this.toggleLog = this.toggleLog.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
  }

  toggleLog() {
    const log = !this.state.log;
    this.setState({log});
  }

  updateScales() {
    this.padding = 0;
    const counts = this.props.data.values.map(d => d.count);
    if (this.state.log) {
      this.yscale = scaleLog()
        .domain([1, Math.max(...counts)])
        .range([1, this.props.height - this.padding]);
    } else {
      this.yscale = scaleLinear()
        .domain([0, Math.max(...counts)])
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
    const barWidth = (this.xscale(1) - this.xscale(0));
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
      return (
        <rect
          key={`r-${i}`}
          x={this.xscale(i)}
          y={this.props.height - (this.yscale(d.count))}
          width={barWidth}
          height={this.yscale(d.count)}
          fill={this.props.fill}
          fillOpacity={fillOpacity}
          stroke={this.props.stroke}
        />
      );
    });
    let range = '';
    const marks = {};
    if (filter.expanded) {
      const min = isDate ? new Date(filter.range.min.value).toLocaleString().split(', ')[0] : filter.range.min.value;
      const max = isDate ? new Date(filter.range.max.value).toLocaleString().split(', ')[0] : filter.range.max.value;
      range = min !== undefined ? (<div>range: [{min} — {max}]</div>) : '';
      marks[this.xscale(filter.range.min.index)] = { label: <div className={styles.mark}>{min}</div> };
      marks[this.xscale(filter.range.max.index + 1)] = { label: <div className={styles.mark}>{max}</div> };
    }
    const remove = (this.props.remove !== undefined) ? (
        <div
          className={styles.remove}
          onClick={() => { this.props.remove(this.props.name) }}
        >x</div>
      ) : '';
    const info = filter.expanded ? (
        <div>
          {remove}
          <span>{this.props.data.unit}</span>
          {range}
        </div>
      ) : (<div></div>);
    const style = { width: (this.props.width - (this.padding * 2)), margin: '0 16px' };
    const brush = filter.expanded ? (
        <div style={style}>
          <Range
            min={this.xscale(0)}
            max={this.xscale(this.props.data.values.length)}
            marks={marks}
            step={barWidth}
            allowCross={false}
            trackStyle={[{background: this.props.fill}]}
            handleStyle={[{background: this.props.handle}, {background: this.props.handle}]}
            value={[this.xscale(filter.range.min.index), this.xscale(filter.range.max.index + 1)]}
            onChange={(values) => this.updateFilter(this.props.name, values)}
          />
        </div>
      ) : '';
    const scaleToggle = this.props.showScale ? (
        <div>
          <input
            id="scale"
            type="checkbox"
            checked={this.state.log}
            onChange={this.toggleLog}
          />
          <label htmlFor="scale">Log Scale</label>
        </div>
      ) : '';
    return (
      <div className={styles.filterChart}>
        <label>{this.props.name}</label>
        {info}
        <svg
          width={this.props.width}
          height={this.props.height}
          className={styles.svg}
          onMouseOut={() => {document.addEventListener('mousemove', null)}}
        >
          {bars}
        </svg>
        {brush}
        {scaleToggle}
      </div>
    );
  }
};
