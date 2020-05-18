import { Request, Response, NextFunction } from 'express';
import GovDeliveryService from '../services/GovDeliveryService';

const requiredFields = ['firstName', 'lastName', 'email', 'description'];
const SUBJECT = "Support Needed";
const RECIPIENT = "api@va.gov";

// function checkRequiredFields(body) {
//   return requiredFields.filter((field) => {
//     return !(body.hasOwnProperty(field) && body[field]);
//   });
// }

function checkRequiredFields(submittedFields: string[]): string[] {
  return requiredFields.filter(required => {
      return !submittedFields.includes(required);
  });
}

export default function contactUsHandler(govDelivery: GovDeliveryService | null) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    const submittedFields = Object.keys(req.body);
    const missingFields = checkRequiredFields(submittedFields);

    if (missingFields.length > 0) {
      res.status(400).json({
        body: `Missing Required Parameter(s): ${missingFields.join(',')}`,
        statusCode: 400,
      });
      return;
    }

    try {
      const { firstName, lastName, email, description, organization, apis } = req.body;
      const result = await govDelivery.sendEmail(firstName, lastName, email, description, organization, apis, SUBJECT, RECIPIENT);
      res.json({ id: result.data.id });
    } catch(err) {
      err.action = 'sending contact us email';
      next(err);
    }
  };
}