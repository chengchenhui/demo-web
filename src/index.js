import dva from 'dva';
import { browserHistory } from 'dva/router';
import createLoading from 'dva-loading';

// 1. Initialize
const app = dva({
 history:browserHistory
});

// 2. Plugins
app.use(createLoading());

// 3. Model
//app.model(require('./models/users/users'));

// 4. Router
app.router(require('./router'));

// 5. Start
app.start('#root');

