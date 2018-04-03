/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import NewProject from './components/NewProject.js';
import Filter from './components/Filter.js';
import CounterPage from './containers/CounterPage';

export default () => (
  <App>
    <Switch>
      <Route path="/counter" component={CounterPage} />
      <Route path="/newproject" component={NewProject} />
      <Route path="/filter" component={Filter} />
      <Route path="/" component={HomePage} />
    </Switch>
  </App>
);
