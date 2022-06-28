/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import NewProject from './components/NewProject';
import Filter from './components/Filter';
import About from './components/About';
import Vis from './components/Vis';
import ReactTooltip from 'react-tooltip';

export default () => (
  <App>
    <Switch>
      <Route path="/newproject" component={NewProject} />
      <Route path="/filter" component={Filter} />
      <Route path="/about" component={About} />
      <Route path="/vis" component={Vis} />
      <Route path="/" component={HomePage} />
    </Switch>
    <ReactTooltip className='customReactTooltip' place='bottom' type='light' arrowColor='transparent' />

  </App>
);
