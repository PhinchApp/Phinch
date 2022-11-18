import * as React from "react"

const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={152.501}
    height={29.74}
    {...props}
  >
    <defs>
      <filter id="a">
        <feOffset />
        <feGaussianBlur stdDeviation={3} result="blur" />
        <feFlood floodColor="#fdfdfa" floodOpacity={0.302} result="color" />
        <feComposite operator="out" in="SourceGraphic" in2="blur" />
        <feComposite operator="in" in="color" />
        <feComposite operator="in" in2="SourceGraphic" />
      </filter>
    </defs>
    <g data-type="innerShadowGroup">
      <path
        data-name="Union 1"
        d="M137.437 29.36H14.193a14.5 14.5 0 0 1 0-28.971V.38h123.6a14.5 14.5 0 0 1 0 28.99l-.356-.01Z"
        fill="#001226"
      />
      <g transform="translate(.005 -.005)" filter="url(#a)">
        <path
          data-name="Union 1"
          d="M137.434 29.355H14.19a14.5 14.5 0 0 1 0-28.971V.375h123.6a14.5 14.5 0 0 1 0 28.99l-.356-.01Z"
          fill="#fff"
        />
      </g>
      <path
        data-name="Union 1"
        d="M137.437 29.36H14.193a14.5 14.5 0 0 1 0-28.971V.38h123.6a14.5 14.5 0 0 1 0 28.99l-.356-.01Z"
        fill="none"
        stroke="#f09e6a"
        strokeWidth={0.75}
      />
    </g>
    <text
      data-name="Need Help?"
      transform="translate(30.071 22.427)"
      fill="#f09e6a"
      fontSize={20}
      fontFamily="OpenSans-Semibold, Open Sans"
      fontWeight={600}
    >
      <tspan x={0} y={0}>
        {"Need Help?"}
      </tspan>
    </text>
    <g data-name="Group 1474" fill="#f09e6a">
      <path
        data-name="Path 607"
        d="M25.234 15.4a1.384 1.384 0 0 1-1.384 1.384H12.951a1.384 1.384 0 0 1 0-2.768h10.9a1.384 1.384 0 0 1 1.384 1.384"
      />
      <path
        data-name="Path 608"
        d="m21.67 10.648 3.241 3.862a1.384 1.384 0 0 1-2.121 1.78l-3.24-3.863a1.384 1.384 0 1 1 2.12-1.779"
      />
      <path
        data-name="Path 609"
        d="m21.67 20.153 3.241-3.862a1.384 1.384 0 0 0-2.121-1.78l-3.24 3.863a1.384 1.384 0 1 0 2.12 1.779"
      />
    </g>
  </svg>
)

export default SvgComponent
