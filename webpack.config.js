let webpack = require('webpack')
export default function (config, env) {
  Object.assign(config.entry, {
	// 用到什么公共lib（例如jquery.js），就把它加进vendor去，目的是将公用库单独提取打包
	// kpiStandardConfig 换成自己项目中的配置文件
    'config': ['./src/config/commonConfig.js'],
  })
  config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'config', // 这公共代码的chunk名为'config'
    filename: 'config.js', // 生成后的文件名
    minChunks: Infinity,
  }))
  return config
}
