import express from 'express';

import developerApplicationHandler from './routes/DeveloperApplication'

// var developerApplicationHandler = require('./routes/developer_application');

export default function configureApp() {
  var app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  app.get('/hello', (req, res) => res.send('hello'));
  app.post('/developer_application', developerApplicationHandler);

  return app;
}
