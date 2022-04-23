// @flow

import { asMaybe, asObject, asString } from 'cleaners'
import { type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'

import s from '../../locales/strings.js'
import { useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { MainButton } from '../themed/MainButton.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SceneHeader } from '../themed/SceneHeader.js'

type Props = {
  navigation: NavigationProp<'editToken'>,
  route: RouteProp<'editToken'>
}

export function EditTokenScene(props: Props) {
  const { navigation, route } = props
  const { tokenId, walletId } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)
  const wallet = account.currencyWallets[walletId]

  // Extract our initial state from the token:
  const [currencyCode, setCurrencyCode] = useState(route.params.currencyCode ?? '')
  const [displayName, setDisplayName] = useState(route.params.displayName ?? '')
  const [contractAddress, setContractAddress] = useState<string>(() => {
    const clean = asMaybeContractLocation(route.params.networkLocation)
    if (clean == null) return ''
    return clean.contractAddress
  })
  const [decimalPlaces, setDecimalPlaces] = useState<string>(() => {
    const { multiplier } = route.params
    if (multiplier == null || !/^10*$/.test(multiplier)) return '18'
    return (multiplier.length - 1).toString()
  })

  async function handleDelete() {
    if (tokenId == null) return
    await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.string_delete}
        message={s.strings.edittoken_delete_prompt}
        buttons={{
          ok: {
            label: s.strings.string_delete,
            async onPress() {
              await wallet.currencyConfig.removeCustomToken(tokenId)
              navigation.goBack()
              return true
            }
          },
          cancel: { label: s.strings.string_cancel_cap }
        }}
      />
    ))
  }

  async function showMessage(message: string): Promise<void> {
    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        message={message}
        buttons={{
          ok: { label: s.strings.string_ok_cap }
        }}
      />
    ))
  }

  async function handleSave() {
    // Validate input:
    const decimals = parseInt(decimalPlaces)
    if (currencyCode === '' || displayName === '' || contractAddress === '') {
      return await showMessage(s.strings.addtoken_invalid_information)
    }
    if (isNaN(decimals)) {
      return await showMessage(s.strings.edittoken_invalid_decimal_places)
    }

    const token: EdgeToken = {
      currencyCode,
      displayName,
      denominations: [
        {
          multiplier: '1' + '0'.repeat(decimals),
          name: currencyCode,
          symbol: ''
        }
      ],
      networkLocation: {
        contractAddress
      }
    }
    // We should probably expose `getTokenId` from the core,
    // then check for conflicts before continuing.

    if (tokenId != null) {
      await wallet.currencyConfig.changeCustomToken(tokenId, token)
    } else {
      const tokenId = await wallet.currencyConfig.addCustomToken(token)
      await wallet.changeEnabledTokenIds([...wallet.enabledTokenIds, tokenId])
    }
    navigation.goBack()
  }

  return (
    <SceneWrapper avoidKeyboard>
      <SceneHeader underline title={tokenId == null ? s.strings.title_add_token : s.strings.title_edit_token} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <OutlinedTextInput
          autoFocus={false}
          label={s.strings.addtoken_currency_code_input_text}
          marginRem={[0.5, 0.5, 1]}
          value={currencyCode}
          onChangeText={setCurrencyCode}
        />
        <OutlinedTextInput
          autoFocus={false}
          label={s.strings.addtoken_name_input_text}
          marginRem={[0.5, 0.5, 1]}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <OutlinedTextInput
          autoFocus={false}
          label={s.strings.addtoken_contract_address_input_text}
          marginRem={[0.5, 0.5, 1]}
          value={contractAddress}
          onChangeText={setContractAddress}
        />
        <OutlinedTextInput
          autoFocus={false}
          label={s.strings.addtoken_denomination_input_text}
          marginRem={[0.5, 0.5, 1]}
          value={decimalPlaces}
          onChangeText={setDecimalPlaces}
        />
        <MainButton alignSelf="center" label={s.strings.string_save} marginRem={[0.5, 0.5, 1]} onPress={handleSave} />
        {tokenId == null ? null : (
          <MainButton //
            alignSelf="center"
            label={s.strings.edittoken_delete_token}
            marginRem={[0.5, 0.5, 1]}
            type="secondary"
            onPress={handleDelete}
          />
        )}
      </ScrollView>
    </SceneWrapper>
  )
}

/**
 * Interprets a token location as a contract address.
 * In the future this scene may need to handle other weird networks
 * where the networkLocation has other contents.
 */
const asMaybeContractLocation = asMaybe(asObject({ contractAddress: asString }))

const getStyles = cacheStyles((theme: Theme) => ({
  scroll: {
    flexGrow: 1,
    marginTop: theme.rem(-0.5)
  },
  scrollContainer: {
    padding: theme.rem(1)
  },
  rightIcon: {
    color: theme.iconTappable,
    marginRight: theme.rem(1)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  },
  tokenList: {
    marginTop: theme.rem(-0.5),
    flex: 4
  }
}))
