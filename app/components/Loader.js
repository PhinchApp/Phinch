import React, { useEffect, useState } from 'react';
import loading from '../images/loading.gif';
import styles from './Loader.css';
import palette from '../palette';

export default function Loader(props) {
  const { loading } = props;
  const [loaderColor, setLoaderColor] = useState(null);

  useEffect(() => {
    let colorChangeInterval = null;
    if (loading) {
      colorChangeInterval = setInterval(() => {
        setLoaderColor(palette[Math.floor(Math.random() * palette.length)]);
      }, 5000);
    }
    return () => {
      clearInterval(colorChangeInterval); // Changed clearTimeout to clearInterval
    };
  }, [loading]);

  return loading ? (
    <div className={styles.loaderWrapper}>
      <div className={styles.loaderContent}>
        <div className={styles['lds-ring']}>
          <div style={{ borderTopColor: loaderColor }} />
          <div style={{ borderTopColor: loaderColor }} />
          <div style={{ borderTopColor: loaderColor }} />
          <div style={{ borderTopColor: loaderColor }} />
        </div>
        <p className={styles.loadingText}>File is parsing into Phinch. <br/> This make take several minutes. </p>
        
      </div>
    </div>
  ) : (
    ''
  );
}
