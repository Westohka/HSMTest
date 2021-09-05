import {web3} from "./utils/web3";
import axios from 'axios';
import * as rlp from 'rlp'

import config from './config';
import abi from './config/abi';
//@ts-ignore
const contract = new web3.eth.Contract(abi, config.contract);
const url = 'https://primusdev148.cloudshsm.com/v1/sign';
import {getRlpSignature, getRSFromSignature, calculateV} from './utils/crypto';
import {Transaction} from 'ethereumjs-tx';


const TX_PAYLOAD = '123';

const TxOptions = {chain: `rinkeby`, hardfork: 'petersburg'}
const vDefaultValue1 = '0x2b';
const vDefaultValue2 = '0x2c';

let _a = require('ethereum-cryptography/keccak'), keccak224 = _a.keccak224, keccak384 = _a.keccak384, k256 = _a.keccak256, keccak512 = _a.keccak512;

const getFromHsm = async (signRequestId) => {
  const response: any = await new Promise(async (resolve, reject) => {
    const check = async () => {
      const url = `https://primusdev148.cloudshsm.com/v1/request/${signRequestId}`;
      const data = await (await axios.get(url)).data;

      if (data.status === 'EXECUTED') {
        resolve(data);
      } else {
        setTimeout(check, 1000);
      }
    }

    check();
  });

  return response;
}

const encodeData = (inputs,method = 'set') => {
  return contract.methods[method](...inputs).encodeABI();
}

const encodeSha3Data = (inputs) => {
  return web3.utils.soliditySha3(...inputs);
}

const preparePayload = async (inputs, address) => {
  const gasPrice = await web3.eth.getGasPrice();
  console.log(inputs)
  const gasLimit = await contract.methods.set(...inputs).estimateGas();
  return {
    nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address)),
    gasPrice: web3.utils.toHex(gasPrice),
    gasLimit: web3.utils.toHex(gasLimit),
    to: config.contract,
    value: '0x0',
    data: encodeSha3Data(inputs),
    v: vDefaultValue1,
    r: '0x0',
    s: '0x0',
  };
}

const sendToHsm = async (tx_payload, payloadType, signatureAlgorithm) => {
  // console.log('sendToHsm', tx_payload, payloadType, signatureAlgorithm);

  const payload = {
    signRequest: {
      payload: tx_payload,
      payloadType,
      signKeyName: config.key_name,
      metaData: null,
      metaDataSignature: null,
      signatureAlgorithm
    },
    requestSignature: null
  };

  const signRequest = await (await axios.post(url, payload)).data;

  const data = await getFromHsm(signRequest.signRequestId);
  return data.result;
}
const getFromContract = async () => {
  const data = await contract.methods.get(TX_PAYLOAD).call();

  return data;
}


const init = async () => {
  let inputs: any =
    [
      TX_PAYLOAD,
      '0x2b',
      '0x7b997e422d6944bb80a0dc5322ffd4898c75560b0e41ff329aad9830822bd45f',
      '0x7fd5c545969717c3757f644bd571b23dc28fd8aea6eb4833e5f9b2be230285fc',
      '0xfe69b67d939f27c66c91b2b7e9769b2cd42dae18a2492dff3cc132c20d02678c'
    ];
  console.log(inputs)
  // const payload2 = await preparePayload(inputs,config.address)
  let payload = web3.utils.soliditySha3(...inputs);
  const gasLimit = 68704;
  const gasPrice = await web3.eth.getGasPrice();
  const p1 = {
    nonce: web3.utils.toHex(await web3.eth.getTransactionCount(config.address)),
    gasPrice: web3.utils.toHex(gasPrice),
    gasLimit: web3.utils.toHex(gasLimit),
    to: config.contract,
    value: '0x0',
    data: encodeSha3Data(inputs),
    v:vDefaultValue1
  };
  const txx = new Transaction(p1, TxOptions)
  payload = `0x${txx.hash(false).toString('hex')}`;
  // const payload = await preparePayload(inputs, config.address);
  // let payload: any = web3.eth.accounts.hashMessage(inputs);
  let payload1 = Buffer.from(payload.replace('0x',''), 'hex').toString('base64')
  // const hashedTX = new Transaction(payload, TxOptions).hash(false).toString('hex')
  console.log(payload);

  const payloadTypes = ['ETH'];
  const signatureAlgorithms = ['NONE_WITH_ECDSA']//['SHA224_WITH_RSA_PSS', 'SHA256_WITH_RSA_PSS', 'SHA384_WITH_RSA_PSS', 'SHA512_WITH_RSA_PSS', 'NONE_WITH_DSA', 'SHA224_WITH_DSA', 'SHA256_WITH_DSA', 'SHA384_WITH_DSA', 'SHA512_WITH_DSA', 'NONE_WITH_RSA', 'SHA224_WITH_RSA', 'SHA256_WITH_RSA', 'SHA384_WITH_RSA', 'SHA512_WITH_RSA', 'NONESHA224_WITH_RSA', 'NONESHA256_WITH_RSA', 'NONESHA384_WITH_RSA', 'NONESHA512_WITH_RSA', 'NONE_WITH_ECDSA', 'SHA1_WITH_ECDSA', 'SHA224_WITH_ECDSA', 'SHA256_WITH_ECDSA', 'SHA384_WITH_ECDSA', 'SHA512_WITH_ECDSA', 'SHA3224_WITH_ECDSA', 'SHA3256_WITH_ECDSA', 'SHA3384_WITH_ECDSA', 'SHA3512_WITH_ECDSA', 'EDDSA', 'KECCAK224_WITH_ECDSA', 'KECCAK256_WITH_ECDSA', 'KECCAK384_WITH_ECDSA', 'KECCAK512_WITH_ECDSA', 'ISS_KERL', 'SHA1_WITH_RSA', 'SHA1_WITH_DSA', 'NONESHA1_WITH_RSA', 'SHA1_WITH_RSA_PSS', 'BLS'];

  for (const payloadType of payloadTypes) {
    for (const signatureAlgorithm of signatureAlgorithms) {
      const hsmData = await sendToHsm(payload1, payloadType, signatureAlgorithm);
      console.log(hsmData);
      let signature: any = Buffer.from(hsmData, 'base64');
      const v: any = Buffer.from(vDefaultValue1.replace('0x', ''),'hex');

      signature = getRSFromSignature(signature);
      // const result = web3.eth.accounts.recover(payload, `0x${signature.toString('hex')}`);
      let V = vDefaultValue1
      const result = web3.eth.accounts.recover(payload, vDefaultValue1,`0x${signature.R.toString('hex')}`, `0x${signature.S.toString('hex')}`, true);
      const result2 = web3.eth.accounts.recover(payload, vDefaultValue2,`0x${signature.R.toString('hex')}`, `0x${signature.S.toString('hex')}`, true);
      if(result2 === config.address){
        V = vDefaultValue2
      }
      console.log('kul4',result);
      console.log('kul42',result2);

      // payload.r = signature.R;
      // payload.s = signature.S;
      // inputs[4] = payload
      // inputs[1] = V
      // inputs[2] = `0x${signature.R.toString('hex')}`
      // inputs[3] = `0x${signature.S.toString('hex')}`

      console.log(inputs)
      // const gasLimit = await contract.methods.set(...inputs).estimateGas();
      const gasLimit = 68704;
      const p2 = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(config.address)),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasLimit),
        to: config.contract,
        value: '0x0',
        data: encodeSha3Data(inputs),
        v:V,
        r:`0x${signature.R.toString('hex')}`,
        s:`0x${signature.S.toString('hex')}`
      };


      console.log(p2)
      let _tx = new Transaction(p2, TxOptions);

      console.log('АДРЕС',`0x${_tx.getSenderAddress().toString('hex')}`)
      // console.log('ADDRESSES is not compared', web3.utils.toChecksumAddress(_tx.getSenderAddress().toString('hex')) !== web3.utils.toChecksumAddress(config.address))
      // if (web3.utils.toChecksumAddress(_tx.getSenderAddress().toString('hex')) !== web3.utils.toChecksumAddress(config.address)) {
      //   let v = Buffer.from([calculateV(_tx.getChainId(), 0)]);
      //   if (!v.compare(_tx.raw[6])) {
      //     v = Buffer.from([calculateV(_tx.getChainId(), 1)]);
      //   }
      //   payload.v = `0x${v.toString('hex')}`
      //   _tx = new Transaction(payload, TxOptions);
      // }
      // console.log('АДРЕС2',`0x${_tx.getSenderAddress().toString('hex')}`)
      _tx
      const zzzz = _tx.serialize().toString('hex');
      const execResult = await web3.eth.sendSignedTransaction(`0x${zzzz}`)
      console.log('execResult', execResult)
      const x = await getFromContract()
      console.log('pending', x)
    }
  }
}

init();
