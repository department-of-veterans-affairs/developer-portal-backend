import { FormSubmission } from '../lib/FormSubmission'
import pick from 'lodash.pick'
import { User } from '../lib/models'

export default function developerApplicationHandler(kong, okta, dynamo, govdelivery, slack) {
  return async function (req, res): Promise<any> {
    const form: FormSubmission = pick(req.body, [
      'firstName',
      'lastName',
      'organization',
      'description',
      'email',
      'oAuthRedirectURI',
      'termsOfService',
      'apis',
    ])
    const user: User = new User(form)
    try {
      if (user.shouldUpdateKong()) {
        console.log('Creating Kong consumer...')
        await user.saveToKong(kong)
      }

      if (user.shouldUpdateOkta() && okta) {
        console.info('Creating Okta client application...')
        await user.saveToOkta(okta)
      }

      console.info('Recording signup in DynamoDB...')
      await user.saveToDynamo(dynamo)

      if (govdelivery) {
        console.info('Sending email to new user...')
        await user.sendEmail(govdelivery)
      }
      if (slack) {
        await user.sendSlackSuccess(slack)
      }
      if (!user.oauthApplication) {
        res.json({ token: user.token })
      } else {
        res.json({
          clientID: user.oauthApplication.client_id,
          clientSecret: user.oauthApplication.client_secret,
          token: user.token,
        })
      }
    } catch (error) {
      let ourError = error
      if (error.errors) {
        // Sometimes what's thrown is the User object itself,
        // in which case we log the error from the `errors` property
        ourError = error.errors
      }
      console.log(ourError)
      if (slack) {
        await user.sendSlackFailure(slack)
      }
      res.status(500).json({ error: ourError })
    }
  }
}
