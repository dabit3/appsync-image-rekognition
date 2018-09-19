import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import Amplify from 'aws-amplify'
import config from './aws-exports'
Amplify.configure({
  ...config,
  'aws_appsync_graphqlEndpoint': 'https://bg7uqwbm6bcg7btr4f2p3n3hny.appsync-api.us-east-2.amazonaws.com/graphql',
  'aws_appsync_region': 'us-east-1',
  'aws_appsync_authenticationType': 'API_KEY',
  'aws_appsync_apiKey': 'da2-upskhc6esfhobpzfposyu63mo4',
})

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
