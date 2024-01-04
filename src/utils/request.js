import Axios from 'axios';
import qs from 'qs';
import router from 'dva/router';
import { browswerHistory } from 'dva/router';
import { message } from 'antd';
Axios.defaults.timeout = 60000;
Axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
Axios.defaults.withCredentials = true;//保证同一用户登录后每次请求后台的sessionId一致

var request = function(type, url, params, isToast, responseType = 'json'){
  type = type || 'get';
  if (!url) throw new Error('请指定url');
  var obj = {};
  params = Object.prototype.toString.call(params) === '[object Object]' ? params : {};

  if(type === 'get'){
    obj.method = 'get';
    obj.url = url;
    obj.params = params;
    obj.responseType = responseType;
  }else if(type === 'post'){
    obj.method = 'post';
    obj.url = url;
    params = qs.stringify(params);
    obj.data = params;
    obj.responseType = responseType;
  }else{
    throw new Error('请指定请求方式');
  }
  var instance = Axios.create();

  //当创建实例的时候，拦截器放在default无效
  // instance.interceptors.request.use(config=>{
  //   //不能使用null，否则会将token的值变成'null'
  // config.headers['Authorization'] = window.app._store.getState().global.token || '';
  //   return config;
  // }, error=> {
  //   return Promise.reject(error);
  // });
  instance.interceptors.response.use(response=> {
    return response;
  }, error=> {
    if(error.response){
      if(error.response.status == 401){
        let str = window.location.href;
        let i = str.indexOf("login");
        if(i<0){
          message.error("登录超时",1);
        }
        localStorage.clear();
        router.push('/user/login');
      }
    }

    return Promise.reject(error);

  });

  var __promise = new Promise((resolve, reject)=>{
    instance.request(obj).then(res=>{
      if(res.status == 200){
      /**
         * 如果返回的事blob 则直接返回
         */
        if(res.data instanceof Blob){
          return resolve(res);
        }
        /**
         * 无权限处理
         */
        if(res.data.code == 401){
          // message.info(res.data.message && res.data.message || '你无权限');
          // localStorage.__BIMToken__ && delete localStorage.__BIMToken__;
          // return browswerHistory.push('/login');
          // router.push('/');
          localStorage.clear()
          router.push('/user/login');
        }
        if (res.data.code === 403) {
          router.push('/exception/403');
          return;
        }
        // if (res.data.code <= 504 && res.data.code >= 500) {
        //   router.push('/exception/500');
        //   return;
        // }
        if (res.data.code >= 404 && res.data.code < 422) {
          router.push('/exception/404');
        }

        /**
         * 有权请求
         */
        if(res.data.code == '200' || res.data.code == '201' || res.data.code == '202' || res.data.code == '204'){
          isToast && message.info(res.data.message && res.data.message || '请求成功');
          return resolve(res.data);
        }else{
          isToast && message.warning(res.data.message && res.data.message || '请求错误');
          return resolve(res.data);;
        }
      }
      message.error('请求失败');
      reject(res.data);
    }, err=>{
      let parseError = JSON.parse(JSON.stringify(err));
      let code = parseError.response.status;
      // if(code >= 400 && code <500){
      //   message.error('客户端异常');
      // }
      // if(code >=500){
      //   message.error('服务端异常');
      // }
      // if(code == 'ECONNABORTED'){
      //   message.error('请求超时');
      // }
      reject(code);
    }).catch(e=>{
      message.error('网络异常');
      // let str = window.location.href;
      //   let i = str.indexOf("login");
      //   if(i<0){
      //     router.push('/user/login');
      //   }
      // reject('异常');
    });
  });
  return __promise;
}

export default request;
