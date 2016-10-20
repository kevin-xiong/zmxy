import fs from 'fs';
import test from 'ava';
import ZmxyClient from '../src/index';

let zmxyClient = {};
test.before(() => {
  zmxyClient = new ZmxyClient({
    platform: 'bmqb',
    appId: '123456',
    appPrivateKey: fs.readFileSync(`${__dirname}/_keys/app_private_key.pem`),
    zmxyPublicKey:  fs.readFileSync(`${__dirname}/_keys/app_public_key.pem`)
  });
});

test('Sign', async(t) => {
  t.is(zmxyClient.sign('foo'), 'JYC1r0RsZ2uLFBQ9nYcbvFYM8UZp8L/fIj4MHsJ4d3NpbroiquAbcKHOZsHHKDUR9+uscyn0vNPZnsF4TyKBjgHdjjzzBnukzyJOJ7azczc0Yn8hW/vgznsSQL0hGDWfDppW1L6Ve9Gtoqp5VYbnT8y5PXBoVoGJQFv4nb2GS3I=');
});

test('Verify sign', async(t) => {
  t.is(true, zmxyClient.verify('foo', 'JYC1r0RsZ2uLFBQ9nYcbvFYM8UZp8L/fIj4MHsJ4d3NpbroiquAbcKHOZsHHKDUR9+uscyn0vNPZnsF4TyKBjgHdjjzzBnukzyJOJ7azczc0Yn8hW/vgznsSQL0hGDWfDppW1L6Ve9Gtoqp5VYbnT8y5PXBoVoGJQFv4nb2GS3I='));
});

test('Params to string', async(t) => {
  t.is(zmxyClient.paramsToString({
    name: '中文',
    mobile: 1,
    product_code: 'w1010100000000000103',
    transaction_id: null
  }), 'mobile=1&name=%E4%B8%AD%E6%96%87&product_code=w1010100000000000103');
});


test('Decrypt', async(t) => {
  t.is(zmxyClient.decrypt(
    'CjD42qmf7kWZrsAOXrsZC4JMP/EijduJae88zriT1tE1FmX+nYNIbNRqXCPsJ/vytHIkGEv0cCdj//aDW3jyuWvHv7IAOx4auPptxu5XNVlQVL2V4RrM70Tgp2njSHFmFfaeWd5KgNxg5km5kHGbUv7xY0iBeUdQiAysaGXB6BTgXJBKQO391YWzzkWpKpWLXrK1QIjyxCCiqMIrsoLoz0UCxgIQTj5MuDObeP0cHGqUEJJeCj8BoYehOlhCwptei+oBWSKkVwGXdWeEmwfA+T/O2yF2nqQuyeYxtICIGvt3ZXO3EwfPaNpRKnytiB/Gewelr8tX2mGjlNC1+eTVtzdTRID8G169hzWvD+Car4mem0jRFBMl1B+CZRsAix4HpMHPPF3SeUmDnaXZNj9NGnuusAVMWI2kb2hb9YiPmfVk2kPGQdd71wneaR+m2s31kfM1utkZJxl4MLyjkJ2SL2aQUT8VQDG51Yk+Hf6P+DWLMEZc/GG+Cu3yjIYy4J47'
    ), 'hello world'
  );
});

test('Encrypt', async(t) => {
  t.is(zmxyClient.decrypt(zmxyClient.encrypt('hello world', 128)), 'hello world');
});

