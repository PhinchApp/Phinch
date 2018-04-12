import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Slider, { Range } from 'rc-slider';
import { scaleLinear } from 'd3-scale';

export default class FilterChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      update: false,
    }

    this.updateFilter = this.updateFilter.bind(this);
  }

  updateScales() {
    this.padding = this.props.width * 0.05;
    const counts = this.props.data.values.map(d => d.count);
    this.yscale = scaleLinear()
      // .domain([Math.min(...counts), Math.max(...counts)])
      .domain([0, Math.max(...counts)])
      .range([0, this.props.height - this.padding]);
    this.xscale = scaleLinear()
      .clamp(true)
      .domain([0, this.props.data.values.length])
      .range([this.padding, this.props.width - this.padding]);
  }

  updateFilter(name, values) {
    this.props.update(name, this.xscale.invert(values[0]), (this.xscale.invert(values[1]) - 1));
  }

  render() {
    this.updateScales();
    const barWidth = (this.xscale(1) - this.xscale(0));
    const bars = this.props.data.values.map((d, i) => {
      return (
        <rect
          key={`r-${i}`}
          x={this.xscale(i)}
          y={this.props.height - (this.yscale(d.count))}
          width={barWidth}
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
      range = min !== undefined ? (<span>range: [{min} — {max}]</span>) : '';
    }
    const info = this.props.filter.expanded ? (
        <div>
          <span>{this.props.data.unit}</span>
          {range}
        </div>
      ) : (<div></div>);
    const style = { width: (this.props.width - (this.padding * 2)), margin: this.padding };
    const brush = this.props.filter.expanded ? (
        <div style={style}>
          <Range
            min={this.xscale(0)}
            max={this.xscale(this.props.data.values.length)}
            step={barWidth}
            allowCross={false}
            defaultValue={[this.xscale(this.props.filter.range.min.index), this.xscale(this.props.filter.range.max.index + 1)]}
            onChange={(values) => this.updateFilter(this.props.name, values)}
          />
        </div>
      ) : '';
    return (
      <div>
        <label>{this.props.name}</label>
        {info}
        <svg
          width={this.props.width}
          height={this.props.height}
          onMouseOut={() => {document.addEventListener('mousemove', null)}}
        >
          {bars}
        </svg>
        {brush}
      </div>
    );
  }
};
