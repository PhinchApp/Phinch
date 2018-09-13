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

  _getDatum(event) {
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
    });
    return [selectedDatum, pageMouse];
  }

  _mouseMove = (event) => {
    const [selectedDatum, pageMouse] = this._getDatum(event);
    this.props.onHoverDatum(selectedDatum, this.props.sample, pageMouse);
  }

  _mouseOut = () => {
    this.props.onHoverDatum(null);
  }

  _mouseClick = (event) => {
    const [selectedDatum] = this._getDatum(event);
    if (selectedDatum) {
      this.props.onClickDatum(selectedDatum);
    }
  }

  updateCanvas() {
    if (!this._canvas) {
      return
    }
    const ctx = this._canvas.getContext('2d')
    ctx.clearRect(0, 0, this.props.width, this.props.height);
    if (this.props.isPercent) {
      this.props.xscale
        .domain([0, this.props.data.map(d => d.reads).reduce((a, v) => a + v, 0)])
        .range([0, this.props.width])
        .clamp();
    }
    let offset = 0;
    this.props.data
      .forEach((d, i) => {
        ctx.fillStyle = this.props.cscale(d.name);
        const alpha = this.props.highlightedDatum == null ? 1 :
          this.props.highlightedDatum.datum.name === d.name ? 1 : 0.25;
        ctx.globalAlpha = alpha;
        d.x = offset * this.scale;
        d.width = this.props.xscale(d.reads);
        ctx.fillRect(
          d.x,
          0 * this.scale,
          d.width * this.scale,
          this.props.height * this.scale,
          );
        offset += this.props.xscale(d.reads);
      });
  }

  render() {
    if (this.props.renderSVG) {
      if (this.props.isPercent) {
        this.props.xscale
          .domain([0, this.props.data.map(d => d.reads).reduce((a, v) => a + v, 0)])
          .range([0, this.props.width])
          .clamp();
      }
      let offset = 0;
      const bars = this.props.data.map(d => {
          d.width = this.props.xscale(d.reads);
          offset += d.width;
          return (
            <rect
              key={d.name}
              x={offset - d.width}
              y={0}
              width={d.width}
              height={this.props.height}
              fill={this.props.cscale(d.name)}
            />
          );
        });
      return bars;
    } else {
      return (
        <foreignObject>
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
              verticalAlign: 'top',
              cursor: 'pointer',
              position: 'fixed',
              zIndex: 1,
            }}
            onMouseOver={this.props.onHoverDatum ? this._mouseMove : null}
            onMouseMove={this.props.onHoverDatum ? this._mouseMove : null}
            onMouseOut={this.props.onHoverDatum ? this._mouseOut : null}
            onClick={this.props.onClickDatum ? this._mouseClick : null}
          />
        </foreignObject>
      );
    }
  }
};
