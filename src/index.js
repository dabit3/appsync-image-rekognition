import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import Amplify from 'aws-amplify'
import config from './aws-exports'
import { Auth, Hub, Logger } from 'aws-amplify'

Amplify.configure(config)

// Amplify.configure({
//   ...config,
//   'aws_appsync_graphqlEndpoint': 'https://bg7uqwbm6bcg7btr4f2p3n3hny.appsync-api.us-east-2.amazonaws.com/graphql',
//   'aws_appsync_region': 'us-east-1',
//   'aws_appsync_authenticationType': 'API_KEY',
//   'aws_appsync_apiKey': 'da2-upskhc6esfhobpzfposyu63mo4',
// })

class AppWithAuth extends React.Component {
  state = {
    loggedIn: false
  }
  async componentDidMount() {
    const logger = new Logger()
    Hub.listen('auth', logger);
    logger.onHubCapsule = event => {
      if (event.payload.event === 'signOut') {
        this.setState({ loggedIn: false })
      }
      if (event.payload.event === 'signIn') {
        this.setState({ loggedIn: true })
      }
    }
    try {
      const userData = await Auth.currentAuthenticatedUser()
      console.log('userData:', userData)
      this.setState({ loggedIn:  true })
    } catch (err) {
      console.log('user not logged in')
    }
  }
  onAuthChange = e => {
    console.log('event: ', e)
  }
  render() {
    return <div>
      <App />
      {
        !this.state.loggedIn && <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <p style={{ margin: 0 }}>username: <span>dabit4</span></p>
            <p style={{ margin: 5 }}>password: <span>MyCoolPassword1!</span></p>
          </div>
      }
    </div>
  }
} 

ReactDOM.render(<AppWithAuth />, document.getElementById('root'));
registerServiceWorker();
