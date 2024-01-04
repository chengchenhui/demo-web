import React from 'react';
import PropTypes from 'prop-types';
import { Router } from 'dva/router';

const registerModel = (app, model) => {
  if (!(app._models.filter(m => m.namespace === model.namespace).length === 1)) {
    app.model(model);
  }
};

const RouterConfig = ({ history, app }) => {
  /**
   * 添加路由，path是请求路基，name是名称说明
   * */
  const routes = [
    {
      path: '/',
      name: 'welcome',
      getComponent(nextState, cb) {
        require.ensure([], (require) => {
          cb(null, require('./routes/indexPage/IndexPage'));
        });
      },
    },
  ];
  return <Router history={history} routes={routes} />;
};

RouterConfig.propTypes = {
  history: PropTypes.object,
  app: PropTypes.object,
};

export default RouterConfig;
