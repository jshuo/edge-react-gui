// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage, { type ResizeMode } from 'react-native-fast-image'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

import { getPluginId } from '../../constants/WalletAndCurrencyConstants.js'
import { memo, useEffect, useMemo } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIcon, getTokenId } from '../../util/CurrencyInfoHelpers.js'
import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides.js'
import { removeHexPrefix } from '../../util/utils.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type Props = {
  // Main props - If non is specified, would just render an empty view
  walletId?: string, // To allow showing the progress ratio sync circle
  pluginId?: string, // Needed when walletId is not supplied and we still want to get an icon
  tokenId?: string, // Needed when it's a token (not the plugin's native currency)
  // Image props
  mono?: boolean, // To use the mono dark icon logo
  resizeMode?: ResizeMode,
  // Styling props
  sizeRem?: number,
  marginRem?: number | number[],
  paddingRem?: number | number[],
  // Deprecated!!! here for backward compatibility instead of pluginId or tokenId wherever it's not yet easily available
  currencyCode?: string,
  walletType?: string
}

const SECONDARY_ICON_RATIO = 1 / Math.sqrt(5)

const fixRatio = ratio => {
  if (ratio < 0.05) return 0.05
  else if (ratio > 0.95 && ratio < 1) return 0.95
  else return ratio
}

export const CurrencyIconComponent = (props: Props) => {
  let { pluginId, tokenId } = props
  const { walletId, mono = false, resizeMode, sizeRem, marginRem, paddingRem, currencyCode, walletType } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const size = theme.rem(sizeRem ?? 2)

  // Track wallets state from account and update the wallet when ready
  const account = useSelector(state => state.core.account)
  const edgeWallet = walletId != null ? account.currencyWallets[walletId] : null
  // If we have a wallet, get the pluginId from it in case it's missing
  if (edgeWallet != null && pluginId == null) pluginId = edgeWallet.currencyInfo.pluginId

  // /////////////// HACKS to maintain Backward compatibility for now /////////////// //
  // Hack 1 - Use the legacy prop 'walletType' to get the PluginID
  if (walletType != null && pluginId == null) {
    pluginId = getPluginId(walletType)
  }

  // Hack 2 - Use the legacy prop 'currencyCode' to get the PluginID and tokenID until we change everything to pass them directly
  if (currencyCode != null) {
    // If you already have a main network code but not a tokenId, check if you are a token and get the right tokenId
    if (pluginId != null) {
      tokenId = getTokenId(account, pluginId, currencyCode)
    }
    // If we don't have a pluginId, try to get one for a main network first
    if (pluginId == null) {
      pluginId = Object.keys(account.currencyConfig).find(id => account.currencyConfig[id].currencyInfo.currencyCode === currencyCode)
    }
    // If we still don't have a pluginId, try to get a pluginId and tokenId for a token
    if (pluginId == null) {
      pluginId = Object.keys(account.currencyConfig).find(id => {
        tokenId = getTokenId(account, id, currencyCode)
        return tokenId != null
      })
    }
  }
  // Hack 3 - Assume a tokenId can be a contract address for now until we start using the correct ones
  if (tokenId != null) tokenId = removeHexPrefix(tokenId)
  // //////////////////////////////////////////////////////////////////////////////// //

  // Main view styling
  const spacingStyle = useMemo(
    () => ({
      ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
      ...sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))
    }),
    [marginRem, paddingRem, theme.rem]
  )

  // Main Currency icon
  const currencyIcon = useMemo(() => {
    const currencyIconStyle = { width: size, height: size }
    // Return and empty view of the same size if no plugin id exists
    if (pluginId == null) return <View style={currencyIconStyle} />
    // Set source and style
    const { symbolImage, symbolImageDarkMono } = getCurrencyIcon(pluginId, tokenId)
    const currencyIcon = { uri: mono ? symbolImageDarkMono : symbolImage }
    // Return a currency icon fetched from the content server
    return <FastImage style={currencyIconStyle} source={currencyIcon} resizeMode={resizeMode} />
  }, [size, pluginId, tokenId, mono, resizeMode])

  // Secondary (parent) currency icon (if it's a token)
  const secondaryCurrencyIcon = useMemo(() => {
    // Return null if no plugin id or not a token
    if (pluginId == null || tokenId == null || tokenId === pluginId) return null
    // Set source and style
    const { symbolImage, symbolImageDarkMono } = getCurrencyIcon(pluginId)
    const secondaryCurrencyIcon = { uri: mono ? symbolImageDarkMono : symbolImage }
    const secondaryCurrencyIconStyle = {
      ...styles.tokenIcon,
      width: size * SECONDARY_ICON_RATIO,
      height: size * SECONDARY_ICON_RATIO
    }
    // Return a currency icon fetched from the content server
    return <FastImage style={secondaryCurrencyIconStyle} source={secondaryCurrencyIcon} resizeMode={resizeMode} />
  }, [tokenId, pluginId, mono, styles.tokenIcon, size, resizeMode])

  // If we have a wallet, listen for the progress ratio for the syncing circle
  const radius = size + theme.rem(0.25)
  const circumference = radius * 2 * Math.PI
  // Animation variables
  const syncRatio = useSharedValue(edgeWallet != null ? fixRatio(edgeWallet.syncRatio) : 0)
  const progress = useSharedValue(syncRatio.value)
  const isDone = useSharedValue(false)

  const animatedProps = useAnimatedProps(() => {
    // Set new progress and prop values
    progress.value = withTiming(syncRatio.value, { duration: 3000 })
    let opacity = withTiming(progress.value === 1 ? 0 : 1, { duration: 5000 })
    const strokeDashoffset = circumference * (1 - progress.value)
    // Hide the sync circle after syncing is done, unless it goes all the way down to 0 (resync)
    if (opacity === 0) isDone.value = true
    if (opacity !== 0 && isDone.value) opacity = 0
    if (progress.value === 0) isDone.value = false
    return { strokeDashoffset, opacity }
  })

  useEffect(() => {
    if (edgeWallet != null) {
      return edgeWallet.watch('syncRatio', (ratio: number) => {
        syncRatio.value = fixRatio(ratio)
      })
    }
  }, [edgeWallet, syncRatio])

  return (
    <View style={(spacingStyle, { height: size, width: size })}>
      <Svg style={styles.syncCircle}>
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          stroke={theme.walletProgressIconFill}
          strokeDasharray={circumference}
          strokeWidth={theme.rem(3 / 16)}
          animatedProps={animatedProps}
        />
      </Svg>
      {currencyIcon}
      {secondaryCurrencyIcon}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  syncCircle: {
    transform: [{ rotateZ: '-90deg' }],
    zIndex: 1,
    position: 'absolute',
    height: '100%',
    width: '100%'
  },
  tokenIcon: { zIndex: 2, position: 'absolute', bottom: 0, right: 0 }
}))

export const CurrencyIcon = memo(CurrencyIconComponent)
