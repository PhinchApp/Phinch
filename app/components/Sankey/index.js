import React, { useMemo, useRef, useState } from 'react'
import styles from './styles.css';
import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import { scaleOrdinal } from 'd3';
import palette from '../../palette';
import { debounce } from 'lodash';
import datacontainer from '../../datacontainer';
const nodeWidth = 15 // width of node rects
const nodePadding = 0 // vertical separation between adjacent nodes

export default function Sankey(props) {
  console.log(props)

  let { data, width, height } = props
  console.log(data)
  const levels = datacontainer.getLevels()
  console.log(levels)
  // width -= 27
  // height *= 4
  const listRef = useRef()

  const marginLeft = 5
  const marginRight = Math.max(300, width * 0.2)
  const marginTop = 10
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
    console.log(nodes)
    console.log(links)
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
  console.log(sankeyData)

  const colorScale = scaleOrdinal(palette)
  console.log(palette)
  const maxDepth = Math.max(...sankeyData.nodes.map(n => n.depth))
  const maxLayerName = isFinite(maxDepth) && levels[maxDepth] ? levels[maxDepth].name  : ''
  const listHeight = height - marginTop - marginBottom
  const listItemHeight = 20
  const listItemsVisible = Math.floor(listHeight / listItemHeight)
  console.log(listItemsVisible)
  const [scrollOffset, setScrollOffset] = useState(0)


  const onListScroll = debounce(() => {
    console.log('list scroll')
    const listScroll = listRef.current.scrollTop
    console.log(listScroll)
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
  sankeyData.nodes.forEach(node => {
    node.hasFinalNodeVisible = checkNodeVisibility(node)
  })
  sankeyData.links.forEach(link => {
    link.hasFinalNodeVisible = checkLinkVisibility(link)
  })
  console.log(sankeyData.nodes)

  const paths = (
    <g>
      {sankeyData && sankeyData.links.map(link => (
        <path
          key={`${link.source.name}-${link.target.name}`}
          d={sankeyLinkHorizontal()(link)}
          style={{
            fill: 'none',
            stroke: colorScale(link.target.name),
            strokeOpacity: link.hasFinalNodeVisible ? 0.5 : 0,
            strokeWidth: Math.max(1,link.width)
          }}
        />
      ))}
    </g>
  )
  const nodes = (
    <g>
      {sankeyData && sankeyData.nodes.map(node => {
        const opacity = node.listItemVisible || node.hasFinalNodeVisible ? 1 : 0.2
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

  const maxNumberLength = `${listItems.length}`.length
  const listNumberWidth = `${maxNumberLength}ch`

  const list = listItems.map((node, i) => {
    if (node.depth !== maxDepth) {
      return null
    }
    const color = colorScale(node.name)
    return (
      <div key={node.name} >
        <span><span style={{ width: listNumberWidth}} className={styles.listNumber}>{i + 1}</span> <div className={styles.dot} style={{backgroundColor: color}} /> {node.name}</span>
        <span>{node.value.toLocaleString()}</span>
      </div>
    )
  })

  const listConnectingLines = listItems.filter(d => d.listItemVisible)
    .map((node, nodeIndex) => {
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

  return (
    <div className={styles.sankey} style={{ height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${marginLeft}, ${marginTop})`}>
          {paths}
          {nodes}
          <g>{listConnectingLines}</g>
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

    </div>
  )
}
