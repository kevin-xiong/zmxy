# 芝麻信用 NodeJS SDK (非官方)

[![NPM version](https://img.shields.io/npm/v/zmxy.svg?style=flat-square)](http://badge.fury.io/js/zmxy)
[![Build Status](https://travis-ci.org/bmqb/zmxy.svg?branch=master)](https://travis-ci.org/bmqb/zmxy)
[![Dependencies Status](https://david-dm.org/bmqb/zmxy.svg)](https://david-dm.org/bmqb/zmxy)
[![codecov](https://codecov.io/gh/bmqb/zmxy/branch/master/graph/badge.svg)](https://codecov.io/gh/bmqb/zmxy)
[![npm](https://img.shields.io/npm/dm/bmqb.svg?maxAge=2592000)](https://www.npmjs.com/package/zmxy)
[![License](https://img.shields.io/npm/l/zmxy.svg?maxAge=2592000?style=plastic)](https://github.com/bmqb/zmxy/blob/master/LICENSE)

## 接入流程

### 注册并签约

### 在芝麻信用创建App并交换公钥

与芝麻信用交换公钥的步骤：

1. 进入openssl
2. 运行`genrsa -out app_private_key.pem 1024`生成一个私钥
3. 运行`rsa -in app_private_key.pem -pubout -out app_public_key.pem`生成公钥
4. 进入芝麻信用后台，将生成的公钥 去除 **首行** / **尾行** / **换行符** 粘贴进应用的公钥一栏
5. 应用创建后，点击应用的芝麻公钥一栏，得到芝麻信用的公钥（原始格式）
6. 将其整理为RSA公钥形式, 即加入首行，尾行，以及每64字符就换行, 并保存为 zmxy_public_key.pem 

至此我们一共有三个秘钥文件，分别是：

- app_private_key.pem App私钥
- zmxy_public_key.pem 芝麻信用公钥
- app_public_key.pem App公钥(仅用于调试)

### 使用SDK

安装SDK

```
npm install zmxy --save
```

在保存秘钥的文件夹下创建`app.js`文件

``` js
const fs = require('fs');
const ZmxyClient = require('../src').default;

const zmxy = new ZmxyClient({
  appId: '123456',   //芝麻应用App ID
  appPrivateKey: fs.readFileSync(`${__dirname}/app_private_key.pem`),  //App私钥
  zmxyPublicKey: fs.readFileSync(`${__dirname}/zmxy_public_key.pem`)   //芝麻公钥
});
zmxy.verifyIvs({
  name: '张三',
  mobile: '12345678901'
}).then(({ result }) => {
  console.log(result);
}).catch((err) => {
  console.error(err);
});
```

请求成功后可以看到控制台打印芝麻信用的返回

```
{ success: true,
  biz_no: 'ZM2016102030000000XXXXXXXXX',
  ivs_detail:
   [ { code: 'PHONE_Match_Recency_Bad',
       description: '电话号码与其他信息匹配，但匹配后的信息近期不活跃' },
     { code: 'NAME_Match_Reliability_Bad',
       description: '姓名与其他信息匹配，但匹配后的信息未经认证' } ],
  ivs_score: 72 }
```

## 开启调试


由于SDK使用了[request]()， 所以可以直接在命令行中通过环境变量开启Debug模式

```
NODE_DEBUG=request node app.js
```