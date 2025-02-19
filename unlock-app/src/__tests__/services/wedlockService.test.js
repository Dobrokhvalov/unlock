import axios from 'axios'
import WedlockService, { emailTemplate } from '../../services/wedlockService'

jest.mock('axios')

let w
describe('Wedlocks Service', () => {
  beforeEach(() => {
    w = new WedlockService('http://notareal.host')
  })

  it('should request an email confirmation, with the right headers and params', async () => {
    expect.assertions(1)
    const recipient = 'thomas.elphinstone+2@hambled.on'
    const expectedPayload = {
      template: emailTemplate.signupConfirmation,
      recipient,
      params: {
        confirmLink: 'https://mcdonalds.gov',
        email: encodeURIComponent(recipient),
        signedEmail: {
          encrypt: true,
          value: recipient,
        },
      },
    }
    axios.post.mockReturnValue()
    await w.confirmEmail(recipient, 'https://mcdonalds.gov')

    expect(axios.post).toHaveBeenCalledWith(
      'http://notareal.host',
      expectedPayload,
      {
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  })

  it('should request a welcome email, with the right headers and params', async () => {
    expect.assertions(1)
    const recipient = 'julien@unlock-protocol.com'
    const expectedPayload = {
      template: emailTemplate.welcome,
      recipient,
      params: {
        recoveryLink: 'https://recovery',
        email: encodeURIComponent(recipient),
      },
    }
    axios.post.mockReturnValue()
    await w.welcomeEmail(recipient, 'https://recovery')

    expect(axios.post).toHaveBeenCalledWith(
      'http://notareal.host',
      expectedPayload,
      {
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  })
})
