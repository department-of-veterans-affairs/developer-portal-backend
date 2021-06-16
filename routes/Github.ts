import Joi from '@hapi/joi';
import GovDeliveryService from '../services/GovDeliveryService';
import SlackService from '../services/SlackService';

/* Reference:
 * https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#secret_scanning_alert
 */
export const secretScanningAlertSchema = Joi.object().keys({
  action: Joi.string().required(),
  alert: Joi.object().required(),
  repository: Joi.object().required(),
  organization: Joi.string().required(),
  installation: Joi.object().required(),
  sender: Joi.object().required(),
});

type githubRequestBody = {
  action: string;
  alert: Record<string,unknown>;
  repository: Record<string,unknown>;
  organization: Record<string,unknown>;
  installation: Record<string,unknown>;
  sender: Record<string,unknown>;
}

export default function githubSecurityHandler(govDelivery: GovDeliveryService, slack: SlackService): void | any {
  // Send Email
  console.log(govDelivery);
  // Send slack message
  console.log(slack);
}
