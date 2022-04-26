// @flow

import { sub } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings.js'

/**
 * Safely get a wallet name, returning a fallback when the name is null.
 */
export function getWalletName(wallet: EdgeCurrencyWallet): string {
  const { name } = wallet
  if (name == null) return s.strings.string_no_name
  return name
}

export function getWalletFiat(wallet: EdgeCurrencyWallet): { fiatCurrencyCode: string, isoFiatCurrencyCode: string } {
  const { fiatCurrencyCode } = wallet
  return { fiatCurrencyCode: fiatCurrencyCode.replace('iso:', ''), isoFiatCurrencyCode: fiatCurrencyCode }
}

export const getAvailableBalance = (wallet: EdgeCurrencyWallet, tokenCode?: string): string => {
  const { currencyCode, pluginId } = wallet.currencyInfo
  const cCode = tokenCode ?? currencyCode
  let balance = wallet.balances[cCode] ?? '0'
  if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported) {
    const lockedBalance = wallet.balances[`${cCode}${STAKING_BALANCES.locked}`] ?? '0'
    balance = sub(balance, lockedBalance)
  }
  return balance
}

/**
 * Returns all wallets that have a specific asset enabled
 */
export const getAssetSupportingWalletIds = async (
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet },
  nativeCurrencyCode: string,
  tokenCode?: string
): Promise<string[]> => {
  const walletIds = Object.keys(currencyWallets)
  const supportingWalletIds = []

  for (const walletId of walletIds) {
    const wallet = currencyWallets[walletId]
    const walletNativeCurrencyCode = wallet.currencyInfo.currencyCode.toUpperCase()
    const enabledTokenCodes = await wallet.getEnabledTokens()
    if (
      walletNativeCurrencyCode === nativeCurrencyCode.toUpperCase() &&
      (tokenCode == null ||
        (tokenCode != null &&
          (tokenCode.toUpperCase() === walletNativeCurrencyCode ||
            enabledTokenCodes.some(enabledTokenCode => tokenCode != null && enabledTokenCode.toUpperCase() === tokenCode.toUpperCase()))))
    )
      supportingWalletIds.push(walletId)
  }

  return supportingWalletIds
}
