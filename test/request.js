import fs from 'fs';
import Url from 'url';
import querystring from 'querystring';
import test from 'ava';
import nock from 'nock';
import ZmxyClient from '../src/index';

let zmxyClient = {};
test.before(() => {
  zmxyClient = new ZmxyClient({
    platform: 'bmqb',
    appId: '123456',
    appPrivateKey: fs.readFileSync(`${__dirname}/_keys/app_private_key.pem`),
    zmxyPublicKey: fs.readFileSync(`${__dirname}/_keys/zmxy_public_key.pem`)
  });
});

test('Get auth url by mobile during pc', async(t) => {
  const { url, identity_type, identity_param: { mobileNo }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    mobile: '12345678901'
  });
  t.is(identity_type, '1');
  t.is(mobileNo, '12345678901');
  t.is(auth_code, 'M_MOBILE_APPPC');
  const {
    protocol,
    host,
    pathname,
    query
  } = Url.parse(url);
  t.is(protocol, 'https:');
  t.is(host, 'zmopenapi.zmxy.com.cn');
  t.is(pathname, '/openapi.do');
  const qs = querystring.parse(query);
  t.is(qs.method, 'zhima.auth.info.authorize');
});

test('Get auth url by mobile during h5', async(t) => {
  const { identity_type, identity_param: { mobileNo }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    mobile: '12345678901'
  }, 'h5');
  t.is(identity_type, '1');
  t.is(mobileNo, '12345678901');
  t.is(auth_code, 'M_H5');
});

test('Get auth url by name during pc', async(t) => {
  const { identity_type, identity_param: { name, certNo, certType }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    name: '张三',
    certNo: '111111111111111111'
  });
  t.is(identity_type, '2');
  t.is(name, '张三');
  t.is(certNo, '111111111111111111');
  t.is(certType, 'IDENTITY_CARD');
  t.is(auth_code, 'M_APPPC_CERT');
});

test('Get auth url by name during h5', async(t) => {
  const { identity_type, identity_param: { name, certNo, certType }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    name: '张三',
    certNo: '111111111111111111'
  }, 'h5');
  t.is(identity_type, '2');
  t.is(name, '张三');
  t.is(certNo, '111111111111111111');
  t.is(certType, 'IDENTITY_CARD');
  t.is(auth_code, 'M_H5');
});


test('Verify IVS', async(t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'dhoxJNEDUnFHIPol282cLnAfSHv4wg2+kezEaBLhGtMoZ/wwJys3DyghhKPx+YQ2KRUsS/EQTIZAgaTUmIwJVUARZ6Fgke/OBLU6Q2k0/qCSucp4nhQllRY0jh1GqrA+E9+TgGh7KrAkMyIifWPt4p4WfoWUevc1YSuxrhJ+CWk=',
      biz_response: 'GB5KqzUR2Op7fcvzspMBeIb2DBh9mEE7LMKXtThQrsdhwj89cW48TdDirDe+LuTOdeXdhVelpnzhQa8i3JObUu1wHkOlS1hEkzH39W7yyQRyukAkSbNAt+GzMS5oJ/2Q8xGu4ybMOxJQz3krOcj6wmbs/sBgUB7tYCqyJBj3avxHF/1DjDtRlw5B6c6olPpR06GuS6FDNc+0kdeaPg0j2yaav3sDB+g6gg2zylp79rgD/nUNV7WSTT/qiIhYc2mQ2Z51r4sG0wfwWq3YR8vGqirfG/lFKruK9cyr8L2TuuG3If8mEK5XO0LmCaoxBIH4ffAb7BAm1Nh0HnDpBjCxK+S5Al5hjfCgxRCHRK/tWcIZwGoGEEWOCejrmS8Ruma8AzB0Zkxp8VceDIj5dLM2O5T1YjI8W+tStecyBTAiioahGJhj8uu/ihEBE6HoxJqIFs7k7A9/XWs6tnmxplk4zz6R9QOubsnABPBgCjph2GAazXSUmtvWR0mCIoNVcjIJ'
    });
  const { params, request, result } = await zmxyClient.verifyIvs({
    name: '张三',
    mobile: '12345678901'
  });

  const publicKey = fs.readFileSync(`${__dirname}/_keys/app_public_key.pem`);
  t.is(request.method, 'POST');
  t.is(params.product_code, 'w1010100000000000103');
  t.is(params.name, '张三');
  t.is(params.mobile, '12345678901');
  t.truthy(params.transaction_id);
  t.is(querystring.parse(request.uri.query).method, 'zhima.credit.ivs.detail.get');
  t.true(zmxyClient.verify(zmxyClient.paramsToString(params), querystring.parse(request.uri.query).sign, publicKey));
  t.is(result.ivs_score, 89);
});

