import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export default class StackedBar extends Component {
  constructor(props) {
    super(props);
    this.scale = 2;
  }

  componentDidMount() {
    this.updateCanvas(ReactDOM.findDOMNode(this).getContext('2d'));
  }

  componentDidUpdate() {
    this.updateCanvas(ReactDOM.findDOMNode(this).getContext('2d'));
  }

  updateCanvas(ctx) {  
    let offset = 0;
    this.props.data.forEach((d, i) => {
      ctx.fillStyle = this.props.rainbow(this.props.cscale(d.name));
      ctx.fillRect(
        offset * this.scale,
        0 * this.scale,
        this.props.xscale(d.reads) * this.scale,
        this.props.height * this.scale,
        );
      ctx.fillStyle = 'white';
      ctx.fillRect(
        offset * this.scale,
        0 * this.scale,
        0.25 * this.scale,
        this.props.height * this.scale,
        );
      offset += this.props.xscale(d.reads);
    });
  }

  render() {
    return (
      <canvas
        width={this.props.width * this.scale}
        height={this.props.height * this.scale}
        style={{
          width: `${this.props.width}px`,
          height: `${this.props.height}px`,
          margin: 0,
          padding: 0,
          outline: 'none',
          border: 'none',
          overflow: 'hidden',
          verticalAlign: 'top',
        }}
      />
    );
  }
};
