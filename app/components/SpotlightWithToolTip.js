import React, { Component, useEffect, useState } from 'react';
import { Switch, Route } from 'react-router';

import Spotlight from "rc-spotlight";
import 'antd/dist/antd.css';
import { Tooltip } from 'antd';
import styles from './Home.css';
import gstyle from './general.css';
import ReactTooltip from 'react-tooltip';


export default function SpotlightWithToolTip({ isActive, toolTipPlacement="left", toolTipTitle, children, overlayStyle, innerStyle={}, style, ...rest }) {
    const overlayInnerStyle = innerStyle
    if (toolTipPlacement === 'right') {
        overlayInnerStyle.transform = 'translateX(2em)'
    } else if (toolTipPlacement === 'bottomLeft') {
        overlayInnerStyle.transform = 'translateY(1em)'
    }
    const overlayStyleMerged = {
        maxWidth: "400px",
        fontSize: "16px",
        fontFamily: "Open Sans",
        fontWeight: "600",
        lineHeight: '1.35em',
        padding: '1rem',
        overflow: 'hidden',
        ...overlayStyle,
    }

    const spotlightStyle = {
        boxShadow: "0 0 10px #fff",
        borderRadius: '0.5em',
        ...style,
    }

    return(
        <Tooltip
            open={isActive}
            placement={toolTipPlacement}
            title={isActive ? toolTipTitle : ""}
            zIndex={1001}
            overlayStyle={overlayStyleMerged}
            overlayInnerStyle={overlayInnerStyle}
        >
            <Spotlight isActive={isActive} width='fit-content' backdropOpacity="0.8" backdropColor='#2D2F31' style={spotlightStyle} {...rest}>
                {children}
            </Spotlight>
        </Tooltip>
    );
}

