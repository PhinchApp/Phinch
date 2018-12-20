import React, { Component } from 'react';
import { FixedSizeList as List } from 'react-window';

import _cloneDeep from 'lodash.clonedeep';

import StackedBarRow from './StackedBarRow';

import styles from './StackedBarContainer.css';

export default class StackedBarContainer extends Component {
  constructor(props) {
    super(props);
    // this.metrics = this._updateMetrics(this.props);
    // this.scales = this._updateScales(this.props);
  }

  // componentWillUpdate(nextProps) {
  //   this.metrics = this._updateMetrics(nextProps);
  //   this.scales = this._updateScales(nextProps);
  // }

  // _updateMetrics(props) {
  //   const metrics = _cloneDeep(props.metrics);
  //   if (props.isAttribute) {
  //     metrics.barContainerHeight = metrics.attrBarContainerHeight;
  //     metrics.barHeight = metrics.attrBarHeight;
  //   }
  //   return metrics;
  // }

  // _updateScales(props) {
  //   const scales = _cloneDeep(props.scales);
  //   if (props.isAttribute) {
  //     scales.x
  //       .domain([0, Math.max(...this.props.attribute.values.map(d => d.reads))])
  //       .range([0, this.metrics.chartWidth])
  //       .clamp();
  //   }
  //   return scales;
  // }

  stackRow = ({ index, style }) => this.props.stack(this.props.data[index], index, style.top);

  attrRow = ({ index, style }) => this.props.attr(this.props.attribute.values[index], index, style.top);

  render() {
    const dataLength = this.props.isAttribute ? (
      this.props.attribute.values
        .filter(v => {
          if (this.props.showEmptyAttrs) return true;
          return v.reads > 0;
        }).length
    ) : this.props.data.length;

    const svgWidth = this.metrics.chartWidth + this.metrics.nonbarWidth;
    const svgHeight = (this.metrics.lineHeight * 4) + (
      (this.metrics.barContainerHeight + (
        this.metrics.miniBarContainerHeight * this.props.miniBarCount
      )) * dataLength);
    // const seqHeight = this.props.renderSVG ? this.metrics.sequenceRowHeight * sequences.length : 0;
    const seqHeight = 0;
    const padding = this.props.renderSVG ? this.metrics.lineHeight * 9 : 0;

    if (this.props.renderSVG) {
      return (
        <svg 
          ref={this.props.setRef}
          id={this.props.id}
          version="1.1"
          baseProfile="full"
          xmlns="http://www.w3.org/2000/svg"
          width={svgWidth}
          height={svgHeight + seqHeight + padding}
          fontFamily="IBM Plex Sans Condensed"
          fontWeight="200"
          fontSize="12px"
          overflow="visible"
        >
          <g id="Visual">
            <g id="Sequence Reads" transform={`translate(0, ${this.metrics.padding * 2})`}>
              {
                this.props.isAttribute ? (
                  this.props.attribute.values.map((v, i) => {
                    const yOffset = this.props.metrics.padding + ((this.props.metrics.barContainerHeight
                      + (this.props.metrics.miniBarContainerHeight * this.props.miniBarCount)) * i);
                    return this.attr(d, i, yOffset);
                  })
                ) : (
                  this.props.data.map((d, i) => {
                    const yOffset = this.props.metrics.padding + ((this.props.metrics.barContainerHeight
                      + (this.props.metrics.miniBarContainerHeight * this.props.miniBarCount)) * i);
                    return this.stack(d, i, yOffset);
                  })
                )
              }
            </g>
            <g id="Info">
              {this.props.ticks}
              <g id="Metadata" transform={`translate(3, ${svgHeight})`}>
                <g id="Top Sequences">
                  <text
                    id="Title"
                    textAnchor="middle"
                    fill="#808080"
                    transform={`translate(${svgWidth / 2}, ${this.metrics.lineHeight * 1.5})`}
                  >
                    Top Sequences
                  </text>
                  <g
                    id="Ranked Sequences"
                    transform={`translate(0, ${this.metrics.lineHeight * 2})`}
                  >
                    {
                      //this.props.topSequences
                    }
                  </g>
                </g>
                <g
                  id="Citation"
                  transform={`translate(0, ${seqHeight + (this.metrics.lineHeight * 3)})`}
                >
                  <text transform={`translate(0, ${this.metrics.lineHeight * 1})`}>
                    Please cite Phinch as:
                  </text>
                  <text transform={`translate(0, ${this.metrics.lineHeight * 2})`}>
                    Bik HM, Pitch Interactive (2014)
                  </text>
                  <text transform={`translate(0, ${this.metrics.lineHeight * 3})`}>
                    Phinch: An interactive, exploratory data visualization framework for -Omic datasets {/* eslint-disable-line max-len */}
                  </text>
                  <text transform={`translate(0, ${this.metrics.lineHeight * 4})`}>
                    bioRxiv 009944; https://doi.org/10.1101/009944
                  </text>
                </g>
              </g>
            </g>
          </g>
        </svg>
      );
    }
    return (
      <List
        className={`${styles.svglist}`}
        innerTagName='svg'
        width={this.metrics.chartWidth + this.metrics.nonbarWidth}
        height={this.metrics.chartHeight - (this.metrics.padding * 4)}
        itemSize={this.metrics.barContainerHeight + (
          this.metrics.miniBarContainerHeight * this.props.miniBarCount
        )}
        itemCount={dataLength}
        itemKey={index => {
          const item = this.props.data[index];
          return item.sampleName;
        }}
      >
        {this.props.isAttribute ? this.attrRow : this.stackRow}
      </List>
    );
  }
}
