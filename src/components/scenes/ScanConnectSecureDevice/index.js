// @flow

import { BlurView } from '@react-native-community/blur'
import { SecuxReactNativeBLE } from '@secux/transport-reactnative'
import { Disklet } from 'disklet'
import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import * as React from 'react'
import {
  type ImageSourcePropType,
  ActivityIndicator,
  Button,
  FlatList,
  PermissionsAndroid,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native'
import Dialog from 'react-native-dialog'

import { showSendLogsModal } from '../../../actions/LogActions.js'
import { initializeAccount, logoutRequest } from '../../../actions/LoginActions.js'
import { type ThemeProps, withTheme } from '../../../components/services/ThemeContext.js'
import { THEME } from '../../../theme/variables/airbitz.js'
import { connect } from '../../../types/reactRedux.js'
import { type DeepLink } from '../../types/DeepLinkTypes.js'
import { type GuiTouchIdInfo } from '../../types/types.js'
import Device from './device'
import DeviceItem from './DeviceItem'

// Sneak the BlurView over to the login UI:
global.ReactNativeBlurView = BlurView

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext,
  disklet: Disklet,
  pendingDeepLink: DeepLink | null,
  username: string
}
type DispatchProps = {
  deepLinkHandled: () => void,
  handleSendLogs: () => void,
  initializeAccount: (account: EdgeAccount, touchIdInfo: GuiTouchIdInfo) => void,
  logout: () => void
}
type Props = StateProps & DispatchProps & ThemeProps

type State = {
  counter: number,
  passwordRecoveryKey?: string,
  backgroundImage: ImageSourcePropType | null
}

const firstRun = true

class ScanConnectSecuxComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      password: '',
      loading: false,
      error: null,
      devices: this.props.defaultDevices ? this.props.defaultDevices : [],
      deviceId: null,
      error: null,
      refreshing: false,
      waiting: false,
      transport: this.props.transport,
      otp: '',
      showDialog: false
    }
  }

  _isMounted: boolean = false

  _setStateSafe: (InexactSubset<State>) => void = newState => {
    if (this._isMounted) this.setState(newState)
  }

  reload = () => {
    this._setStateSafe({
      devices: this.props.defaultDevices ? this.props.defaultDevices : [],
      deviceId: null,
      error: null,
      refreshing: false
    })
    SecuxReactNativeBLE.StartScan(this._AddDevice, this._DeleteDevice)
  }

  handleDisconnected = async () => {
    this.props.navigation.navigate('OnboardingRootNav', {
      screen: 'OnboardingNav',
      params: { screen: 'Onboarding' }
    })
  }

  handleConnected = () => {
    console.log('BLE device connected')
  }

  _onSelectDevice = async device => {
    SecuxReactNativeBLE.StopScan()
    if (this.state.deviceId != null) return
    try {
      if (device.id == null) {
        // should never happen
        throw new Error('device id is null')
      }
      const transport = await SecuxReactNativeBLE.Create(device.id, this.handleConnected, this.handleDisconnected)
      await transport.Connect()
      this.setState({
        deviceId: device.id,
        refreshing: false,
        waiting: true,
        transport: transport
      })
      // secux hack
      const otp = '42960705'
      console.log(otp)
      await transport.SendOTP(otp)
      // show otp dialog
      // this.setState({ showDialog: true });
    } catch (e) {
      console.log(e)
    } finally {
      console.log('_onSelectDevice done')
    }
  }

  renderItem = ({ item }: { item: Device }) => <DeviceItem device={item} onSelect={() => this._onSelectDevice(item)} />

  ListHeader = () => {
    const { error, waiting } = this.state
    const { intl, onWaitingMessage } = this.props

    const ListHeaderWrapper = ({ msg, err }: { msg: string, err: ?string }) => (
      <View style={styles.listHeader}>
        <Text style={[styles.paragraph, styles.paragraphText]}>{msg}</Text>
        {err != null && <Text style={[styles.error, styles.paragraphText]}>{err}</Text>}
      </View>
    )
    let msg, errMsg
    if (error != null) {
      msg = intl.formatMessage(messages.error)
      if (error instanceof LocalizableError) {
        errMsg = intl.formatMessage({
          id: error.id,
          defaultMessage: error.defaultMessage
        })
      } else {
        errMsg = String(error.message)
      }
    } else {
      if (waiting && typeof onWaitingMessage !== 'undefined') {
        msg = onWaitingMessage
      }
    }
    if (msg == null) return null
    return <ListHeaderWrapper msg={msg} err={errMsg} />
  }

  async componentDidMount() {
    this._isMounted = true
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    }

    this.setState(this.state)
    SecuxReactNativeBLE.StopScan()
    SecuxReactNativeBLE.StartScan(this._AddDevice, this._DeleteDevice)
  }

  onConnectBLE = async () => {
    try {
      this.props.navigation.navigate('walletListScene')
      // await importAdditionalAccounts();
    } catch (error) {
      console.log('onConnectBLE Error: ', error)
    }
  }

  otp_processing = async () => {
    this.setState({ showDialog: false })
    await this.onConnectBLE()
  }

  _AddDevice = device => {
    this.setState({ devices: [...this.state.devices, device] })
  }

  _DeleteDevice = device => {
    this.setState({ devices: this.state.devices.filter(x => x.id !== device.id) })
  }

  componentDidUpdate(oldProps: Props) {}

  scanBLE = async () => {}

  render() {
    const { loading, error, devices, refreshing, deviceId, waiting } = this.state

    return (
      <SafeAreaView>
        <Text>- Upon turning on bluetooth on smartphone and device, the device name should appear on the screen to click for pairing connection</Text>
        <Button onPress={this.scanBLE} title="Scan BLE" color="#841584" accessibilityLabel="Learn more about this purple button" />
        <FlatList
          extraData={[error, deviceId]}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContentContainer}
          data={devices}
          renderItem={this.renderItem}
          keyExtractor={item => item.id.toString()}
        />

        <View>
          <Dialog.Container visible={this.state.showDialog}>
            <Dialog.Title style={{ color: 'black' }}>OTP Authentication</Dialog.Title>
            <Dialog.Input style={{ color: 'black' }} onChangeText={otp => this.setState({ otp })} />
            <Dialog.Button label="OK" onPress={this.otp_processing} />
          </Dialog.Container>
        </View>
        <View style={styles.activityIndicator}>{waiting && <ActivityIndicator size="large" color="#0000ff" />}</View>
      </SafeAreaView>
    )
  }
}

const dummyTouchIdInfo: GuiTouchIdInfo = {
  isTouchEnabled: false,
  isTouchSupported: false
}

const rawStyles = {
  container: {
    flex: 1,
    position: 'relative',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: THEME.COLORS.PRIMARY
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const ScanConnectSecux = connect<StateProps, DispatchProps, {}>(
  state => ({
    account: state.core.account,
    context: state.core.context,
    disklet: state.core.disklet,
    pendingDeepLink: state.pendingDeepLink,
    username: state.nextUsername == null ? '' : state.nextUsername
  }),
  dispatch => ({
    deepLinkHandled() {
      dispatch({ type: 'DEEP_LINK_HANDLED' })
    },
    handleSendLogs() {
      dispatch(showSendLogsModal())
    },
    initializeAccount(account, touchIdInfo) {
      dispatch(initializeAccount(account, touchIdInfo))
    },
    logout() {
      dispatch(logoutRequest())
    }
  })
)(withTheme(ScanConnectSecuxComponent))
