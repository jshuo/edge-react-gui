// @flow

import { type EdgeAccount } from 'edge-core-js'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import AntDesignIcon, { type AntDesignGlyphs } from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { type WalletListMenuKey, walletListMenuAction } from '../../actions/WalletListMenuActions.js'
import { getPluginId, getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from '../themed/CurrencyIcon.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type Props = {
  bridge: AirshipBridge<null>,
  // Wallet identity:
  currencyCode?: string,
  isToken?: boolean,
  walletId: string
}

type WalletListOptionMap = {
  [name: WalletListMenuKey]: {
    label: string,
    icon: AntDesignGlyphs,
    sortIndex: number,
    currencyCodes?: string[],
    customColor?: string
  }
}

type MenuOption = {
  name: WalletListMenuKey,
  label: string,
  icon: AntDesignGlyphs,
  customColor?: string
}

export const WALLET_LIST_OPTIONS: WalletListOptionMap = {
  rename: {
    label: s.strings.string_rename,
    icon: 'edit',
    sortIndex: 1
  },
  resync: {
    label: s.strings.string_resync,
    icon: 'sync',
    sortIndex: 2
  },
  exportWalletTransactions: {
    label: s.strings.fragment_wallets_export_transactions,
    icon: 'export',
    sortIndex: 3
  },
  getSeed: {
    label: s.strings.string_master_private_key,
    icon: 'key',
    sortIndex: 4
  },
  manageTokens: {
    label: s.strings.string_add_edit_tokens,
    icon: 'plus',
    sortIndex: 5,
    currencyCodes: Object.keys(SPECIAL_CURRENCY_INFO)
      .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isCustomTokensSupported)
      .map(pluginId => SPECIAL_CURRENCY_INFO[pluginId].chainCode)
  },
  viewXPub: {
    label: s.strings.fragment_wallets_view_xpub,
    icon: 'eye',
    sortIndex: 6,
    currencyCodes: [
      'BCH',
      'BSV',
      'BTC',
      'BTG',
      'DASH',
      'DGB',
      'DOGE',
      'EBST',
      'EOS',
      'FIRO',
      'FTC',
      'GRS',
      'LTC',
      'QTUM',
      'RVN',
      'SMART',
      'TESTBTC',
      'TLOS',
      'UFO',
      'VTC',
      'WAX',
      'XMR',
      'ZEC'
    ]
  },
  delete: {
    label: s.strings.string_archive_wallet,
    icon: 'warning',
    sortIndex: 7,
    customColor: 'warningText'
  },
  getRawKeys: {
    label: s.strings.string_get_raw_keys,
    icon: 'lock',
    sortIndex: 8
  },
  rawDelete: {
    label: s.strings.string_archive_wallet,
    icon: 'warning',
    sortIndex: 9
  }
}

const toOptions = (walletOptions: string[], currencyCode?: string): MenuOption[] =>
  walletOptions
    .sort((optName1, optName2) => WALLET_LIST_OPTIONS[optName1].sortIndex - WALLET_LIST_OPTIONS[optName2].sortIndex)
    .filter(optionName => {
      const { currencyCodes } = WALLET_LIST_OPTIONS[optionName]
      return currencyCode == null || currencyCodes == null || currencyCodes.includes(currencyCode)
    })
    .map(name => ({ name, ...WALLET_LIST_OPTIONS[name] }))

const getWalletOptions = async (params: {
  walletId: string,
  walletName?: string,
  currencyCode?: string,
  isToken?: boolean,
  account: EdgeAccount
}): Promise<MenuOption[]> => {
  const { walletId, currencyCode, isToken, account } = params

  // If no currency code usually it's a broken wallet so allow exporting the keys and deleting the wallet
  if (!currencyCode) return toOptions(['getRawKeys', 'rawDelete'])

  // If it's a token wallet then limit the options
  if (isToken) return toOptions(['resync', 'exportWalletTransactions'])

  // Get splitting options
  const splittable = await account.listSplittableWalletTypes(walletId)
  const splitOptions: MenuOption[] = []
  for (const walletType of splittable) {
    const pluginId = getPluginId(walletType)
    if (account.currencyConfig[pluginId] == null || getSpecialCurrencyInfo(pluginId)?.isSplittingDisabled === true) continue
    const { displayName } = account.currencyConfig[pluginId].currencyInfo
    const label = sprintf(s.strings.string_split_wallet, displayName)
    splitOptions.push({ name: `split${displayName}`, label, icon: 'arrowsalt' })
  }

  // Add all other options except for rawDelete
  const { rawDelete, ...rest } = WALLET_LIST_OPTIONS
  const options = toOptions(Object.keys(rest))

  return splitOptions.concat(options)
}

export function WalletListMenuModal(props: Props) {
  const { bridge, currencyCode, isToken, walletId } = props

  const [options, setOptions] = useState([])

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const edgeWallet = account.currencyWallets[walletId]

  const theme = useTheme()
  const styles = getStyles(theme)

  // Look up the name and contractAddress:
  const walletName = edgeWallet?.name ?? ''
  const { contractAddress } = edgeWallet != null ? edgeWallet.currencyInfo.metaTokens.find(token => token.currencyCode === currencyCode) ?? {} : {}

  const handleCancel = () => props.bridge.resolve(null)

  const optionAction = (option: WalletListMenuKey) => {
    if (currencyCode == null && edgeWallet != null) {
      dispatch(walletListMenuAction(walletId, option, edgeWallet.currencyInfo.currencyCode))
    } else {
      dispatch(walletListMenuAction(walletId, option, currencyCode))
    }
    bridge.resolve(null)
  }

  useEffect(() => {
    getWalletOptions({ walletId, walletName, currencyCode, isToken, account }).then(options => setOptions(options))
  }, [account, currencyCode, isToken, walletId, walletName])

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      {walletName ? <ModalTitle>{walletName}</ModalTitle> : null}
      <View style={styles.headerRow}>
        {edgeWallet != null ? (
          <CurrencyIcon sizeRem={1} marginRem={[0, 0, 0, 0.5]} paddingRem={0.5} walletId={walletId} tokenId={contractAddress} resizeMode="cover" />
        ) : null}
        {currencyCode ? <ModalTitle>{currencyCode}</ModalTitle> : null}
      </View>
      {options.map((option: MenuOption) => {
        const { name, label, icon, customColor } = option
        const customStyle = customColor != null ? { color: theme[customColor] } : {}
        return (
          <TouchableOpacity key={name} onPress={() => optionAction(name)} style={styles.optionRow}>
            <AntDesignIcon name={icon} size={theme.rem(1)} style={[styles.optionIcon, customStyle]} />
            <Text style={[styles.optionText, customStyle]}>{label}</Text>
          </TouchableOpacity>
        )
      })}
      <ModalCloseArrow onPress={handleCancel} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  optionIcon: {
    color: theme.primaryText,
    padding: theme.rem(0.5)
  },
  optionText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    padding: theme.rem(0.5)
  }
}))
