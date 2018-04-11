import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { scaleLinear } from 'd3-scale';

class Handle extends Component {

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseDown = (e) => {
    this.tx = e.pageX;
    this.x = this.tx;
    document.addEventListener('mousemove', this.handleMouseMove);
  };
  
  handleMouseUp = () => {
    document.removeEventListener('mousemove', this.handleMouseMove);
  };

  handleMouseMove = (e) => {
    this.tx = e.pageX;
    const xDiff = this.x - this.tx;
    this.props.update(this.props.x - xDiff);
  };

  render() {
    this.x = this.tx;
    return (
      <rect
        x={this.props.x}
        y={this.props.y}
        width={this.props.width}
        height={this.props.height}
        fill='black'
        stroke='none'
        fillOpacity={0.5}
        cursor='move'
        onMouseDown={this.handleMouseDown}
      />
    )
  }
}

export default class FilterChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      update: false,
    }

    this.updateMin = this.updateMin.bind(this);
    this.updateMax = this.updateMax.bind(this);
  }

  updateScales() {
    this.padding = this.props.width * 0.05;
    const counts = this.props.data.values.map(d => d.count);
    this.yscale = scaleLinear()
      .domain([Math.min(...counts), Math.max(...counts)])
      .range([this.padding, this.props.height - this.padding]);
    this.xscale = scaleLinear()
      .clamp(true)
      .domain([0, this.props.data.values.length])
      .range([this.padding, this.props.width - this.padding]);
  }

  updateMin(value) {
    // let nextMin = Math.round(this.xscale.invert(value + (this.padding / 2)) * -1);
    // if (nextMin < 0) {
    //   nextMin = 0;
    // } else if (nextMin > this.props.filter.range.max.index) {
    //   nextMin = this.props.filter.range.max.index;
    // }
    // this.props.filter.range.min.index = nextMin;
    // this.setState({update: !this.state.update});
    const mod = (this.xscale(this.props.filter.range.min.index) < value) ? (-this.padding / 2) : (this.padding / 2)
    let nextMin = Math.round(this.xscale.invert(value + mod));
    if (nextMin > this.props.filter.range.max.index) {
      nextMin = this.props.filter.range.max.index;
    }
    if (this.props.filter.range.min.index !== nextMin) {
      this.props.filter.range.min.index = nextMin;
      this.setState({update: !this.state.update});
    }
    // go up one level here - update filter state and props
  }

  updateMax(value) {
    const mod = (this.xscale(this.props.filter.range.max.index) < value) ? (-this.padding / 2) : (this.padding / 2)
    let nextMax = Math.round(this.xscale.invert(value + mod));
    if (nextMax < this.props.filter.range.min.index) {
      nextMax = this.props.filter.range.min.index;
    }
    if (this.props.filter.range.max.index !== nextMax) {
      this.props.filter.range.max.index = nextMax;
      this.setState({update: !this.state.update});
    }
    // go up one level here - update filter state and props
  }

  render() {
    this.updateScales();
    const barWidth = (this.xscale(1) - this.xscale(0));
    const bars = this.props.data.values.map((d, i) => {
      return (
        <rect
          key={`r-${i}`}
          x={this.xscale(i)}
          y={this.props.height - (this.yscale(d.count) + this.padding)}
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
    //
    const brush = this.props.filter.expanded ? (
        <g>
          <rect
            x={this.xscale(this.props.filter.range.min.index)}
            y={0}
            width={barWidth * ((this.props.filter.range.max.index - this.props.filter.range.min.index) + 1)}
            height={this.props.height - this.padding}
            fill='grey'
            stroke='none'
            fillOpacity={0.5}
          />
          <Handle
            x={this.xscale(this.props.filter.range.min.index)}
            y={(this.padding / 2)}
            width={this.padding}
            height={this.props.height - (this.padding * 2)}
            update={this.updateMin}
          />
          <Handle
            x={this.xscale(this.props.filter.range.max.index)}
            y={(this.padding / 2)}
            width={this.padding}
            height={this.props.height - (this.padding * 2)}
            update={this.updateMax}
          />
        </g>
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
          {brush}
        </svg>
      </div>
    );
  }
};
