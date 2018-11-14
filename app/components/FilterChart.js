
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Toggle from 'react-toggle'
import Slider, { Range } from 'rc-slider';
import { scaleLinear, scaleLog } from 'd3-scale';

import styles from './FilterChart.css';
import gstyle from './general.css';

import close from 'images/close.svg';

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
    const barWidth = (this.xscale(1) - this.xscale(0));
    const strokeWidth = barWidth > 2 ? 0.5 : 0;
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
          key={`r-${i}`}
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
      const min = isDate ? (
          new Date(filter.range.min.value).toLocaleString().split(', ')[0]
        ) : (
          this.props.data.log ? (
            filter.range.min.value
          ) : (
            `${Math.floor(filter.range.min.percent * 10000)/100} %`
          )
        );
      const max = isDate ? (
          new Date(filter.range.max.value).toLocaleString().split(', ')[0]
        ) : (
          this.props.data.log ? (
            filter.range.max.value
          ) : (
            `${Math.floor(filter.range.max.percent * 10000)/100} %`
          )
        );
      range = (min !== undefined) ? (
          <div className={styles.range} style={{ color: this.props.color }}>
            min: {min.toLocaleString()} — max: {max.toLocaleString()}
          </div>
        ) : '';
      marks[this.xscale(filter.range.min.index)] = { 
        label: <div className={styles.mark} style={{ color: this.props.color }}>{min.toLocaleString()}</div> 
      };
      marks[this.xscale(filter.range.max.index + 1)] = { 
        label: <div className={styles.mark} style={{ color: this.props.color }}>{max.toLocaleString()}</div> 
      };
    }
    const remove = (this.props.remove !== undefined) ? (
        <div
          className={gstyle.close}
          onClick={() => { this.props.remove(this.props.name) }}
        ><img src={close} alt='close' /></div>
      ) : '';
    const info = filter.expanded ? (
        <div>
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
            trackStyle={[{background: this.props.handle}]}
            railStyle={{background: '#262626'}}
            handleStyle={[{background: this.props.handle}, {background: this.props.handle}]}
            value={[this.xscale(filter.range.min.index), this.xscale(filter.range.max.index + 1)]}
            onChange={(values) => this.updateFilter(this.props.name, values)}
          />
        </div>
      ) : '';
    const scaleToggle = this.props.showScale ? (
        <div>
          <div className={styles.toggleLabel}>
            Percentage
          </div>
          <Toggle
            id="scale"
            icons={false}
            defaultChecked={this.props.data.log}
            onChange={() => this.props.toggleLog(this.props.name)}
          />
          <div className={styles.toggleLabel}>
            Log Scale
          </div>
        </div>
      ) : '';
    const taxa = this.props.name.split(',');
    const name = taxa[taxa.length - 1].replace(/[a-zA-Z]__/g,'');
    const circle = this.props.showCircle ? (
          <div className={gstyle.circle} style={{background: this.props.fill}} />
        ) : '';
    return (
      <div className={styles.filterChart}>
        {circle}
        <label className={styles.name} style={{ color: this.props.color }}>{name}</label>
        {remove}
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
