import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export default class StackedBar extends Component {
  constructor(props) {
    super(props);
    this.scale = 1; // KISS
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  _mouseMove = (event) => {
    const containerOffset = this._canvas.getBoundingClientRect();
    const pageMouse = {x: event.clientX, y: event.clientY};
    const mouse = {
      x: pageMouse.x - containerOffset.left,
      y: pageMouse.y - containerOffset.top
    };

    let selectedDatum = null;
    this.props.data.forEach(d => {
      if (d.x <= mouse.x && d.x + d.width >= mouse.x) {
        selectedDatum = d
      }
    })
    if (selectedDatum) {
      this.props.onHoverDatum(selectedDatum, this.props.sample, pageMouse);
    }
  }

  _mouseOut = () => {
    this.props.onHoverDatum(null);
  }
  updateCanvas() {
    if (!this._canvas) {
      return
    }
    const ctx = this._canvas.getContext('2d')
    ctx.clearRect(0, 0, this.props.width, this.props.height);
    let offset = 0;
    this.props.data.forEach((d, i) => {
      ctx.fillStyle = this.props.rainbow(this.props.cscale(d.name));
      const alpha = this.props.highlightedDatum == null ? 1 :
        this.props.highlightedDatum.datum.name === d.name ? 1 : 0.5;
      ctx.globalAlpha = alpha

      d.x = offset * this.scale
      d.width = this.props.xscale(d.reads)

      ctx.fillRect(
        d.x,
        0 * this.scale,
        d.width * this.scale - 1,
        this.props.height * this.scale,
        );
      offset += d.width;
    });
  }

  render() {
    return (
      <canvas
        ref={(c) => (this._canvas = c)}
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
          verticalAlign: 'middle',
        }}
        onMouseOver={this._mouseMove}
        onMouseMove={this._mouseMove}
        onMouseOut={this._mouseOut}
      />
    );
  }
};
