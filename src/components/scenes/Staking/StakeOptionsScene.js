// @flow
import * as React from 'react'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type StakePolicy } from '../../../plugins/stake-plugins'
import { useEffect, useState } from '../../../types/reactHooks.js'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getRewardAssetsName, getStakeAssetsName, stakePlugin } from '../../../util/stakeUtils.js'
import { FillLoader } from '../../common/FillLoader.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { CurrencyIcon } from '../../themed/CurrencyIcon.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { StakingOptionCard } from '../../themed/StakingOptionCard.js'

type Props = {
  route: RouteProp<'stakeOptions'>,
  navigation: NavigationProp<'stakeOptions'>
}

export const StakeOptionsScene = (props: Props) => {
  const { walletId } = props.route.params
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const icon = <CurrencyIcon pluginId="fantom" resizeMode="contain" sizeRem={1.5} marginRem={[0, 0.5, 0, 0]} />

  //
  // Stake Policies
  //

  const [stakePolicies, setStakePolicies] = useState<StakePolicy[]>([])
  useEffect(() => {
    stakePlugin
      .getStakePolicies()
      .then(stakePolicies => {
        if (stakePolicies.length === 1) {
          // Transition to next scene immediately
          navigation.replace('stakeOverview', { walletId, stakePolicy: stakePolicies[0] })
          return
        }
        // TODO: Filter stakePolicies by wallet's pluginId and currency tokenId
        setStakePolicies(stakePolicies)
      })
      .catch(err => console.error(err))
  }, [navigation, walletId])

  //
  // Handlers
  //

  const handleStakeOptionPress = (stakePolicy: StakePolicy) => {
    navigation.navigate('stakeOverview', { walletId, stakePolicy })
  }

  //
  // Renders
  //

  const renderOptions = () => {
    return stakePolicies.map(stakePolicy => {
      const stakeAssetsName = getStakeAssetsName(stakePolicy)
      const rewardAssetsName = getRewardAssetsName(stakePolicy)
      const primaryText = stakeAssetsName
      const secondaryText = `${stakeAssetsName} to Earn ${rewardAssetsName}`
      const key = [primaryText, secondaryText].join()

      // TODO: Populate currencyLogos with an array of logos
      return (
        <View key={key} style={styles.optionContainer}>
          <TouchableOpacity onPress={() => handleStakeOptionPress(stakePolicy)}>
            <StakingOptionCard currencyLogos={[]} primaryText={primaryText} secondaryText={secondaryText} />
          </TouchableOpacity>
        </View>
      )
    })
  }

  if (stakePolicies.length === 0)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, 'Tomb')} underline withTopMargin>
        {icon}
      </SceneHeader>
      <View style={styles.optionsContainer}>
        <EdgeText>{s.strings.stake_select_options}</EdgeText>
        {renderOptions()}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  optionsContainer: {
    alignItems: 'stretch',
    margin: theme.rem(1)
  },
  optionContainer: {
    margin: theme.rem(1),
    marginBottom: 0
  },

  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))
