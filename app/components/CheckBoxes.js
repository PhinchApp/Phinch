import React, { Component } from 'react';

export default class FilterChart extends Component {
  render() {
    const boxes = this.props.data.values.map((d) => {
      return (
        <div key={d.value}>
          <input
            type='checkbox'
            name={d.value}
            value={d.value}
            checked={this.props.filter.range[d.value]}
            onChange={(event) => this.props.update(this.props.name, d.value, event.target.checked)}
          />
          <label htmlFor={d.value}>{d.value} ({d.count})</label>
        </div>
      );
    });
    return (
      <div>
        <label>{this.props.name}</label>
        {this.props.filter.expanded ? boxes : ''}
      </div>
    );
  }
};
