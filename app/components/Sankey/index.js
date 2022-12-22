import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.css';
import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import { scaleOrdinal } from 'd3';

import { debounce } from 'lodash';
import datacontainer from '../../datacontainer';
import SankeyTooltip from './SankeyTooltip';
import SpotlightWithToolTip from '../SpotlightWithToolTip';
const nodeWidth = 15 // width of node rects
const nodePadding = 0 // vertical separation between adjacent nodes

const getNodeFullName = (node) => {

  const nameParts = [node.name]
  let currentNode = node
  while (true) {
    if (currentNode.targetLinks && currentNode.targetLinks.length) {
      currentNode = currentNode.targetLinks[0].source
      nameParts.push(currentNode.name)
    } else {
      break
    }
  }
  nameParts.reverse()
  const fullName = nameParts.join(',')
  return fullName
}
function TextWithBackground(props) {
  const { children, renderSVG, ...restOfProps } = props;
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const dimensions = ref.current.getBBox();
      setWidth(dimensions.width);
      setHeight(dimensions.height);
    }
  }, [children])
  const lrPadding = 5;
  const tbPadding = 2;
  return (
    <g>
      {width && height && !renderSVG ?
        <rect
          filter={`url(#dropshadow)`}
          x={props.x - lrPadding}
          rx={5}
          y={props.y - height * 0.7 - tbPadding}
          width={width + (lrPadding * 2)}
          height={height + (tbPadding * 2)}
          fill="white"
          opacity='0.5'
        />
      : null}
      <text {...restOfProps} ref={ref}>{children}</text>
    </g>
  );
}

export default function Sankey(props) {

  let { data, width, height, colors, setRef, renderSVG, helpCounter, clickDatum, colorScale, highlightedDatum } = props
  const levels = datacontainer.getLevels()

  const listRef = useRef()
  const containerRef = useRef()

  const marginLeft = 5
  const marginRight = Math.max(300, width * 0.2)
  const marginTop = 30
  const marginBottom = 28
  const connectingPathWidth = 50
  const connecingPathPadding = 5
  const sankeyData = useMemo(() => {
    const nodes = []
    const links = []
    let maxNamePartsLength = 0
    data.forEach((sample) => {
      sample.sequences.forEach(sequence => {
        const { name, reads } = sequence
        const nameParts = name.split(',')
        maxNamePartsLength = Math.max(maxNamePartsLength, nameParts.length)
        for (let i = 0; i < nameParts.length - 1; i++) {
          const source = nameParts[i]
          const target = nameParts[i + 1]
          const link = links.find(l => l.source === source && l.target === target)
          if (nodes.find(n => n.name === source) === undefined) {
            nodes.push({ name: source })
          }
          if (nodes.find(n => n.name === target) === undefined) {
            nodes.push({ name: target })
          }

          if (link) {
            link.value += reads
          } else {
            links.push({ source, target, value: reads })
          }
        }
      })
    })
    if (!nodes.length && !links.length) {

      return { nodes, links, maxNamePartsLength }
    }
    const sankeyLayout = sankey()
      .nodeId(d => d.name)
      .nodeAlign(sankeyJustify)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      // .width(width)
      // .height(height)
      .extent([[0, 0], [width - marginRight - marginLeft, height - marginBottom - marginTop]])

    let graph = null
    try {
      graph = sankeyLayout({
        links,
        nodes,
      })

    } catch (e) {
      console.error(e)
    }
    graph.nodes.forEach(node => {
      node.fullName = getNodeFullName(node)
    })
    return graph
  }, [data, width, height])

  const depthOneSum = useMemo(() => {
    const depthOneNodes = sankeyData.nodes.filter(n => n.depth === 1)
    return depthOneNodes.reduce((sum, node) => sum + node.value, 0)
  }, [sankeyData])


  const maxDepth = Math.max(...sankeyData.nodes.map(n => n.depth))
  const maxLayerName = isFinite(maxDepth) && levels[maxDepth] ? levels[maxDepth].name  : ''
  const listHeight = height - marginTop - marginBottom
  const listItemHeight = 20
  const listItemsVisible = Math.floor(listHeight / listItemHeight)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [hoveredListItem, setHoveredListItem] = useState(null)

  const hoverListItem = (node, hoverType = 'list') => (e) => {
    if (!node) {
      setHoveredListItem(null)
      return
    }

    const { name, value } = node
    // const listX = listRef.current.getBoundingClientRect().x
    const containerPosition = containerRef.current.getBoundingClientRect()
    let y = e.target.getBoundingClientRect().top
    let x = 0

    if (hoverType === 'sankey') {
      x = e.target.getBoundingClientRect().left -
        listRef.current.getBoundingClientRect().left +
        e.target.getBoundingClientRect().width + 5
      y = e.clientY
    }
    const position = {
      x,
      y: y - containerPosition.top,
    }
    const color = colorScale(node.fullName)
    if (isNaN(position.y)) {
      debugger
    }
    setHoveredListItem({position, name, counts: value, totalCounts: depthOneSum, color, hoverType})
  }
  const onListScroll = debounce(() => {
    setHoveredListItem(null)
    const listScroll = listRef.current.scrollTop
    const listScrollAlignedToListItemHeight = Math.floor(listScroll / listItemHeight) * listItemHeight
    const newOffset = listScrollAlignedToListItemHeight / listItemHeight
    setScrollOffset(newOffset)
  }, 200)

  const listItems = sankeyData.nodes.filter(node => {
    return node.depth === maxDepth
  }).sort((a, b) => a.y0 - b.y0)
  listItems.forEach((listItem, i) => {
    listItem.listItemVisible = i >= scrollOffset && i < scrollOffset + listItemsVisible
  })
  // console.log(listItems)
  const checkNodeVisibility = (_node) => {
    let visibility = false
    const recurseNode = (node) => {
      if (node.listItemVisible) {
        visibility = true
        return
      }
      if (node.sourceLinks) { // source links are to the right of this node
        node.sourceLinks.forEach(link => {
          // target goes to the next item in the chain
          recurseNode(link.target)
        })
      }
    }
    recurseNode(_node)
    return visibility
  }
  const checkLinkVisibility = (_link) => {
    let visibility = _link.target.hasFinalNodeVisible

    return visibility
  }
  const checkNodeHoverVisibility = (_node) => {
    let visibility = false
    const recurseNode = (node) => {
      if (highlightedDatum && node.fullName === highlightedDatum.datum.name) {
        visibility = true
        return
      } else if (hoveredListItem && node.name === hoveredListItem.name) {
        visibility = true
        return
      }
      if (node.sourceLinks) { // source links are to the right of this node
        node.sourceLinks.forEach(link => {
          // target goes to the next item in the chain
          recurseNode(link.target)
        })
      }
    }
    recurseNode(_node)
    return visibility
  }

  sankeyData.nodes.forEach(node => {
    node.hasFinalNodeVisible = checkNodeVisibility(node)
    node.hasHoveredNodeVisible = checkNodeHoverVisibility(node)
  })
  sankeyData.links.forEach(link => {
    link.hasFinalNodeVisible = checkLinkVisibility(link)
    link.hasHoveredNodeVisible = link.target.hasHoveredNodeVisible
  })
  const pathGradients = colors === 'mix' && sankeyData && sankeyData.links.map((link, i) => {
    const { source, target } = link
    const gradientId = `gradient-${i}`
    const sourceColor = colorScale(source.fullName)
    const targetColor = colorScale(target.fullName)
    const gradient = (
      <linearGradient key={gradientId} id={gradientId} x1={source.x1} x2={target.x0}
        gradientUnits='userSpaceOnUse'>
      >
        <stop offset='0%' stopColor={sourceColor} />
        <stop offset='100%' stopColor={targetColor} />
      </linearGradient>
    )
    return gradient
  })

  const nodes = (
    <g>
      {sankeyData && sankeyData.nodes.map(node => {
        let opacity = node.listItemVisible || node.hasFinalNodeVisible ? 1 : 0.2
        if ((hoveredListItem || highlightedDatum) && !node.hasHoveredNodeVisible) {
          opacity = 0.1
        }
        return (
          <rect
            key={node.name}
            x={node.x0}
            y={node.y0}
            opacity={opacity}
            width={node.x1 - node.x0}
            height={Math.max(0.5, node.y1 - node.y0)}
            style={{
              fill: colorScale(node.fullName),
              stroke: 'none'
            }}

            onMouseMove={hoverListItem(node, 'sankey')}
            onMouseOut={hoverListItem(null, 'sankey')}
            data-name={node.name}
          />
      )})}
    </g>
  )
  const paths = (
    <g>
      {sankeyData && sankeyData.links.map((link, linkIndex) => {
        let strokeOpacity = link.hasFinalNodeVisible ? 0.5 : 0
        if (hoveredListItem || highlightedDatum) {

          if (!link.hasHoveredNodeVisible) {
            strokeOpacity = strokeOpacity * 0.2
          }
        }
        let stroke = null
        if (colors === 'mix') {
          stroke = `url(#gradient-${linkIndex})`
        } else if (colors === 'left') {
          stroke = colorScale(link.source.fullName)
        } else if (colors === 'right') {
          stroke = colorScale(link.target.fullName)
        }
        return (

          <path
            key={`${link.source.name}-${link.target.name}`}
            d={sankeyLinkHorizontal()(link)}
            style={{
              fill: 'none',
              stroke,
              strokeOpacity: strokeOpacity,
              strokeWidth: Math.max(1,link.width)
            }}
          />
        )
      })}
    </g>
  )
  const nodeLabels = (
    <g>
      {sankeyData && sankeyData.nodes.map(node => {
        const tryToShowLabel = node.depth !== maxDepth && node.hasFinalNodeVisible
        const nodeHeight = node.y1 - node.y0
        if (!hoveredListItem && (!tryToShowLabel || nodeHeight < 10)) {
          return null
        } else if (hoveredListItem || highlightedDatum) {
          if (node.depth === maxDepth) {
            return null
          }
          if (!node.hasHoveredNodeVisible) {
            return null
          }

        }
        return (
          <TextWithBackground
            key={node.name}
            x={node.x1 + 10}
            style={{ fontSize: '0.8em'}}
            y={node.y0 + (node.y1 - node.y0) / 2}
            renderSVG={renderSVG}
          >
            {node.name}
          </TextWithBackground>
        )
      })}
    </g>
  )

  const maxNumberLength = `${listItems.length}`.length
  const listNumberWidth = `${maxNumberLength}ch`
  const clickListItem = (node) => () => {
    clickDatum({
      name: node.fullName,
    })
  }
  useEffect(() => {
    if (highlightedDatum && highlightedDatum.datum) {
      const node = document.querySelector(`[data-fullname="${highlightedDatum.datum.name}"]`)
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      }
    }
  }, [highlightedDatum])

  const list = listItems.map((node, i) => {
    if (node.depth !== maxDepth) {
      return null
    }
    let opacity = 1
    if ((hoveredListItem && hoveredListItem.name !== node.name) || (highlightedDatum && highlightedDatum.datum.name !== node.fullName)) {
      opacity = 0.2
    }
    // console.log(node)
    const color = colorScale(node.fullName)
    return (
      <div
        style={{ opacity }}
        key={node.name}
        onMouseMove={hoverListItem(node)}
        onMouseOut={hoverListItem(null)}
        onClick={clickListItem(node)}
        data-fullname={node.fullName}
      >
        <span><span style={{ width: listNumberWidth}} className={styles.listNumber}>{i + 1}</span> <div className={styles.dot} style={{backgroundColor: color}} /> {node.name}</span>
        <span>{node.value.toLocaleString()}</span>
      </div>
    )
  })

  const listConnectingLines = listItems.filter(d => d.listItemVisible)
    .map((node, nodeIndex) => {
      if ((hoveredListItem && hoveredListItem.name !== node.name) || (highlightedDatum && highlightedDatum.datum.name !== node.fullName)) {
        return null
      }
      const x1 = node.x1 + connecingPathPadding
      const y1 = node.y0 + (node.y1 - node.y0) / 2

      const x2 = width - marginRight + connectingPathWidth
      const y2 = nodeIndex * listItemHeight + listItemHeight / 2 + (listItemHeight * 2)

      // construct a bezier between the two points
      const path = `M ${x1} ${y1} C ${x1 + connectingPathWidth * 0.5} ${y1} ${x2 - connectingPathWidth * 0.5} ${y2} ${x2} ${y2}`

      return (
        <path d={path} key={node.name} style={{ stroke: '#001226', fill: 'none', strokeOpacity: '0.5' }} />
      )
    })
  const listWidth = marginRight - connecingPathPadding * 2 - connectingPathWidth
  const svgList = renderSVG ? (
    <g transform={`translate(${width - listWidth}, ${listItemHeight * 0.5})`} fontSize={'0.8em'}
      >

      <g className={styles.listTitle} style={{ textTransform: 'uppercase'}}>
        <text style={{ fontWeight: 'bold' }} x={listWidth / 2} textAnchor='middle'>{maxLayerName} Layer</text>
      </g>
      <g className={styles.listHeader} transform={`translate(0, ${listItemHeight})`}>
        <text x={listNumberWidth}>
          Sequences
        </text>
        <text x={listWidth - 20} textAnchor='end'>Counts</text>
      </g>
      <line x1={0} x2={listWidth} y1={listItemHeight * 1.2} y2={listItemHeight * 1.2} style={{ stroke: '#001226', strokeWidth: 1 }} />
      {listItems.filter(d => d.listItemVisible)
        .map((node, nodeIndex) => {
          const rectFill = `rgba(178, 178, 178, ${nodeIndex % 2 === 0 ? '0.2' : '0.5'})`
          return (
            <g
              key={node.name}
              transform={`translate(0, ${(nodeIndex + 1.5) * (listItemHeight)})`}
              fontSize='0.9em'
            >
              <rect
                x={0}
                y={0}
                width={marginRight}
                height={listItemHeight}
                fill={rectFill}
              />
              <circle
                cx={listItemHeight / 2}
                cy={listItemHeight / 2}
                r={listItemHeight / 4}
                fill={colorScale(node.fullName)}
              />
              <text
                x={listItemHeight}
                y={listItemHeight / 2}
                dy='0.35em'
              >
                {nodeIndex + scrollOffset}
              </text>
              <text
                x={listItemHeight + 20}
                dx={listNumberWidth}
                y={listItemHeight / 2}
                dy={'.35em'}
              >
                {node.name}
              </text>
              <text
                x={listWidth - 20}
                y={listItemHeight / 2}
                dy={'.35em'}
                textAnchor='end'
              >
                {node.value.toLocaleString()}
              </text>

            </g>
          )
        })
      }
    </g>
    ) : null

  const levelLabels = levels ? levels.map((level, i) => {
    if (i > maxDepth) {
      return null
    }
    const matchingNode = sankeyData.nodes.find(node => node.depth === i)
    let x = 0
    if (matchingNode) {
      x = i === 0 ? matchingNode.x0 : (matchingNode.x1 + matchingNode.x0) / 2
    }
    const nameCapitalized = level.name.charAt(0).toUpperCase() + level.name.slice(1)
    const textAnchor = i === 0 ? 'start' : i === levels.length - 1 ? 'end' : 'middle'
    return (
      <text
        key={level.name}
        x={x}
        y={-5}
        style={{ fontSize: '0.8em', textAnchor, fontWeight: 'bold'}}
      >
        {nameCapitalized}
      </text>

    )
  }) : null

  const tooltip = hoveredListItem ? (
    <SankeyTooltip
      {...hoveredListItem}
      maxWidth={listWidth}
    />
  ) : null
  const helpOpen = helpCounter !== 0
  const containerStyle = {
    height: helpOpen ? height - 90 : height,
    borderRadius: helpOpen ? '0.5em' : null,
    pointerEvents: helpOpen ? 'none' : null,

  }
  return (
    <div className={styles.sankey} style={containerStyle} ref={containerRef}>
      <SpotlightWithToolTip
        isActive={helpCounter === 2 || helpCounter === 4 || helpCounter === 5}
        inheritParentBackgroundColor={false}
        toolTipPlacement="topLeft"
        overlayStyle={{
          // backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 20000,
          overflow: 'visible',

        }}
        toolTipTitle={helpCounter === 2 ? <div style={{
          // position: 'relative',
          // zIndex: 200002,
          width: '820px',
          transform: 'translateY(-3em)',
          }}>
          The Sankey diagram displays the “flow” of data across hierarchal levels (taxonomy, gene ontologies, etc.).<br />
          From left to right, data is shown flowing from highest to lowest levels.
        </div>
        : helpCounter === 4 ?
          <div>
            Hovering over a name on the right scroll bar will bring up information about that selected group, including sample name and occurrence in the overall dataset.
          </div>
        : helpCounter === 5 ?
          <div
            style={{
              width: '1130px',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.9em',
              display: 'flex',
            }}
          >
            <div style={{
              width: '60%', paddingRight: '4em',
            }}>
              The subway chart at the top of the visual window can be used to display more or fewer Sankey levels.
              Typing in the autocomplete search box can also be used to find specific taxa/genes in your dataset
              Note: the scroll bar will only display information from the right-most Sankey level; use the subway chart to access data from different levels.
            </div>
            <div style={{ width: '40%'}}>
              Choosing “Left” or “Right” from the drop down menu will change the coloring of the Sankey chart according to the data displayed on the left or right of the space between each level, respectively.
            </div>
          </div>
        : null
      }
        style={{ backgroundColor: 'rgba(255, 255, 255, 1)', boxShadow: 'inset rgba(255, 255, 255, 0.5) 0px 0px 10px'}}
      >
          <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            ref={setRef} width={width} height={height}
            fontFamily='"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
          >
            <defs>
              <filter id="dropshadow" height="130%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                <feOffset dx="0" dy="1" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <g>
                {pathGradients}
              </g>
            </defs>
            <g transform={`translate(${marginLeft}, ${marginTop})`}>
              {paths}
              {nodes}
              <g>{listConnectingLines}</g>
              {nodeLabels}
              {levelLabels}
              {svgList}
            </g>
          </svg>
          <SpotlightWithToolTip
            isActive={helpCounter === 3}
            inheritParentBackgroundColor={true}
            toolTipPlacement="left"
            overlayStyle={{
              zIndex: 20000,
              overflow: 'visible',
            }}
            style={{ boxShadow: 'none'}}

            toolTipTitle={<div style={{

              }}>
                The data within in a selected Sankey level is shown on the right.
                Users can scroll up and down to move up and down the sankey bar charts.
                As you scroll, the corresponding data points (and their respective counts) will be highlighted in the main Sankey graph.
                <br /><br />
                Clicking on a data point in the Sankey window will cause a sidebar to appear on the right, where users can use slider bars to filter out proportions of taxa if needed (similar functionality as in the taxonomy bar chart visualization).

          </div>}
          >
            <div className={styles.list} style={{
              width: listWidth,
              marginTop,
              opacity: renderSVG ? 0 : 1,
              padding: helpCounter === 3 ? '1em 0 0 1em' : null,
            }}>
              <div className={styles.listTitle}>
                <strong>{maxLayerName} Layer</strong> shown by scrolling:
              </div>
              <div className={styles.listHeader}>
                <span>
                  <span style={{ width: listNumberWidth}} className={styles.listNumber} />
                  Sequences
                </span>
                <span>Counts</span>
              </div>

              <div
                className={styles.listScroll}
                style={{ height: `calc(${listHeight}px - 2em)` }}
                ref={listRef}
                onScroll={onListScroll}
              >
                {list}
              </div>
            </div>
          </SpotlightWithToolTip>
          <div className={styles.error}>
            {sankeyData.maxNamePartsLength === 1 ? 'Sankey requires at least a Phylum level selection' : null}
          </div>
          {tooltip}
        </div>
      </SpotlightWithToolTip>
    </div>
  )
}
