import React from 'react';
import Spotlight from "rc-spotlight";
import 'antd/dist/antd.css';
import { Tooltip } from 'antd';
import styles from './Home.css';
import gstyle from './general.css';


export default function SpotlightWithToolTip({ isActive, toolTipPlacement="left", toolTipTitle="test", children, ...rest }) {
    return(
        <Tooltip
            visible={isActive}
            placement={toolTipPlacement}
            title={isActive ? toolTipTitle : ""}
            zIndex={9999}
            overlayStyle={{
                maxWidth: "250px",
                fontSize: "16px",
                fontFamily: "Open Sans",
                fontWeight: "600px",
            }}
        >
            <Spotlight isActive={isActive} style={{boxShadow: "0 0 10px #9ecaed"}} {...rest}>
                {children}
            </Spotlight>
        </Tooltip>
    );
}

