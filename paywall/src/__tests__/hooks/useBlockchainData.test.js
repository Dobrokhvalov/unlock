import * as rtl from 'react-testing-library'
import React from 'react'

import { ConfigContext } from '../../utils/withConfig'
import { WindowContext } from '../../hooks/browser/useWindow'
import useBlockchainData from '../../hooks/useBlockchainData'
import { PostMessages } from '../../messageTypes'

describe('useBlockchainData hook', () => {
  const { Provider } = ConfigContext
  const address = '0x1234567890123456789012345678901234567890'
  const address2 = '0xa234567890123456789012345678901234567890'

  let fakeWindow
  let config
  let paywallConfig

  function Wrapper(props) {
    return (
      <Provider value={config}>
        <WindowContext.Provider value={fakeWindow}>
          <MockBlockchainData {...props} />
        </WindowContext.Provider>
      </Provider>
    )
  }

  function getCheckWalletListener() {
    return fakeWindow.addEventListener.mock.calls[0][1]
  }

  function getAddressListener() {
    return fakeWindow.addEventListener.mock.calls[1][1]
  }

  function getNetworkListener() {
    return fakeWindow.addEventListener.mock.calls[2][1]
  }

  function getBalanceListener() {
    return fakeWindow.addEventListener.mock.calls[3][1]
  }

  function getLocksListener() {
    return fakeWindow.addEventListener.mock.calls[4][1]
  }

  function getPMEvent(type, payload) {
    return {
      origin: 'origin',
      source: fakeWindow.parent,
      data: {
        type,
        payload,
      },
    }
  }

  function MockBlockchainData() {
    const { checkWallet, account, network, locks } = useBlockchainData(
      fakeWindow,
      paywallConfig
    )

    return (
      <div>
        <div title="checkWallet">{JSON.stringify(checkWallet)}</div>
        <div title="account">{JSON.stringify(account)}</div>
        <div title="network">{JSON.stringify(network)}</div>
        <div title="locks">{JSON.stringify(locks)}</div>
      </div>
    )
  }

  beforeEach(() => {
    fakeWindow = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      parent: {},
      location: {
        pathname: '/page/0x79b8825a3e7Fb15263D0DD455B8aAfc08503bb54',
        search: '?origin=origin',
        hash: '',
      },
      console: {
        warn: jest.fn(),
      },
    }
    paywallConfig = {
      locks: {
        [address]: {
          name: 'hi there!',
        },
      },
    }
    config = { isServer: false, isInIframe: true, requiredNetworkId: 3 }
  })

  it('should return default values', () => {
    expect.assertions(4)

    const component = rtl.render(<Wrapper />)
    const account = null
    const network = 3
    const locks = {}
    const checkWallet = false

    expect(component.getByTitle('checkWallet')).toHaveTextContent(
      JSON.stringify(checkWallet)
    )
    expect(component.getByTitle('account')).toHaveTextContent(
      JSON.stringify(account)
    )
    expect(component.getByTitle('network')).toHaveTextContent(
      JSON.stringify(network)
    )
    expect(component.getByTitle('locks')).toHaveTextContent(
      JSON.stringify(locks)
    )
  })

  it('should update when checkWallet status is changed', () => {
    expect.assertions(1)

    const component = rtl.render(<Wrapper />)

    const checkWalletUpdater = getCheckWalletListener()

    rtl.act(() => {
      checkWalletUpdater(getPMEvent(PostMessages.UPDATE_WALLET, true))
    })

    expect(component.getByTitle('checkWallet')).toHaveTextContent(
      JSON.stringify(true)
    )
  })

  it('should update when account is changed', () => {
    expect.assertions(1)

    const component = rtl.render(<Wrapper />)
    const account = {
      address,
      balance: {},
    }

    const accountUpdater = getAddressListener()

    rtl.act(() => {
      accountUpdater(getPMEvent(PostMessages.UPDATE_ACCOUNT, account.address))
    })

    expect(component.getByTitle('account')).toHaveTextContent(
      JSON.stringify(account)
    )
  })

  it('should update when network is changed', () => {
    expect.assertions(1)

    const component = rtl.render(<Wrapper />)
    const network = 5

    const networkUpdater = getNetworkListener()

    rtl.act(() => {
      networkUpdater(getPMEvent(PostMessages.UPDATE_NETWORK, network))
    })

    expect(component.getByTitle('network')).toHaveTextContent(
      JSON.stringify(network)
    )
  })

  it('should update when balance is changed', () => {
    expect.assertions(1)

    const component = rtl.render(<Wrapper />)
    const account = {
      address,
      balance: {
        eth: '5.3',
      },
    }

    const accountUpdater = getAddressListener()
    const balanceUpdater = getBalanceListener()

    rtl.act(() => {
      accountUpdater(getPMEvent(PostMessages.UPDATE_ACCOUNT, account.address))
      balanceUpdater(
        getPMEvent(PostMessages.UPDATE_ACCOUNT_BALANCE, account.balance)
      )
    })

    expect(component.getByTitle('account')).toHaveTextContent(
      JSON.stringify(account)
    )
  })

  it('should update when locks is changed', () => {
    expect.assertions(1)

    const component = rtl.render(<Wrapper />)
    const locks = {
      [address]: {
        address,
        keyPrice: '1',
        expirationDuration: 123,
        key: {
          expiration: 0,
          transactions: [],
          status: 'none',
          confirmations: 0,
          owner: address,
          lock: address,
        },
      },
    }

    const locksUpdater = getLocksListener()

    rtl.act(() => {
      locksUpdater(getPMEvent(PostMessages.UPDATE_LOCKS, locks))
    })

    expect(component.getByTitle('locks')).toHaveTextContent(
      JSON.stringify({
        [address]: {
          ...locks[address],
          name: 'hi there!',
        },
      })
    )
  })

  it('should ignore unknown locks and warn about them', () => {
    expect.assertions(2)

    const component = rtl.render(<Wrapper />)
    const locks = {
      [address]: {
        address,
        keyPrice: '1',
        expirationDuration: 123,
        key: {
          expiration: 0,
          transactions: [],
          status: 'none',
          confirmations: 0,
          owner: address,
          lock: address,
        },
      },
      [address2]: {
        address: address2,
        keyPrice: '1',
        expirationDuration: 123,
        key: {
          expiration: 0,
          transactions: [],
          status: 'none',
          confirmations: 0,
          owner: address,
          lock: address,
        },
      },
    }

    const locksUpdater = getLocksListener()

    rtl.act(() => {
      locksUpdater(getPMEvent(PostMessages.UPDATE_LOCKS, locks))
    })

    expect(component.getByTitle('locks')).toHaveTextContent(
      JSON.stringify({
        [address]: {
          ...locks[address],
          name: 'hi there!',
        },
      })
    )
    expect(fakeWindow.console.warn).toHaveBeenCalledWith(
      'internal error: data iframe returned locks not known to the paywall'
    )
  })
})
