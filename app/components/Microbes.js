import React, { Component } from 'react';

export default class Microbes extends Component {
  constructor(props) {
    super(props);

    this.updateCanvas = this.updateCanvas.bind(this);
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    this.stroke = Object.assign({}, this.props.stroke);
    this.update();
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(prevProps) !== JSON.stringify(this.props)) {
      this.update();
    }
  }

  update() {
    this.time = {
      start: Date.now(),
      current: Date.now(),
    };
    this.microbes = this.updateMicrobes();
    this.scheduleUpdate();
  }

  updateMicrobes() {
    let microbes = this.microbes ? this.microbes : [];
    if (this.props.count < microbes.length) {
      microbes = microbes.slice(0, this.props.count);
    }
    const length = {
      min: -12,
      max: 24,
    };
    const width = {
      min: 2,
      max: 4,
    };
    // Existing
    microbes = microbes.map(m => {
      m.start = Object.assign({}, m.end);
      m.end = {
        x: Math.floor(Math.random() * this.props.width),
        y: Math.floor(Math.random() * this.props.height),
      };
      return m;
    });
    // New
    let index = 0;
    while (microbes.length < this.props.count) {
      microbes.push({
        index,
        start: {
          x: Math.floor(Math.random() * this.props.width),
          y: Math.floor(Math.random() * this.props.height),
        },
        end: {
          x: Math.floor(Math.random() * this.props.width),
          y: Math.floor(Math.random() * this.props.height),
        },
        size: {
          x: length.min + Math.floor(Math.random() * length.max),
          y: length.min + Math.floor(Math.random() * length.max),
        },
        w: width.min + Math.floor(Math.random() * width.max),
      });
      index += 1;
    }
    return microbes;
  }

  scheduleUpdate() {
    window.requestAnimationFrame(this.updateCanvas);
  }

  updateCanvas() {
    this.ctx.fillStyle = this.props.fill;
    this.ctx.fillRect(0, 0, this.props.width, this.props.height);

    if (this.props.show) {
      const progress = Math.min(1, (this.time.current - this.time.start) / 1500);

      const stroke = {
        r: this.stroke.r + Math.floor((this.props.stroke.r - this.stroke.r) * progress),
        g: this.stroke.g + Math.floor((this.props.stroke.g - this.stroke.g) * progress),
        b: this.stroke.b + Math.floor((this.props.stroke.b - this.stroke.b) * progress),
        a: this.stroke.a + ((this.props.stroke.a - this.stroke.a) * progress),
      };
      this.stroke = Object.assign({}, stroke);
      this.ctx.strokeStyle = `rgba(${stroke.r}, ${stroke.g}, ${stroke.b}, ${stroke.a})`;

      this.ctx.lineCap = 'round';
      this.microbes.forEach(m => {
        this.ctx.beginPath();
        this.ctx.lineWidth = m.w;
        const current = {
          x: m.start.x + ((m.end.x - m.start.x) * progress),
          y: m.start.y + ((m.end.y - m.start.y) * progress),
        };
        this.ctx.moveTo(
          current.x,
          current.y,
        );
        this.ctx.lineTo(
          current.x + m.size.x,
          current.y + m.size.y,
        );
        this.ctx.stroke();
      });

      if (progress < 1) {
        // this.time.current = Date.now();
        // this.scheduleUpdate();
      }
    }
  }

  render() {
    return (
      <canvas
        ref={c => { this.canvas = c; }}
        width={this.props.width}
        height={this.props.height}
        style={{
          position: 'absolute',
          width: `${this.props.width}px`,
          height: `${this.props.height}px`,
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
