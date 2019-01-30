import React, { Component } from 'react';

export default class StackedBar extends Component {
  constructor(props) {
    super(props);
    this.scale = 1;
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  _getDatum(event) {
    const containerOffset = this._canvas.getBoundingClientRect();
    const pageMouse = { x: event.clientX, y: event.clientY };
    const mouse = {
      x: pageMouse.x - containerOffset.left,
      y: pageMouse.y - containerOffset.top
    };
    let selectedDatum = null;
    this.props.data.forEach(d => {
      if (d.x <= mouse.x && d.x + d.width >= mouse.x) {
        selectedDatum = d;
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
      return;
    }

    const ctx = this._canvas.getContext('2d');
    let dataNeedsUpdate = !this.imageData;
    if (
      !dataNeedsUpdate
        &&
      (this.props.width !== this.imageData.width || this.props.height !== this.imageData.height)
    ) {
      dataNeedsUpdate = true;
    }
    if (dataNeedsUpdate) {
      this.imageData = ctx.createImageData(this.props.width, this.props.height);
    }

    if (this.props.isPercent) {
      this.props.xscale
        .domain([0, this.props.data.map(d => d.reads).reduce((a, v) => a + v, 0)])
        .range([0, this.props.width])
        .clamp();
    }
    let offset = 0;

    this.props.data
      .forEach(d => {
        const hex = this.props.cscale(d.name);
        const color = {
          r: parseInt(hex.slice(1, 3), 16),
          g: parseInt(hex.slice(3, 5), 16),
          b: parseInt(hex.slice(5, 7), 16),
        };
        let alpha = 1;
        if (this.props.highlightedDatum) {
          alpha = this.props.highlightedDatum.datum.name === d.name ? 1 : 0.25;
        }

        const width = this.props.xscale(d.reads);
        d.width = width;
        d.x = offset;

        for (let x = offset; x < offset + Math.max(1, d.width); x += 1) {
          for (let y = 0; y < this.props.height; y += 1) {
            const i = (x << 2) + (y * this.imageData.width << 2);
            this.imageData.data[i] = color.r;
            this.imageData.data[i + 1] = color.g;
            this.imageData.data[i + 2] = color.b;
            this.imageData.data[i + 3] = 255 * alpha;
          }
        }

        offset += width;
      });

    for (let x = offset; x < this.props.width; x += 1) {
      for (let y = 0; y < this.props.height; y += 1) {
        const i = (x << 2) + (y * this.imageData.width << 2);
        this.imageData.data[i] = 0;
        this.imageData.data[i + 1] = 0;
        this.imageData.data[i + 2] = 0;
        this.imageData.data[i + 3] = 0;
      }
    }

    ctx.putImageData(this.imageData, 0, 0);
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
            id={d.name}
            x={offset - d.width}
            y={0}
            width={d.width}
            height={this.props.height}
            fill={this.props.cscale(d.name)}
          />
        );
      });
      this._content = bars;
    } else {
      this._content = (
        <foreignObject>
          <canvas
            ref={c => { this._canvas = c; }}
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
            onFocus={this.props.onHoverDatum ? this._mouseMove : null}
            onMouseMove={this.props.onHoverDatum ? this._mouseMove : null}
            onMouseOut={this.props.onHoverDatum ? this._mouseOut : null}
            onBlur={this.props.onHoverDatum ? this._mouseOut : null}
            onClick={this.props.onClickDatum ? this._mouseClick : null}
          />
        </foreignObject>
      );
    }
    return this._content;
  }
}
