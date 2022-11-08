import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './styles.css';
import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import { scaleOrdinal } from 'd3';
// import palette from '../../palette';

import { debounce } from 'lodash';
import datacontainer from '../../datacontainer';
import SankeyTooltip from './SankeyTooltip';
const palette = ['#449acd', '#fee889', '#d7473e', '#7f759e', '#d77440', '#3e61c2', '#f15e76', '#5a598f', '#f69f4b', '#b07c83', '#ab80b6', '#47b8b7', '#ee7051', '#5f3a87', '#8ddba0', '#953884', '#349a74', '#8c3c9c', '#583c9e', '#547f86'];
const nodeWidth = 15 // width of node rects
const nodePadding = 0 // vertical separation between adjacent nodes

function TextWithBackground(props) {
  const { children, ...restOfProps } = props;
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
      {width && height ?
        <rect
          filter={`url(#dropshadow)`}
          x={props.x - lrPadding}
          rx={10}
          y={props.y - height * 0.7 - tbPadding}
          width={width + (lrPadding * 2)}
          height={height + (tbPadding * 2)}
          fill="white"
          opacity='0.2'
        />
      : null}
      <text {...restOfProps} ref={ref}>{children}</text>
    </g>
  );
}

export default function Sankey(props) {

  let { data, width, height } = props
  const levels = datacontainer.getLevels()
  // width -= 27
  // height *= 4
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
    return graph
  }, [data, width, height])

  const depthOneSum = useMemo(() => {
    const depthOneNodes = sankeyData.nodes.filter(n => n.depth === 1)
    return depthOneNodes.reduce((sum, node) => sum + node.value, 0)
  }, [sankeyData])


  const colorScale = scaleOrdinal(palette)
  const maxDepth = Math.max(...sankeyData.nodes.map(n => n.depth))
  const maxLayerName = isFinite(maxDepth) && levels[maxDepth] ? levels[maxDepth].name  : ''
  const listHeight = height - marginTop - marginBottom
  const listItemHeight = 20
  const listItemsVisible = Math.floor(listHeight / listItemHeight)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [hoveredListItem, setHoveredListItem] = useState(null)

  const hoverListItem = (node) => (e) => {
    if (!node) {
      setHoveredListItem(null)
      return
    }
    const { name, value } = node
    const containerPosition = containerRef.current.getBoundingClientRect()
    const position = {
      x: e.clientX - containerPosition.left,
      y: e.clientY - containerPosition.top,
    }
    const color = colorScale(name)
    setHoveredListItem({position, name, counts: value, totalCounts: depthOneSum, color})
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
      if (hoveredListItem && node.name === hoveredListItem.name) {
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
  const pathGradients = sankeyData && sankeyData.links.map((link, i) => {
    const { source, target } = link
    const gradientId = `gradient-${i}`
    const sourceColor = colorScale(source.name)
    const targetColor = colorScale(target.name)
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

  const paths = (
    <g>
      {sankeyData && sankeyData.links.map((link, linkIndex) => {
        let strokeOpacity = link.hasFinalNodeVisible ? 0.5 : 0
        if (hoveredListItem) {

          if (!link.hasHoveredNodeVisible) {
            strokeOpacity = strokeOpacity * 0.2
          }
        }
        return (

          <path
            key={`${link.source.name}-${link.target.name}`}
            d={sankeyLinkHorizontal()(link)}
            style={{
              fill: 'none',
              // stroke: colorScale(link.target.name),
              stroke: `url(#gradient-${linkIndex})`,
              strokeOpacity: strokeOpacity,
              strokeWidth: Math.max(1,link.width)
            }}
          />
        )
      })}
    </g>
  )
  const nodes = (
    <g>
      {sankeyData && sankeyData.nodes.map(node => {
        let opacity = node.listItemVisible || node.hasFinalNodeVisible ? 1 : 0.2
        if (hoveredListItem && !node.hasHoveredNodeVisible) {
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
              fill: colorScale(node.name),
              stroke: 'none'
            }}
            data-name={node.name}
          />
      )})}
    </g>
  )
  const nodeLabels = (
    <g>
      {sankeyData && sankeyData.nodes.map(node => {
        const tryToShowLabel = node.depth !== maxDepth && node.hasFinalNodeVisible
        const nodeHeight = node.y1 - node.y0
        if (!hoveredListItem && (!tryToShowLabel || nodeHeight < 10)) {
          return null
        } else if (hoveredListItem) {
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
          >
            {node.name}
          </TextWithBackground>
        )
      })}
    </g>
  )

  const maxNumberLength = `${listItems.length}`.length
  const listNumberWidth = `${maxNumberLength}ch`

  const list = listItems.map((node, i) => {
    if (node.depth !== maxDepth) {
      return null
    }
    let opacity = 1
    if (hoveredListItem && hoveredListItem.name !== node.name) {
      opacity = 0.2
    }
    const color = colorScale(node.name)
    return (
      <div
        style={{ opacity }}
        key={node.name}
        onMouseMove={hoverListItem(node)}
        onMouseOut={hoverListItem(null)}
      >
        <span><span style={{ width: listNumberWidth}} className={styles.listNumber}>{i + 1}</span> <div className={styles.dot} style={{backgroundColor: color}} /> {node.name}</span>
        <span>{node.value.toLocaleString()}</span>
      </div>
    )
  })

  const listConnectingLines = listItems.filter(d => d.listItemVisible)
    .map((node, nodeIndex) => {
      if (hoveredListItem && hoveredListItem.name !== node.name) {
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

    />
  ) : null
  return (
    <div className={styles.sankey} style={{ height }} ref={containerRef}>
      <svg width={width} height={height}>
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
        </g>
      </svg>
      <div className={styles.list} style={{
        width: marginRight - connecingPathPadding * 2 - connectingPathWidth,
        marginTop
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
      <div className={styles.error}>
        {sankeyData.maxNamePartsLength === 1 ? 'Sankey requires at least a Phylum level selection' : null}
      </div>
      {tooltip}
    </div>
  )
}
