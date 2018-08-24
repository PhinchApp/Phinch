import ua from 'universal-analytics';
import uuid from 'uuid';
import { JSONStorage } from 'node-localstorage';

const nodeStorage = new JSONStorage('phinch');
const visitorId = nodeStorage.getItem('visitorid') || uuid();
nodeStorage.setItem('visitorid', visitorId);

const visitor = ua('UA-50346302-2', visitorId);

export function trackEvent(category, action, label, value) {
  visitor.event({
    ec: category,
    ea: action,
    el: label,
    ev: value,
  }).send();
}

export function pageView(location) {
  visitor.pageview(location).send();
}
