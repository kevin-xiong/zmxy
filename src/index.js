import querystring from 'querystring';
import request from 'request-promise';
import crypto from 'crypto';

const constants = parseInt(process.versions.node, 10) <= 4 ? require('constants') : crypto.constants;

const random = (len = 16) => {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  let str = '';
  for (let i = 0; i < len; i += 1) {
    const rand = Math.floor(Math.random() * digits.length);
    if (rand !== 0 || str.length > 0) {
      str += digits[rand];
    }
  }
  return str;
};

/**
 * Zhima Credit Client
 */
export default class ZmxyClient {
  version = '1.0'; //不能更改
  url = 'https://zmopenapi.zmxy.com.cn/openapi.do';  //没有测试环境，无法更改
  charset = 'UTF-8';
  platform = 'zmop'; //不能更改，更改后会报 ZMOP.invalid_platform_param
  appId = null; //芝麻App ID
  appPrivateKey = null; //App私钥
  zmxyPublicKey = null; //芝麻公钥
  randomFunc = null; //随机字符串算法
  options = {};

  /**
   * @param client
   * @param appId
   * @param appPrivateKey
   * @param zmxyPublicKey
   * @param randomFunc
   */
  constructor({
    client,
    appId,
    appPrivateKey,
    zmxyPublicKey,
    randomFunc
  }) {
    this.client = client || request;
    this.appId = appId;
    this.appPrivateKey = appPrivateKey;
    this.zmxyPublicKey = zmxyPublicKey;
    this.randomFunc = randomFunc || random;
    this.setOptions({});
  }

  /**
   * @param {String} key
   * @returns {ZmxyClient}
   */
  setAppPrivateKey(key) {
    this.appPrivateKey = key;
    return this;
  }

  /**
   * @param {String} key
   * @returns {ZmxyClient}
   */
  setZmxyPublicKey(key) {
    this.zmxyPublicKey = key;
    return this;
  }

  /**
   * @param {Object} options
   * @returns {ZmxyClient}
   */
  setOptions(options) {
    this.options = Object.assign({
      version: this.version,
      platform: this.platform,
      channel: 'apppc',
      charset: this.charset,
      app_id: this.appId
    }, options);
    return this;
  }

  /**
   * 反欺诈信息验证
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.ivs.detail.get@1.0@1.2&relType=API_DOC&type=API_INFO_DOC&LEFT_MENU_MODEnull
   * @param params
   * @returns {{params, request, response, result}|*}
   */
  async verifyIvs(params) {
    return await this.request('zhima.credit.ivs.detail.get',
      Object.assign({
        product_code: 'w1010100000000000103',
        transaction_id: this.randomFunc(32)
      }, params)
    );
  }

  /**
   * 行业黑名单验证
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.watchlistii.get@1.0@1.0&relType=API_DOC&type=API_INFO_DOC&LEFT_MENU_MODE=null
   * @param openId
   * @param transactionId
   * @returns {{params, request, response, result}|*}
   */
  async verifyWatchlist(openId, transactionId) {
    return await this.request('zhima.credit.watchlist.get', {
      product_code: 'w1010100100000000022',
      transaction_id: transactionId || this.randomFunc(32),
      open_id: openId
    });
  }

  /**
   * 获得芝麻信用评分
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.score.get@1.0@1.4&relType=API_DOC&type=API_INFO_DOC&LEFT_MENU_MODEnull
   * @param openId
   * @param transactionId
   * @returns {{params, request, response, result}|*}
   */
  async getCreditScore(openId, transactionId) {
    return await this.request('zhima.credit.score.get', {
      product_code: 'w1010100100000000001',
      transaction_id: transactionId || this.randomFunc(32),
      open_id: openId
    });
  }

  /**
   * 获取鉴权URL
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?id=67
   * @param name
   * @param mobile
   * @param certNo
   * @param state
   * @param _authBy 鉴权方式： PC | H5
   */
  getAuthorizeUrl({
    name,
    mobile,
    certNo,
    state
  }, _authBy = 'pc') {
    const identityParam = certNo ? {
      name,
      certNo,
      certType: 'IDENTITY_CARD'
    } : {
      mobileNo: mobile
    };
    const identityType = certNo ? '2' : '1';

    //Auth code 由用户终端(PC端或移动端)以及验证方式(验证身份证或手机号)共同决定
    const authCodes = {
      pc_1: 'M_MOBILE_APPPC',
      pc_2: 'M_APPPC_CERT',
      h5_1: 'M_H5',
      h5_2: 'M_H5'
    };
    let authBy = _authBy.toLowerCase();
    if (!['pc', 'h5', 'sdk'].includes(authBy)) {
      authBy = 'pc';
    }
    const authCode = authCodes[`${authBy}_${identityType}`];
    const channels = {
      pc: 'apppc',
      h5: 'app'
    };
    const channel = channels[authBy];

    const bizParams = {
      auth_code: authCode,
      state
    };
    const paramsString = this.paramsToString({
      identity_type: identityType,
      identity_param: JSON.stringify(identityParam),
      biz_params: JSON.stringify(bizParams)
    });
    const sign = this.sign(paramsString);
    const query = Object.assign({
      method: 'zhima.auth.info.authorize',
      params: this.encrypt(paramsString),
      sign
    }, this.options, { channel });
    return {
      identity_type: identityType,
      identity_param: identityParam,
      biz_params: bizParams,
      url: `${this.url}?${querystring.stringify(query)}`
    };
  }

  /**
   * 根据Callback参数获得OpenId对象
   * @param {String} callbackString
   * @returns {Object}
   */
  getOpenId(callbackString) {
    return this.stringToParams(this.decrypt(callbackString));
  }

  /**
   * 公钥加密
   * @param {String} text
   * @param {Number} blockSize
   * @param {String} publicKey
   * @returns {String}
   */
  encrypt(text, blockSize = 128, publicKey = this.zmxyPublicKey) {
    const padding = 11;
    const chunkSize = blockSize - padding;
    const inputBuffer = new Buffer(text);
    const chunksCount = Math.ceil(inputBuffer.length / (chunkSize));
    const outputBuffer = new Buffer(chunksCount * blockSize);
    for (let i = 0; i < chunksCount; i += 1) {
      const currentBlock = inputBuffer.slice(chunkSize * i, chunkSize * (i + 1));
      const encryptedChunk = crypto.publicEncrypt({
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING
      }, currentBlock);
      encryptedChunk.copy(outputBuffer, i * blockSize);
    }
    return outputBuffer.toString('base64');
  }

  /**
   * 私钥解密
   * @param {String} encrypted
   * @param {String} privateKey
   * @returns {String}
   */
  decrypt(encrypted, privateKey = this.appPrivateKey) {
    const chunkSize = 128;
    const decodedBuffer = new Buffer(encrypted, 'base64');
    const chunksCount = Math.ceil(decodedBuffer.length / (chunkSize));
    const outputBuffer = new Buffer(chunksCount * chunkSize);
    let totalLength = 0;
    for (let i = 0; i < chunksCount; i += 1) {
      const currentBlock = decodedBuffer.slice(
        chunkSize * i, Math.min(chunkSize * (i + 1), decodedBuffer.length));
      const decryptedBuf = crypto.privateDecrypt({
        key: privateKey,
        padding: constants.RSA_PKCS1_PADDING
      }, currentBlock);

      decryptedBuf.copy(outputBuffer, totalLength);
      totalLength += decryptedBuf.length;
    }
    return outputBuffer.slice(0, totalLength).toString();
  }

  /**
   * 字符串转换为业务参数
   * @param paramsString
   */
  stringToParams(paramsString) {
    return querystring.parse(paramsString);
  }

  /**
   * 业务参数转换为字符串
   * @param {Object} params
   * @returns {string}
   */
  paramsToString(params) {
    const sortedParams = Object.keys(params).sort().reduce((r, k) => (r[k] = params[k], r), {});
    return Object.entries(sortedParams)
      .filter(([, value]) => ![null, ''].includes(value))
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * 对字符串生成签名
   * @param {String} input
   * @param {String} key
   * @returns {String}
   */
  sign(input, key = this.appPrivateKey) {
    return crypto.createSign('RSA-SHA1').update(input, 'utf8').sign(key, 'base64');
  }

  /**
   * 验证签名
   * @param {String} expected
   * @param {String} sign
   * @param {String} key
   * @returns {Boolean}
   */
  verify(expected, sign, key = this.zmxyPublicKey) {
    return crypto.createVerify('RSA-SHA1').update(expected, 'utf8').verify(key, sign, 'base64');
  }

  /**
   * 发起一个API请求
   * @param {String} service
   * @param {Object} params
   * @returns {{params: *, request, response: *, result: *}}
   */
  async request(service, params) {
    const paramsString = this.paramsToString(params);
    const sign = this.sign(paramsString);
    const requestParams = {
      method: 'POST',
      url: this.url,
      qs: Object.assign({ method: service, sign }, this.options),
      form: {
        params: this.encrypt(paramsString)
      },
      json: true,
      resolveWithFullResponse: true
    };
    const response = await this.client(requestParams);
    const {
      request,
      body
    } = response;
    const {
      encrypted,
      biz_response:result
    } = body;
    return {
      params,
      request,
      response,
      result: encrypted ? JSON.parse(this.decrypt(result)) : result
    };
  }
}
