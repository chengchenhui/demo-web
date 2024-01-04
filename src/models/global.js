import {getMenuTreeList, getOrgList} from '@/services/global';
import { getCookie, setCookie, clearCookie } from '@/utils';
import { routerRedux } from 'dva/router';
import * as CONFIG from '@/config/commonConfig';
export default {
    namespace: 'global',
    state: {
        token:'',
        userInfo:{},
        isCollapseSider: false,
        menuList: [],
        activeSubmenu: [],
        activeChildrenMenu:[],
        orgList:[],
        iframeActiveRoute:{},
        iframeRouteList:[]
    },
    subscriptions: {
        //路由监听
        //eslint-disable-line
        getGlobalData(e) {
            const {dispatch ,history} =e;
            // var _token = !!localStorage && localStorage.token || '';
            // var _userInfo = !!localStorage && !!localStorage.userInfo && JSON.parse(localStorage.userInfo) || {};
            dispatch({type:'getToken', params:{token:window.__TOKEN___}});
            dispatch({type:'getUserInfo', params:{userInfo:window.__USERINFO__}});
            // window.__TOKEN___ && dispatch({type:'getMenuTreeList', params:{expandAll:'true'}});
            // window.__USERINFO__ && dispatch({type:'getOrgList', params:{}});
            //侧边菜单默认使用cookie保存的值
            dispatch({type:'toggleSider', params:{isCollapseSider:!!Number(getCookie('isCollapseSider'))}});
        },
        //全局路由权限控制
        limitRouterController({dispatch, history}){
            return history.listen(({pathname}) => {
            	console.log(CONFIG)
                CONFIG.LIMIT_ROUTES.map(item=>{
                    if(pathname.indexOf(item) >=0){
                        dispatch({type:'limitRouterController'});
                    }
                });
            });
        },
        //登录之后，无法走登录和注册页面
        signRouterController({dispatch, history}){
            return history.listen(({pathname}) => {
                CONFIG.AFTER_SIGNIN_LIMIT_ROUTES.map(item=>{
                    if(pathname.indexOf(item) >=0){
                        dispatch({type:'signRouterController'});
                    }
                });
            });
        },
        //如果路由不在menuList内，就重置二级和三级菜单的激活状态
        onRouteChange({dispatch, history}){
            return history.listen(({pathname})=>{
                let menuList = window.app._store.getState().global.menuList;
                let b = true;
                let recursive = list=>list.map(item=>{
                    if(item.route == pathname){
                        b = false;
                    }
                    if(item.children && !!item.children.length){
                        recursive(item.children);
                    }
                });
                recursive(menuList);
                b && dispatch({type:'resetActiveSubmenu'});
            });
        }
    },
    effects: {
        //组织列表
        * getOrgList({params}, {call, put}){
            let data = yield call(getOrgList, params);
            yield put({type: 'setOrgList', payload:{orgList:data.result}});
        },
        //侧边栏收展
        * toggleSider({params}, {call,put}) { // eslint-disable-line
            clearCookie('isCollapseSider');
            setCookie('isCollapseSider', Number(params.isCollapseSider), 1000);
            yield put({type: 'setCollapseState',payload: {isCollapseSider: params.isCollapseSider}});
        },
        //获取属性菜单
        * getMenuTreeList({params}, {call,put, select}) { // eslint-disable-line
            var data = yield call(getMenuTreeList, params);

            //递归树形结构，给每个节点添加isActive, label, value, key属性， 并优先使用cookie的记录激活相应菜单
            var defaultActiveSubMenuIndex = 0;
            var recursive = loopData=>{
                for(var i=0; i<loopData.length; i++){
                    loopData[i].isActive = false;
                    loopData[i].label = loopData[i].name;
                    loopData[i].value = loopData[i].id;
                    loopData[i].key = loopData[i].id;
                    //使用cookie设置默认头部菜单
                    if(!!getCookie('menuActiveItemRoute') && (loopData[i].route == getCookie('menuActiveItemRoute'))){
                        defaultActiveSubMenuIndex = i;
                        loopData[i].isActive = true;
                    }
                    if(loopData[i].children){
                        recursive(loopData[i].children);
                    }
                }
                return loopData;
            }
            data.result = recursive(data.result);
            yield put({type: 'setMenuList',payload: {menuList: data.result}});
            let _activeSubmenu = !!data.result.length && !!data.result.slice(defaultActiveSubMenuIndex, (defaultActiveSubMenuIndex+1)).length && data.result.slice(defaultActiveSubMenuIndex, (defaultActiveSubMenuIndex+1))[0].children || [];
            let _activeChildrenMenu = [];
            //根据路由匹配激活二级菜单的激活状态，并获取相应三级菜单列表
            const currentPathname = yield select(state=> state.routing.locationBeforeTransitions.pathname);
            _activeSubmenu = _activeSubmenu.map(item=>{
                item.isActive = false;
                if(currentPathname.indexOf(item.route) >= 0){
                    item.isActive = true;
                    _activeChildrenMenu = item.children;
                }
                return item;
            });
            yield put({type: 'setActiveSubmenu', payload: {activeSubmenu: _activeSubmenu}});
            yield put({type: 'setActiveChildrenMenu', payload:{activeChildrenMenu:_activeChildrenMenu}});
            //如果激活的二级菜单数组为空，则关闭侧边栏
            !_activeSubmenu.length == 0 ? (yield put({type: 'setCollapseState',payload: {isCollapseSider: false}})) : (yield put({type: 'setCollapseState',payload: {isCollapseSider: true}}));
        },
        //获取展开的二级菜单
        * getActiveSubmenu({ params}, {call, put, select}) { // eslint-disable-line
            //点击头部一级菜单后，需要切换当前状态，并设置相应的二级菜单列表
            let menuList = yield select(state=>state.global.menuList);
            menuList.map(item=>{
                item.isActive = false;
            });
            let newItem = params.item;
            //保存一级菜单索引
            clearCookie('menuActiveItemRoute');
            setCookie('menuActiveItemRoute', newItem.route, 1000);
            newItem.isActive = !newItem.isActive;
            menuList.splice(menuList.indexOf(params.item), 1, newItem)

            //根据路由匹配设置展开的二级级菜单的激活状态，并获取相应三级菜单列表
            const currentPathname = yield select(state=>state.routing.locationBeforeTransitions.pathname);
            let _activeSubmenu = [];
            let _activeChildrenMenu = [];
            _activeSubmenu = params.activeSubmenu.map(item=>{
                item.isActive = false;
                if(currentPathname.indexOf(item.route) >= 0){
                    item.isActive = true;
                    _activeChildrenMenu = item.children;
                }
                return item;
            });

            yield put({type: 'setActiveSubmenu', payload: {activeSubmenu: _activeSubmenu, menuList:menuList} });
            yield put({type: 'setActiveChildrenMenu', payload:{activeChildrenMenu:_activeChildrenMenu}})
            //如果激活的子节点数组为空，关闭侧边栏
            !params.activeSubmenu.length == 0 ? (yield put({type: 'setCollapseState',payload: {isCollapseSider: false}})) : (yield put({type: 'setCollapseState',payload: {isCollapseSider: true}}));
        },
        //获取展开的三级菜单
        * getActiveChildrenMenu({ params }, {call, put, select}) { // eslint-disable-line
            let activeSubmenu = yield select(state=>state.global.activeSubmenu);
            let _activeChildrenMenu = [];
            let newActiveSubmenuItem = params.activeSubmenuItem;
            activeSubmenu.map(item=>{
                item.isActive = false;
                item.route == params.activeSubmenuKey && !!item.children.length &&  (_activeChildrenMenu = item.children);
                return item;
            });

            newActiveSubmenuItem.isActive = true;
            activeSubmenu.splice(activeSubmenu.indexOf(params.activeSubmenuItem), 1, newActiveSubmenuItem);
            yield put({type: 'setActiveSubmenu', payload: {activeSubmenu: activeSubmenu}});
            yield put({type:'setActiveChildrenMenu', payload:{activeChildrenMenu:_activeChildrenMenu}})
        },
        //获取激活的路由视图
        * getActiveRoute({ params }, { call, put, select }){
            let { iframeActiveRoute, iframeRouteList } = yield select(state=>state.global);
            let _iframeActiveRoute = params.iframeActiveRoute;
            if(_iframeActiveRoute == iframeActiveRoute ) return;
            for(var i=0; i<iframeRouteList.length; i++){
                if(iframeRouteList[i].route == _iframeActiveRoute.route){
                    return yield put({type:'setActiveIframeRoute', payload:{iframeActiveRoute:_iframeActiveRoute}});
                }
            }
            iframeRouteList.push(params.iframeActiveRoute);
            yield put({type:'setActiveIframeRoute', payload:{iframeActiveRoute:_iframeActiveRoute, iframeRouteList}})

        },
        //获取token
        * getToken({ params}, {call, put}) { // eslint-disable-line
            yield put({type: 'setToken', payload: {token: params.token}});
            // localStorage && (localStorage.token = params.token);
        },
        //获取用户信息
        * getUserInfo({params}, {call, put}){
            // localStorage && (localStorage.userInfo = JSON.stringify(params.userInfo));
            yield put({type:'setUserInfo', payload:{userInfo:params.userInfo}});
        },
        //用户请求无权限
        * getUngrantInfo({ params }, {call, put, select}){
            // localStorage.token && delete localStorage.token;
            // localStorage.userInfo && delete localStorage.userInfo;
            // yield put({type:'setToken', payload:{token:''}});
            // yield put({type:'setUserInfo', payload:{userInfo:{}}});
            // yield put(routerRedux.push('/signin'));
        },
        //全局路由控制
        * limitRouterController({ params }, {call, put, select}){
            // let _token = (yield select(state=>state.global.token)) || localStorage.token || '';
            let _token = (yield select(state=>state.global.token));
            !_token && (yield put(routerRedux.push('/ungrant')));
        },
        //登录后路由控制
        * signRouterController({ params }, {call, put, select}){
            // let _token = (yield select(state=>state.global.token)) || localStorage.token || '';
            let _token = (yield select(state=>state.global.token));
            !!_token && (yield put(routerRedux.push('/')));
        },
        //如果不是菜单里面的路由，主要针对个人中心，重置二级三级菜单
        * resetActiveSubmenu({ param }, {call, put, select}){
            let _activeSubmenu = yield select(state=>state.global.activeSubmenu);
            _activeSubmenu.map(item=>{
                return item.isActive = false;
            });
            yield put({type:'setActiveSubmenu', payload:{activeSubmenu:_activeSubmenu}});
            yield put({type:'setActiveChildrenMenu', payload:{activeChildrenMenu:[]}});
        },
        // 操作bim
        * handleBim({ params }, {call, put, select}){
          let {type, data} = params;
          let _message = {
            isHandleBim:true,
            type,
            data
          }
          window.parent.postMessage(JSON.stringify(_message), '*');
        }
    },

    reducers: {
        setOrgList(state, action){
            return{
                ...state,
                ...action.payload
            }
        },
        setCollapseState(state, action) {
            return {
                ...state,
                ...action.payload
            };
        },
        setActiveSubmenu(state, action) {
            return {
                ...state,
                ...action.payload
            };
        },
        setActiveChildrenMenu(state, action) {
            return {
                ...state,
                ...action.payload
            };
        },
        setMenuList(state, action){
            return{
                ...state,
                ...action.payload
            }
        },
        setActiveIframeRoute(state, action){
            return{
                ...state,
                ...action.payload
            }
        },
        setToken(state, action){
            return{
                ...state,
                ...action.payload
            }
        },
        setUserInfo(state, action){
            return{
                ...state,
                ...action.payload
            }
        }
    }

};
