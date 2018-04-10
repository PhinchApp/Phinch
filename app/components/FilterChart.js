import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { scaleLinear } from 'd3-scale';

export default class FilterChart extends Component {
  constructor(props) {
    super(props);
  }

  updateScales() {
    this.padding = this.props.width * 0.05;
    const counts = this.props.data.values.map(d => d.count);
    this.yscale = scaleLinear()
      .domain([Math.min(...counts), Math.max(...counts)])
      .range([this.padding, this.props.height - this.padding]);
    this.xscale = scaleLinear()
      .domain([0, this.props.data.values.length])
      .range([this.padding, this.props.width - this.padding]);
  }

  render() {
    this.updateScales();
    const bars = this.props.data.values.map((d, i) => {
      return (
        <rect
          key={`r-${i}`}
          x={this.xscale(i)}
          y={this.props.height - this.yscale(d.count)}
          width={this.xscale(i + 1) - this.xscale(i)}
          height={this.yscale(d.count)}
          fill='grey'
          stroke='white'
        />
      );
    });
    let range = '';
    if (this.props.filter.expanded) {
      const isDate = (this.props.name.includes('date') || this.props.name.includes('year'));
      const min = isDate ? new Date(this.props.filter.range.min.value).toLocaleString().split(', ')[0] : this.props.filter.range.min.value;
      const max = isDate ? new Date(this.props.filter.range.max.value).toLocaleString().split(', ')[0] : this.props.filter.range.max.value;
      range = min ? (<span>range: [{min} — {max}]</span>) : '';
    }
    const info = this.props.filter.expanded ? (
        <div>
          <span>{this.props.data.unit}</span>
          {range}
        </div>
      ) : (<div></div>);
    console.log(this.props.filter.range);
    const brush = this.props.filter.expanded ? (
        <g>
          <rect
            x={this.xscale(this.props.filter.range.min.index)}
            y={this.padding}
            // width={this.xscale(1) + this.xscale(this.props.filter.range.max.index - this.props.filter.range.min.index)}
            width={this.xscale(this.props.data.values.length)}
            height={this.props.height}
            fill='grey'
            stroke='none'
            fillOpacity={0.5}
          />
        </g>
      ) : '';
    return (
      <div>
        <label>{this.props.name}</label>
        {info}
        <svg width={this.props.width} height={this.props.height}>
          {bars}
          {brush}
        </svg>
      </div>
    );
  }
};
