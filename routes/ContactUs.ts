import { Request, Response, NextFunction } from 'express';
import GovDeliveryService, { SupportEmail } from '../services/GovDeliveryService';

const requiredFields = ['firstName', 'lastName', 'email', 'description'];

function checkRequiredFields(submittedFields: string[]): string[] {
  return requiredFields.filter(required => {
      return !submittedFields.includes(required);
  });
}

function filterRelevantApis(apis: { [api: string]: boolean }): string[] {
  const allApis = Object.keys(apis);
  return allApis.filter(api => apis[api]);
}

export default function contactUsHandler(govDelivery: GovDeliveryService | null) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!govDelivery) {
      res.status(503).json({ error: 'service not enabled'});
      return;
    }

    const submittedFields = Object.keys(req.body);
    const missingFields = checkRequiredFields(submittedFields);

    if (missingFields.length > 0) {
      res.status(400).json({
        body: `Missing Required Parameter(s): ${missingFields.join(',')}`,
        // Odd to list status code again, but required to honor the contract with 
        // the frontend that came from when this was a lambda.
        statusCode: 400,
      });
      return;
    }

    try {
      const supportRequest: SupportEmail = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        requester: req.body.email,
        description: req.body.description,
        organization: req.body.organization,
        apis: filterRelevantApis(req.body.apis),
      };
      
      await govDelivery.sendSupportEmail(supportRequest);
      res.sendStatus(200);
    } catch(err) {
      err.action = 'sending contact us email';
      next(err);
    }
  };
}