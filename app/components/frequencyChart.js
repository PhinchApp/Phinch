import React, { Component } from 'react';
import { scaleLog } from 'd3-scale';

export default class FrequencyChart extends Component {
  constructor(props) {
    super(props);
    this.padding = 2;
    this.scale = scaleLog()
      .domain([
        Math.max(1, Math.min(...this.props.data.map(d => d.reads))),
        Math.max(...this.props.data.map(d => d.reads))
      ])
      .range([this.padding, this.props.width - (this.padding * 2)]);
  }

  componentDidMount() {
    this.updateCanvas(this.canvas.getContext('2d'));
  }

  componentDidUpdate() {
    this.updateCanvas(this.canvas.getContext('2d'));
  }

  updateCanvas(ctx) {
    ctx.clearRect(0, 0, this.props.width, this.props.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(
      this.padding,
      (this.props.height / 2) + (this.padding - 0.125),
      this.props.width - (this.padding * 2),
      0.25
    );
    this.props.data.forEach((d) => {
      ctx.fillRect(
        this.scale(d.reads),
        (this.props.height / 3) + this.padding,
        0.5,
        this.props.height / 3,
      );
    });
    ctx.fillStyle = 'red';
    ctx.fillRect(
      this.scale(this.props.value || 1),
      (this.padding * 2),
      2,
      this.props.height + (this.padding * 2),
    );
  }

  render() {
    return (
      <canvas
        ref={c => { this.canvas = c; }}
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
}
