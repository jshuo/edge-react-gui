import React, {Component} from 'react'
import {
    View,
    Picker,
    TextInput,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback,
    Linking
} from 'react-native'
import {abs, sub} from 'biggystring'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default'
import FormattedText from '../../components/FormattedText'
import Modal from 'react-native-modal'
import {PrimaryButton} from '../../components/Buttons'
import styles from './style'
import THEME from '../../../../theme/variables/airbitz'
import platform from '../../../../theme/variables/platform.js'
import * as UTILS from '../../../utils'
import type {AbcTransaction, AbcDenomination} from 'airbitz-core-types'

const categories = ['income', 'expense', 'exchange', 'transfer']

type Props = {
  abcTransaction: AbcTransaction,
  onChangeNotesFxn: (string) => void,
  onChangeCategoryFxn: (string) => void,
  onChangeFiatFxn: (string) => void,
  onBlurFiatFxn: () => void,
  onPressFxn: () => void,
  selectCategory: (any) => void,
  onSelectSubCategory: (string) => void,
  onEnterCategories: () => void,
  onExitCategories: () => void,
  onSubcategoryKeyboardReturn: () => void,
  onNotesKeyboardReturn: () => void,
  onFocusNotes: () => void,
  onBlurNotes: () => void,
  onFocusFiatAmount: () => void,
  openModalFxn: () => void,
  fiatCurrencyCode: string,
  cryptoCurrencyCode: string,
  fiatCurrencySymbol: string,
  fiatAmount: string,
  onEnterSubcategories: () => void,
  subCategorySelectVisibility: boolean,
  categorySelectVisibility: boolean,
  subCategory: string,
  types: any,
  usableHeight: number,
  dimensions: any,
  leftData: any,
  direction: string,
  feeSyntax: string,
  color: string,
  type: any,
  walletDefaultDenomProps: AbcDenomination
}

type State = {

}

class AmountArea extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      color: ''
    }
  }

  handleClick = () => {
    Linking.canOpenURL(this.props.txExplorerUrl).then((supported) => {
      if (supported) {
        Linking.openURL(this.props.txExplorerUrl)
      } else {
        console.log('Do not know how to open URI: ' + this.props.txExplorerUrl)
      }
    })
  }

  render () {
    let feeSyntax, leftData, convertedAmount, amountString, absoluteAmount, symbolString
    absoluteAmount = abs(this.props.abcTransaction.nativeAmount)

    if (this.props.direction === 'receive') {
      convertedAmount = UTILS.convertNativeToDisplay(this.props.walletDefaultDenomProps.multiplier)(absoluteAmount) // convert to correct denomiation
      amountString = UTILS.decimalOrZero(UTILS.truncateDecimals(convertedAmount, 6), 6) // limit to 6 decimals, check if infinitesimal, and remove unnecessary trailing zeroes
      feeSyntax = ''
      leftData = {
        color: THEME.COLORS.ACCENT_GREEN,
        syntax: strings.enUS['fragment_transaction_income']
      }
    } else { // send tx
      if (this.props.abcTransaction.networkFee) { // stub, check BTC vs. ETH (parent currency)
        convertedAmount = UTILS.convertNativeToDisplay(this.props.walletDefaultDenomProps.multiplier)(absoluteAmount) // convert the native amount to correct *denomination*
        const convertedFee = UTILS.convertNativeToDisplay(this.props.walletDefaultDenomProps.multiplier)(this.props.abcTransaction.networkFee) // convert fee to correct denomination
        const amountMinusFee = sub(convertedAmount, convertedFee) // for outgoing tx substract fee from total amount
        const amountTruncatedDecimals = UTILS.truncateDecimals(amountMinusFee.toString(), 6) // limit to 6 decimals, at most
        amountString = UTILS.decimalOrZero(amountTruncatedDecimals, 6) // change infinitesimal values to zero, otherwise cut off insignificant zeroes (at end of decimal)
        const feeString = abs(UTILS.truncateDecimals(convertedFee, 6)) // fee should never be negative
        feeSyntax = sprintf(strings.enUS['fragment_tx_detail_mining_fee'], feeString)
        leftData = {
          color: THEME.COLORS.ACCENT_RED,
          syntax: strings.enUS['fragment_transaction_expense']}
      } else { // do not show fee, because token
        amountString = absoluteAmount
        feeSyntax = ''
        leftData = {
          color: THEME.COLORS.ACCENT_RED,
          syntax: strings.enUS['fragment_transaction_expense']}
      }
    }

    let notes = this.props.abcTransaction.metadata ? this.props.abcTransaction.metadata.notes : ''
    if (UTILS.isCryptoParentCurrency(this.props.guiWallet, this.props.abcTransaction.currencyCode)) { // if it is the parent crypto
      symbolString = this.props.walletDefaultDenomProps.symbol ? (this.props.walletDefaultDenomProps.symbol + ' ') : ''
    } else {
      symbolString = ''
    }

    if (!notes) notes = ''

    return (
      <View style={[styles.amountAreaContainer]}>
        <View style={[styles.amountAreaCryptoRow]}>
          <View style={[styles.amountAreaLeft]}>
            <FormattedText style={[styles.amountAreaLeftText, {color: leftData.color}]}>{strings.enUS['fragment_transaction_' + this.props.direction + '_past']}</FormattedText>
          </View>
          <View style={[styles.amountAreaMiddle]}>
            <View style={[styles.amountAreaMiddleTop]}>
              <FormattedText style={[styles.amountAreaMiddleTopText]}>{symbolString}{amountString}</FormattedText>
            </View>
            <View style={[styles.amountAreaMiddleBottom]}>
              <FormattedText style={[styles.amountAreaMiddleBottomText]}>{feeSyntax}</FormattedText>
            </View>
          </View>
          <View style={[styles.amountAreaRight]}>
            <FormattedText style={[styles.amountAreaRightText]}>{this.props.cryptoCurrencyCode}</FormattedText>
          </View>
        </View>
        <View style={[styles.editableFiatRow]}>
          <View style={[styles.editableFiatLeft]}>
            <FormattedText style={[styles.editableFiatLeftText]} />
          </View>
          <View style={[styles.editableFiatArea]}>
            <FormattedText style={styles.fiatSymbol}>{this.props.fiatCurrencySymbol}</FormattedText>
            <TextInput
              underlineColorAndroid={'transparent'}
              returnKeyType='done'
              autoCapitalize='none'
              autoCorrect={false}
              onFocus={this.props.onFocusFiatAmount}
              onChangeText={this.props.onChangeFiatFxn}
              style={[styles.editableFiat, UTILS.inputBottomPadding()]}
              keyboardType='numeric'
              placeholder={''}
              value={UTILS.truncateDecimals(this.props.fiatAmount.toString().replace('-',''), 2, true)}
              defaultValue={''}
              onBlur={this.props.onBlurFiatFxn}
              blurOnSubmit={true}
            />
          </View>
          <View style={[styles.editableFiatRight]}>
            <FormattedText style={[styles.editableFiatRightText]}>{this.props.fiatCurrencyCode}</FormattedText>
          </View>
        </View>
        <View style={[styles.categoryRow]}>
          <TouchableOpacity style={[styles.categoryLeft, {borderColor: this.props.color}]} onPress={this.props.onEnterCategories} disabled={this.props.subCategorySelectVisibility}>
            <FormattedText style={[{color: this.props.color}, styles.categoryLeftText]}>{this.props.type.syntax}</FormattedText>
          </TouchableOpacity>
          <View style={[styles.categoryInputArea]}>
            <TextInput
              underlineColorAndroid={'transparent'}
              blurOnSubmit
              autoCapitalize='words'
              placeholderTextColor={THEME.COLORS.GRAY_}
              onFocus={this.props.onEnterSubcategories}
              onChangeText={this.props.onChangeSubcategoryFxn}
              onSubmitEditing={this.props.onSubcategoryKeyboardReturn}
              style={[styles.categoryInput, UTILS.inputBottomPadding()]}
              defaultValue={this.props.subCategory || ''}
              placeholder={strings.enUS['transaction_details_category_title']}
              autoCorrect={false}
            />
          </View>
        </View>
        <Modal isVisible={this.props.categorySelectVisibility} animationIn='slideInUp' animationOut='slideOutDown' backdropColor='black' backdropOpacity={0.6}>
          <Picker style={[ UTILS.border(),
            {
              backgroundColor: THEME.COLORS.WHITE,
              width: platform.deviceWidth,
              height: platform.deviceHeight / 3,
              position: 'absolute',
              top: (2/3) * platform.deviceHeight,
              left: -20
            }
          ]}
            itemStyle={{fontFamily: 'SourceSansPro-Black', color: THEME.COLORS.GRAY_1, fontSize: 22, paddingBottom: 14}}
            selectedValue={this.props.type.key}
            onValueChange={(itemValue) => this.props.selectCategory({itemValue})}>
            {categories.map((x) => (
              <Picker.Item label={this.props.types[x].syntax} value={x} key={this.props.types[x].key} />
            ))}
          </Picker>
        </Modal>
        <View style={[styles.notesRow]}>
          <View style={[styles.notesInputWrap]} >
            <TextInput
              underlineColorAndroid={'transparent'}
              onChangeText={this.props.onChangeNotesFxn}
              multiline
              numberOfLines={3}
              defaultValue={notes}
              style={[styles.notesInput, UTILS.inputBottomPadding()]}
              placeholderTextColor={THEME.COLORS.GRAY_}
              placeholder={strings.enUS['transaction_details_notes_title']}
              autoCapitalize='sentences'
              autoCorrect={false}
              onFocus={this.props.onFocusNotes}
              onBlur={this.props.onBlurNotes}
              // onSubmitEditing={this.props.onBlurNotes}
              blurOnSubmit={false}
              onScroll={() => Keyboard.dismiss()}
            />
          </View>
        </View>
        <View style={[styles.footerArea]}>
          <View style={[styles.buttonArea]}>
            <PrimaryButton text={strings.enUS['string_save']} style={[styles.saveButton]} onPressFunction={this.props.onPressFxn} />
          </View>
          <TouchableWithoutFeedback onPress={() => this.handleClick()} style={[styles.advancedTxArea]}>
            <FormattedText style={[styles.advancedTxText]}>{strings.enUS['transaction_details_view_advanced_data']}</FormattedText>
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
}
export default AmountArea
