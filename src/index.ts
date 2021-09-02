import Web3 from 'web3';
import axios from 'axios';

import config from './config';
import abi from './config/abi.json';

import * as ethers from 'ethers';
import { getRlpSignature } from './utils/crypto';

var _a = require('ethereum-cryptography/keccak'), keccak224 = _a.keccak224, keccak384 = _a.keccak384, k256 = _a.keccak256, keccak512 = _a.keccak512;

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

const sendToHsm = async (tx_payload, payloadType, signatureAlgorithm) => {
  console.log('sendToHsm', tx_payload, payloadType, signatureAlgorithm);

  const payload = {
    signRequest: {
      payload: tx_payload,
      payloadType,
      signKeyName: 'USER-KEY-5536bee7-81c1-46ae-8b80-6db51bfb2272',
      metaData: null,
      metaDataSignature: null,
      signatureAlgorithm
    },
    requestSignature: null
  };

  const url = 'https://primusdev148.cloudshsm.com/v1/sign';
  const signRequest = await (await axios.post(url, payload)).data;

  const data = await getFromHsm(signRequest.signRequestId);
  return data.result;
}

const sendToContract = async (payload, hsmData, v_expected) => {
  let signature = Buffer.from(hsmData, 'base64');
  const v = Buffer.from([v_expected]);

  signature = getRlpSignature(signature, v);

  const splited = ethers.utils.splitSignature(signature);
  console.log('signature', splited);

  const provider = new Web3.providers.WebsocketProvider(config.web3_provider, {
    clientConfig: {
      maxReceivedFrameSize: 100000000,
      maxReceivedMessageSize: 100000000
    }
  });
  
  const web3 = new Web3(provider);

  // @ts-ignore
  const contract = new web3.eth.Contract(abi, config.contract);

  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = await contract.methods.set(123, splited.v, splited.r, splited.s, payload).estimateGas();

  const txData = await contract.methods.set(123, splited.v, splited.r, splited.s, payload).encodeABI();
  const signedTx = await web3.eth.accounts.signTransaction({
    data: txData,
    to: config.contract,
    gasPrice: web3.utils.toHex(gasPrice),
    gas: web3.utils.toHex(gasLimit)
  }, config.privateKey);

  const tx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  return tx;
}

const getFromContract = async () => {
  const provider = new Web3.providers.WebsocketProvider(config.web3_provider, {
    clientConfig: {
      maxReceivedFrameSize: 100000000,
      maxReceivedMessageSize: 100000000
    }
  });
  
  const web3 = new Web3(provider);

  // @ts-ignore
  const contract = new web3.eth.Contract(abi, config.contract);
  const data = await contract.methods.get(123).call();

  return data;
}

const init = async () => {
  const inputs = [123];
  const web3 = new Web3(null);

  const payload_1 = web3.utils.soliditySha3(...inputs);
  console.log('tx_payload', payload_1);

  let payload_2: any = Buffer.from('123');
  var prefix = Buffer.from("\u0019Ethereum Signed Message:\n" + payload_2.length.toString(), 'utf-8');
  
  payload_2 = k256(Buffer.concat([prefix, payload_2]));
  payload_2 = payload_2.toString('base64');

  console.log('tx_payload 2', payload_2);
  
  const payloadTypes = ['UNSPECIFIED', 'ETH'];
  const signatureAlgorithms = ['NONE_WITH_ECDSA']//['SHA224_WITH_RSA_PSS', 'SHA256_WITH_RSA_PSS', 'SHA384_WITH_RSA_PSS', 'SHA512_WITH_RSA_PSS', 'NONE_WITH_DSA', 'SHA224_WITH_DSA', 'SHA256_WITH_DSA', 'SHA384_WITH_DSA', 'SHA512_WITH_DSA', 'NONE_WITH_RSA', 'SHA224_WITH_RSA', 'SHA256_WITH_RSA', 'SHA384_WITH_RSA', 'SHA512_WITH_RSA', 'NONESHA224_WITH_RSA', 'NONESHA256_WITH_RSA', 'NONESHA384_WITH_RSA', 'NONESHA512_WITH_RSA', 'NONE_WITH_ECDSA', 'SHA1_WITH_ECDSA', 'SHA224_WITH_ECDSA', 'SHA256_WITH_ECDSA', 'SHA384_WITH_ECDSA', 'SHA512_WITH_ECDSA', 'SHA3224_WITH_ECDSA', 'SHA3256_WITH_ECDSA', 'SHA3384_WITH_ECDSA', 'SHA3512_WITH_ECDSA', 'EDDSA', 'KECCAK224_WITH_ECDSA', 'KECCAK256_WITH_ECDSA', 'KECCAK384_WITH_ECDSA', 'KECCAK512_WITH_ECDSA', 'ISS_KERL', 'SHA1_WITH_RSA', 'SHA1_WITH_DSA', 'NONESHA1_WITH_RSA', 'SHA1_WITH_RSA_PSS', 'BLS'];

  for (const payloadType of payloadTypes) {
    for (const signatureAlgorithm of signatureAlgorithms) {
      console.log('----------------')

      try {
        const hsmData = await sendToHsm(payload_2, payloadType, signatureAlgorithm);
        console.log('hsmData', hsmData);
  
        const tx_1 = await sendToContract(payload_1, hsmData, 27);
        console.log('tx_1', tx_1);
  
        const contractData_1 = await getFromContract();
        console.log('contractData_1', contractData_1);
  
        const tx_2 = await sendToContract(payload_1, hsmData, 28);
        console.log('tx_2', tx_2);
  
        const contractData_2 = await getFromContract();
        console.log('contractData_2', contractData_2);
      } catch(error) {
        console.log(error)
        // console.log(error.toString());
      }

      console.log('----------------')
    }
  }
}

init();