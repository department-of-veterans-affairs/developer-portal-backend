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
      'termsOfService',
      'apis',
    ])
    const user: User = new User(form)
    try {
      if (user.shouldUpdateKong()) {
        logger.info({ message: 'creating Kong consumer...' })
        await user.saveToKong(kong)
      }

      if (user.shouldUpdateOkta() && okta) {
        logger.info({ message: 'creating Okta client application...' })
        await user.saveToOkta(okta)
      }

      logger.info({ message: 'recording signup in DynamoDB...' })
      await user.saveToDynamo(dynamo)

      if (govdelivery) {
        logger.info({ message: 'sending email to new user...' })
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
    } catch (err) {
      if (slack) {
        await user.sendSlackFailure(slack)
      }
      next(err)
    }
  }
}
