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
```
### win构建重要  注意使用 vs2015
```
npm install --global --production windows-build-tools --vs2015
```
---

#### Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run rebuild
npm run build

# run unit & end-to-end tests
npm test


# lint all JS/Vue component files in `src/`
npm run lint

```
