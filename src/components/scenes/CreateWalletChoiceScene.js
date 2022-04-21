// @flow

import * as React from 'react'
import { View } from 'react-native'

import CreateWalletSvg from '../../assets/images/create-wallet.svg'
import s from '../../locales/strings.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'

type OwnProps = {
  navigation: NavigationProp<'createWalletChoice'>,
  route: RouteProp<'createWalletChoice'>
}

type Props = OwnProps

export const CreateWalletChoiceScene = (props: Props) => {
  const { navigation, route } = props
  const { selectedWalletType } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const onSelectNew = () => {
    navigation.navigate('createWalletSelectFiat', {
      selectedWalletType
    })
  }

  const onSelectRestore = () => {
    navigation.navigate('createWalletImport', {
      selectedWalletType
    })
  }

  // Should create svg scaler util
  const svgScale = theme.rem(1 / 16)
  const svgWidth = svgScale * 62
  const svgHeight = svgScale * 57.23

  return (
    <SceneWrapper avoidKeyboard background="theme">
      <SceneHeader withTopMargin title={s.strings.title_create_wallet} />
      <View style={styles.icon}>
        <CreateWalletSvg color={theme.iconTappable} width={svgWidth} height={svgHeight} />
      </View>
      <EdgeText style={styles.instructionalText} numberOfLines={2}>
        {s.strings.create_wallet_choice_instructions}
      </EdgeText>
      <MainButton alignSelf="stretch" label={s.strings.create_wallet_choice_new_button} marginRem={[1, 1]} type="secondary" onPress={onSelectNew} />
      <MainButton alignSelf="stretch" label={s.strings.create_wallet_import_title} type="escape" onPress={onSelectRestore} />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.rem(1),
    marginBottom: theme.rem(1)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    paddingHorizontal: theme.rem(1),
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(2),
    textAlign: 'center'
  }
}))
