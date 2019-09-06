import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import Amplify from 'aws-amplify'
import config from './aws-exports'
import {Auth, Hub, Logger } from 'aws-amplify'

Amplify.configure(config)

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
