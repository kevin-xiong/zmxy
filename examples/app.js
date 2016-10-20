const ZmxyClient = require('../lib');

const zmxy = new ZmxyClient({
    platform: 'bmqb',  //接入商户名
    appId: '123456',   //芝麻应用App ID
    appPrivateKey: fs.readFileSync(`${__dirname}/app_private_key.pem`),  //App私钥
    zmxyPublicKey: fs.readFileSync(`${__dirname}/zmxy_public_key.pem`)   //芝麻公钥
});
zmxy.verifyIvs({
    name: '张三',
    mobile: '12345678901'
}).then((result) => {
    console.log(result);
});