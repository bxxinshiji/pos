<!--
 * @Author: BigRocs
 * @Date: 2022-01-27 10:40:07
 * @LastEditTime: 2023-05-14 10:44:28
 * @LastEditors: BigRocs
 * @Description: QQ: 532388887, Email:bigrocs@qq.com
-->
# 终端软件

> An electron-vue project
### 国内 NPM 加速
```
npm config set registry https://registry.npm.taobao.org
npm config set metrics-registry https://registry.npm.taobao.org
#npm config set registry https://registry.npmjs.org
#npm config set metrics-registry https://registry.npmjs.org
# 检查是否安装成功 
npm config list
npm config set ELECTRON_MIRROR https://npm.taobao.org/mirrors/electron/
```
### win构建重要  注意使用 vs2015

```
npm install --global --production windows-build-tools --vs2015

```
    - 如果cnpm installl 需要进入目录 C:\Users\Administrator\.windows-build-tools 手动安装相关依赖

### 版本需求
```
    node        v12.17.0
    cnpm        7.1.0
    npm         6.14.4
    node-gyp    v9.3.1
```

---
### cnpm 安装
```
npm install cnpm@7.1.0 -g --registry=https://registry.npm.taobao.org
```
### electron 安装
```
cnpm install electron@4.2.12 -g

```
#### Build Setup

``` bash
# install dependencies
npm install
npm install --msvs_version=2015

npm run rebuild
# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build

# run unit & end-to-end tests
npm test


# lint all JS/Vue component files in `src/`
npm run lint

```
