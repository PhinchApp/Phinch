import React, { Component, useEffect, useState } from 'react';

import loading from 'images/loading.gif';

import styles from './Loader.css';
import palette from '../palette'

// export default class Home extends Component {
  // render() {

export default function Loader(props) {
  const { loading } = props
  const [loaderColor, setLoaderColor] = useState(null)
  useEffect(() => {
    let colorChangeInterval = null
    if (loading) {
      colorChangeInterval = setInterval(() => {
        setLoaderColor(palette[Math.floor(Math.random() * palette.length)])
      }, 5000)
    }
    return () => {
      clearTimeout(colorChangeInterval)
    }
  }, [loading])
  return loading  ? (
    <div className={styles.loaderWrapper}>
      <div className={styles['lds-ring']} >
        <div style={{ borderTopColor: loaderColor}} />
        <div style={{ borderTopColor: loaderColor}} />
        <div style={{ borderTopColor: loaderColor}} />
        <div style={{ borderTopColor: loaderColor}} />
      </div>
    </div>
  ) : '';
}

