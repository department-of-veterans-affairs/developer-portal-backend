import { FormSubmission } from '../lib/FormSubmission'
import pick from 'lodash.pick'
import { User } from '../lib/models'
import logger from '../lib/config/logger'

export default function developerApplicationHandler(kong, okta, dynamo, govdelivery, slack) {
  return async function (req, res, next): Promise<any> {
    const form: FormSubmission = pick(req.body, [
      'firstName',
      'lastName',
      'organization',
      'description',
      'email',
      'oAuthRedirectURI',
      'oAuthApplicationType',
      'termsOfService',
      'apis',
    ])
    const user: User = new User(form)
    /* 
     * Sign up the user in Kong and Okta, record it in DynamoDB,
     * and return the result to UI as quickly as possible. Report
     * an error to the UI with the call to next if any of these critical steps fail.
     */
    try {
      if (user.shouldUpdateKong()) {
        logger.info({ message: 'creating Kong consumer' })
        await user.saveToKong(kong)
      }

      if (user.shouldUpdateOkta() && okta) {
        logger.info({ message: 'creating Okta client application' })
        await user.saveToOkta(okta)
      }

      logger.info({ message: 'recording signup in DynamoDB' })
      await user.saveToDynamo(dynamo)

      if (!user.oauthApplication) {
        res.json({ token: user.token })
      } else {
        res.json({
          clientID: user.oauthApplication.client_id,
          clientSecret: user.oauthApplication.client_secret,
          token: user.token,
        })
      }
    } catch (err) {
      next(err)
      return
    }

    /*
     * Try actions that won't trigger a failure in the UI like sending
     * a welcome email and notifying Slack about the signup.
     */
    try {
      if (govdelivery) {
        logger.info({ message: 'sending email to new user' })
        await user.sendEmail(govdelivery)
      }
    } catch(err) {
      err.action = 'sending govdelivery signup notification'
      next(err)
    }

    try {
      if (slack) {
        logger.info({ message: 'sending success to slack' })
        await user.sendSlackSuccess(slack)
      }     
    } catch (err) {
      err.action = 'sending slack signup message'
      next(err)
    }
  }
}
