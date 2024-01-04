import React from 'react';
import { Form, Modal, Button, Row, Col, Input, Select, Table, Icon, Tooltip, Pagination } from 'antd';
import logo from '../../assets/logo_sgs1.png'
import styles from './index.less'
/**
 * demo首页
 */
class Welcome extends React.Component{
  constructor(){
    super();

  }

  render(){

    return (
      <div className={styles.main}>
        <div className={styles.main_box}>
          <img src={logo}/>
          <p>欢迎加入深圳高速工程顾问有限公司</p>
        </div>
      </div>
    )
  }
}
export default Welcome;