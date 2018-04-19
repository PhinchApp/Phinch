import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { scaleLog } from 'd3-scale';

export default class FrequencyChart extends Component {
  constructor(props) {
    super(props);
    // this.padding = this.props.width * 0.05;
    this.padding = 2;
    this.scale = scaleLog()
      .domain([Math.min(...this.props.data.map(d => d.reads)), Math.max(...this.props.data.map(d => d.reads))])
      .range([this.padding, this.props.width - (this.padding * 2)]);
  }

  componentDidMount() {
    this.updateCanvas(ReactDOM.findDOMNode(this).getContext('2d'));
  }

  updateCanvas(ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(this.padding, (this.props.height / 2) - 0.125 + this.padding, this.props.width - (this.padding * 2), 0.25);
    this.props.data.forEach((d) => {
      ctx.fillRect(this.scale(d.reads), this.props.height / 4 + this.padding, 0.25, this.props.height / 2);
    });
    ctx.fillStyle = 'red';
    ctx.fillRect(this.scale(this.props.value), (this.padding * 2), 1, this.props.height + (this.padding * 2));
  }

  render() {    
    return (
      <canvas
        width={this.props.width}
        height={this.props.height}
        style={{
          width: `${this.props.width / 2}px`,
          height: `${this.props.height / 2}px`,
          margin: 0,
          padding: 0,
          outline: 'none',
          border: 'none',
          overflow: 'hidden',
          verticalAlign: 'middle',
        }}
      />
    );
  }
};
