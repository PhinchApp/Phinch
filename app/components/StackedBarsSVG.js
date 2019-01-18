import React from 'react';

export default function StackedBarsSVG(props) {
  return (
    <svg
      ref={props.setRef}
      id={props.id}
      version="1.1"
      baseProfile="full"
      xmlns="http://www.w3.org/2000/svg"
      width={props.svgWidth}
      height={props.svgHeight + (props.seqHeight + (props.padding * 8))}
      fontFamily="IBM Plex Sans Condensed, Verdana, Sans-serif"
      fontWeight="200"
      fontSize="12px"
      overflow="visible"
    >
      <g id="Visual">
        <g id="Sequence Reads" transform={`translate(0, ${props.padding * 2})`}>
          {props.data.map((d, i) => props.row({ index: i, style: { top: props.itemSize * i } }))}
        </g>
        <g id="Info">
          {props.ticks}
          <g id="Metadata" transform={`translate(3, ${props.svgHeight})`}>
            <g id="Top Sequences">
              <text
                id="Title"
                textAnchor="middle"
                fill="#808080"
                transform={`translate(${props.svgWidth / 2}, ${props.padding * 1.5})`}
              >
                Top Sequences
              </text>
              <g
                id="Ranked Sequences"
                transform={`translate(0, ${props.padding * 2})`}
              >
                {props.topSequences}
              </g>
            </g>
            <g
              id="Citation"
              transform={`translate(0, ${props.seqHeight + (props.padding * 3)})`}
            >
              <text transform={`translate(0, ${props.padding * 1})`}>
                Please cite Phinch as:
              </text>
              <text transform={`translate(0, ${props.padding * 2})`}>
                Bik HM, Pitch Interactive (2014)
              </text>
              <text transform={`translate(0, ${props.padding * 3})`}>
                Phinch: An interactive, exploratory data visualization framework for -Omic datasets {/* eslint-disable-line max-len */}
              </text>
              <text transform={`translate(0, ${props.padding * 4})`}>
                bioRxiv 009944; https://doi.org/10.1101/009944
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
