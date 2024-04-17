import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import config from './store/configureStore';

import './app.global.css';
import './rc.global.css';
import './toggle.global.css';

const store = config.configureStore();

render(
  <AppContainer>
    <Root store={store} history={config.history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextRoot store={store} history={config.history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
