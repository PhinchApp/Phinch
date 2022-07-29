import React from 'react';
import Spotlight from "rc-spotlight";
import 'antd/dist/antd.css';
import { Tooltip } from 'antd';
import styles from './Home.css';
import gstyle from './general.css';


export default function SpotlightWithToolTip({ isActive, toolTipPlacement="left", toolTipTitle, children, overlayStyle, innerStyle={}, ...rest }) {
    const overlayInnerStyle = innerStyle
    if (toolTipPlacement === 'right') {
        overlayInnerStyle.transform = 'translateX(2em)'
    } else if (toolTipPlacement === 'bottomLeft') {
        overlayInnerStyle.transform = 'translateY(1em)'
    }
    const overlayStyleMerged = {
        maxWidth: "300px",
        fontSize: "16px",
        fontFamily: "Open Sans",
        fontWeight: "600",
        lineHeight: '1.35em',
        ...overlayStyle,
    }

    return(
        <Tooltip
            visible={isActive}
            placement={toolTipPlacement}
            title={isActive ? toolTipTitle : ""}
            zIndex={1000}
            overlayStyle={overlayStyleMerged}
            overlayInnerStyle={overlayInnerStyle}
        >
            <Spotlight isActive={isActive} width='fit-content' backdropOpacity="0.7" backdropColor='#2D2F31' style={{boxShadow: "0 0 10px #9ecaed", borderRadius: '0.5em'}} {...rest}>
                {children}
            </Spotlight>
        </Tooltip>
    );
}

