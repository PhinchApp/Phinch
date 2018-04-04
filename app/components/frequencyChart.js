import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { scaleLog } from 'd3-scale';

export default class FrequencyChart extends Component {
  constructor(props) {
    super(props);
    this.padding = this.props.width * 0.05;
    this.scale = scaleLog()
      .domain([Math.min(...this.props.data.map(d => d.reads)), Math.max(...this.props.data.map(d => d.reads))])
      .range([this.padding, this.props.width - this.padding]);    
  }

  componentDidMount() {
    this.updateCanvas(ReactDOM.findDOMNode(this).getContext('2d'));
  }

  updateCanvas(ctx) {
    ctx.fillStyle = 'black';
    this.props.data.forEach((d) => {
      ctx.fillRect(this.scale(d.reads), this.props.height / 3, 0.25, this.props.height / 3);
    });
    ctx.fillRect(this.scale(this.props.value), this.props.height / 6, 1, this.props.height / 3 * 2);
  }

  render() {    
    return (
      <canvas
        width={this.props.width}
        height={this.props.height}
        style={{ background: 'white', width: this.props.width / 2, height: this.props.height / 2, margin: 0, padding: 0, overflow: 'hidden' }}
      />
    );
  }
};
