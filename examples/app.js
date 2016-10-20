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
}).then((res) => {
  console.log(res.result);
}).catch((err) => {
  console.error(err);
});