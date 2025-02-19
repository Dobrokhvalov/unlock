import WedlockService from '../services/wedlockService'
import { SIGNUP_EMAIL, WELCOME_EMAIL } from '../actions/user'
import { Action } from '../unlockTypes'

const wedlocksMiddleware = (config: any) => {
  const { services } = config
  const wedlockService = new WedlockService(services.wedlocks.host)
  // eslint-disable-next-line no-unused-vars
  return (_: any) => {
    return (next: any) => {
      return (action: Action) => {
        // Check that window is defined before attempting to access it. It would
        // be pretty bizarre if this event were to appear without window already
        // existing, so it's safe to simply do nothing in that case.
        if (action.type === SIGNUP_EMAIL && window && window.location) {
          const { origin } = window.location
          // TODO: then and catch? I think we really only need to worry about errors.
          wedlockService.confirmEmail(action.emailAddress, `${origin}/signup`)
        }

        if (action.type === WELCOME_EMAIL && window && window.location) {
          const { origin } = window.location
          // TODO: then and catch? I think we really only need to worry about errors.
          wedlockService.welcomeEmail(
            action.emailAddress,
            `${origin}/recover/?email=${
              action.emailAddress
            }&recoveryKey=${encodeURIComponent(
              JSON.stringify(action.recoveryKey)
            )}`
          )
        }

        next(action)
      }
    }
  }
}

export default wedlocksMiddleware
