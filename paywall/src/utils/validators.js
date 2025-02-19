import isURL from 'validator/lib/isURL'
import isDataURI from 'validator/lib/isDataURI'
import isDecimal from 'validator/lib/isDecimal'

import { ACCOUNT_REGEXP } from '../constants'

// tests whether a field's value was not entered by the user
export const isNotEmpty = val => val || val === 0

// tests whether a number is non-negative and not a decimal number
export const isPositiveInteger = val => {
  const parsedInt = parseInt(val)
  return !isNaN(parsedInt) && val == parsedInt && +val >= 0
}

// tests whether a number is a non-negative real number (decimals allowed)
export const isPositiveNumber = val => {
  const parsedFloat = parseFloat(val)
  return !isNaN(parsedFloat) && +parsedFloat >= 0
}

export const isAccount = val => {
  return val && typeof val === 'string' && val.match(ACCOUNT_REGEXP)
}

export const isAccountOrNull = val => {
  return val === null || isAccount(val)
}

/**
 * For now, this assumes this structure:
 *
 * var unlockProtocolConfig = {
 *   locks: {
 *     '0xabc...': {
 *   	   name: 'One Week',
 *      },
 *      '0xdef...': {
 *        name: 'One Month',
 *      },
 *      '0xghi...': {
 *        name: 'One Year',
 *      },
 *    },
 *    icon: 'https://...',
 *    callToAction: {
 *	    default:
 *        'Enjoy Forbes Online without any ads for as little as $2 a week. Pay with Ethereum in just two clicks.',
 *      expired:
 *        'your key has expired, please purchase a new one',
 *      pending: 'Purchase pending...',
 *      confirmed: 'Your content is unlocked!',
 *   },
 * }
 *
 * The fields in callToAction are all optional, and icon can be false for none
 */
export const isValidPaywallConfig = config => {
  if (!config) return false
  if (!isValidObject(config, ['callToAction', 'locks'])) return false
  // allow false for icon
  if (config.icon) {
    if (typeof config.icon !== 'string') return false
    if (
      config.icon &&
      !isURL(config.icon, {
        allow_underscores: true,
        allow_protocol_relative_urls: true,
        disallow_auth: true,
      }) &&
      !isDataURI(config.icon)
    ) {
      return false
    }
  }
  if (!config.callToAction || typeof config.callToAction !== 'object')
    return false
  const callsToAction = ['default', 'expired', 'pending', 'confirmed']
  const ctaKeys = Object.keys(config.callToAction)
  if (ctaKeys.length > callsToAction.length) return false
  if (ctaKeys.filter(key => !callsToAction.includes(key)).length) return false
  if (
    ctaKeys.filter(key => typeof config.callToAction[key] !== 'string').length
  ) {
    return false
  }
  if (!config.locks) return false
  if (typeof config.locks !== 'object') return false
  const locks = Object.keys(config.locks)
  if (!locks.length) return false
  if (
    locks.filter(lock => {
      if (!isAccount(lock)) return false
      const thisLock = config.locks[lock]
      if (!thisLock || typeof thisLock !== 'object') return false
      if (!Object.keys(thisLock).length) return true
      if (Object.keys(thisLock).length !== 1) return false
      if (!thisLock.name || typeof thisLock.name !== 'string') return false
      return true
    }).length !== locks.length
  ) {
    return false
  }

  if (
    config.unlockUserAccounts &&
    !(
      typeof config.unlockUserAccounts === 'boolean' ||
      config.unlockUserAccounts === 'true' ||
      config.unlockUserAccounts === 'false'
    )
  ) {
    return false
  }

  // persistentCheckout can ne not set, a boolean, or true or false.
  if (
    typeof config.persistentCheckout !== 'undefined' &&
    (typeof config.persistentCheckout !== 'boolean' &&
      ['true', 'false'].indexOf(config.persistentCheckout) === -1)
  ) {
    return false
  }

  return true
}

/**
 * helper function to assert on a thing being an
 * object with required and optional keys
 *
 * No assertion on the types of the values is done here
 */
function isValidObject(obj, validKeys) {
  if (!obj || typeof obj !== 'object') return false
  const keys = Object.keys(obj)

  if (keys.length < validKeys.length) return false
  if (validKeys.filter(key => !keys.includes(key)).length) return false
  return true
}

function isValidKeyStatus(status) {
  if (typeof status !== 'string') return false
  if (
    ![
      'none',
      'confirming',
      'confirmed',
      'expired',
      'valid',
      'submitted',
      'pending',
      'failed',
      'stale',
    ].includes(status)
  ) {
    return false
  }
  return true
}

/**
 * validate a single key. This should match the type in unlockTypes.ts
 */
export const isValidKey = key => {
  if (
    !isValidObject(key, [
      'expiration',
      'transactions',
      'status',
      'confirmations',
      'owner',
      'lock',
    ])
  ) {
    return false
  }

  if (
    typeof key.expiration !== 'number' ||
    !isPositiveInteger(key.expiration)
  ) {
    return false
  }
  if (!Array.isArray(key.transactions)) return false
  if (!isValidKeyStatus(key.status)) return false
  if (
    typeof key.confirmations !== 'number' ||
    !isPositiveInteger(key.confirmations)
  ) {
    return false
  }
  if (!isAccount(key.owner)) return false
  if (!isAccount(key.lock)) return false
  // NOTE: transactions are not used in the UI, and may be removed, so
  // for now we do not validate them. If this ever changes, they must
  // be validated
  /*
  if (
    key.transactions.filter(transaction => !isValidTransaction(transaction))
      .length
  ) {
    return false
  }
  */
  return true
}

/**
 * validate a single lock. This should match the type in unlockTypes.ts
 */
export const isValidLock = lock => {
  if (
    !isValidObject(lock, ['address', 'keyPrice', 'expirationDuration', 'key'])
  ) {
    return false
  }

  if (lock.hasOwnProperty('name') && typeof lock.name !== 'string') return false
  if (
    lock.hasOwnProperty('currencyContractAddress') &&
    !isAccountOrNull(lock.currencyContractAddress)
  ) {
    return false
  }
  if (!isAccount(lock.address)) return false
  if (typeof lock.keyPrice !== 'string' || !isDecimal(lock.keyPrice)) {
    return false
  }
  if (
    typeof lock.expirationDuration !== 'number' ||
    !isPositiveInteger(lock.expirationDuration)
  ) {
    return false
  }
  if (!isValidKey(lock.key)) return false
  return true
}

/**
 * validate the list of locks returned from the data iframe
 */
export const isValidLocks = locks => {
  if (!locks || typeof locks !== 'object' || Array.isArray(locks)) return false
  const keys = Object.keys(locks)
  if (keys.filter(key => !isAccount(key)).length) return false
  const lockValues = Object.values(locks)
  if (lockValues.filter(lock => !isValidLock(lock)).length) return false
  return true
}

/**
 * validate the list of keys returned from the data iframe
 * TODO: consider if validation is actually required
 */
export const isValidKeys = () => {
  return true
}

/**
 * validate the list of transactions returned from the data iframe
 * TODO: consider if validation is actually required
 */
export const isValidTransactions = () => {
  return true
}

/**
 * validate a balance as an object of currency: balance
 */
export const isValidBalance = balance => {
  if (!balance || typeof balance !== 'object' || Array.isArray(balance)) {
    return false
  }
  return Object.keys(balance).reduce((accumulator, currency) => {
    return (
      accumulator &&
      (isPositiveNumber(balance[currency]) &&
        typeof balance[currency] === 'string')
    )
  }, true)
}
