// @flow

import * as React from 'react'
import { Defs, G, LinearGradient, Mask, Path, Rect, Stop, Svg, Use } from 'react-native-svg'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  width: number,
  height: number,
  holeTop: number,
  holeSize: number
}
type Props = OwnProps & ThemeProps

const Component = (props: Props) => {
  const { width, height, theme, holeTop, holeSize } = props
  const styles = getStyles(theme)

  // Corner radius
  const cornerRadius = 30
  const cornerLegroom = 15
  const strokeWidth = 6

  // Gradient
  const fillColor = theme.cameraOverlay
  const gradientEdgeOpacity = '1'
  const gradientCenterOpacity = '0.4'

  // Colors
  const highlightColor = theme.iconTappable

  // Hole cutout
  const holeX = Math.round((width - holeSize) / 2)
  const holeY = holeTop

  return (
    <Svg style={styles.overlay} width={width} height={height}>
      <Rect x="0" y="0" width={width} height={height} fill="url(#Gradient)" mask="url(#Mask)" />
      <Use href="url(#Corners)" x={0} y={0} stroke={highlightColor} strokeWidth={strokeWidth} />

      <Defs>
        <LinearGradient id="Gradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fillColor} stopOpacity={gradientEdgeOpacity} />
          <Stop offset="0.2" stopColor={fillColor} stopOpacity={gradientCenterOpacity} />
          <Stop offset="0.8" stopColor={fillColor} stopOpacity={gradientCenterOpacity} />
          <Stop offset="1" stopColor={fillColor} stopOpacity={gradientEdgeOpacity} />
        </LinearGradient>
        <Mask id="Mask" maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
          <Rect x="0" y="0" width={width} height={height} fill="white" />
          <Rect x={holeX} y={holeY} height={holeSize} width={holeSize} fill="black" rx={cornerRadius} />
        </Mask>
        <G id="Corners">
          <Path
            d={`
              M ${holeX + strokeWidth} ${holeY + cornerRadius + strokeWidth + cornerLegroom}
              l ${0} ${-cornerLegroom} 
              q ${0} ${-cornerRadius} ${cornerRadius} ${-cornerRadius}
              l ${cornerLegroom} ${0} 
            `}
            x={-strokeWidth}
            y={-strokeWidth}
            stroke={highlightColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d={`
              M ${holeX + holeSize - cornerRadius + strokeWidth - cornerLegroom} ${holeY + strokeWidth} 
              l ${cornerLegroom} ${0} 
              q ${cornerRadius} ${0} ${cornerRadius} ${cornerRadius}
              l ${0} ${cornerLegroom}
            `}
            x={-strokeWidth}
            y={-strokeWidth}
            stroke={highlightColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d={`
              M ${holeX + holeSize + strokeWidth} ${holeY + holeSize - cornerRadius + strokeWidth - cornerLegroom} 
              l ${0} ${cornerLegroom} 
              q ${0} ${cornerRadius} ${-cornerRadius} ${cornerRadius}
              l ${-cornerLegroom} ${0}
            `}
            x={-strokeWidth}
            y={-strokeWidth}
            stroke={highlightColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d={`
              M ${holeX + cornerRadius + strokeWidth + cornerLegroom} ${holeY + holeSize + strokeWidth} 
              l ${-cornerLegroom} ${0} 
              q ${-cornerRadius} ${0} ${-cornerRadius} ${-cornerRadius}
              l ${0} ${-cornerLegroom}
            `}
            x={-strokeWidth}
            y={-strokeWidth}
            stroke={highlightColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </G>
      </Defs>
    </Svg>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0
  }
}))

export const QrPeephole = withTheme(Component)
