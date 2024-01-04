import React from 'react';
import { connect } from 'dva';
import styles from './index.less'
import Welcome from '../../components/welcome/Welcome'


class IndexPage extends React.Component {
  constructor(props) {
    super(props);
  }
  render(){

    return (
      <div className={styles.main}>
        <Welcome />
      </div>
    );
  }
}

function mapStateToProps({  }) {
  return {  };
}
export default connect(mapStateToProps)(IndexPage);
//export default Database;