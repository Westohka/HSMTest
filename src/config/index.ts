import { config } from 'dotenv';

config();

export default {
  web3_provider: process.env.WEB3_PROVIDER,
  privateKey: process.env.PRIVATE_KEY,
  contract: process.env.CONTRACT,
  address: process.env.KEY_ADDRESS,
  key_name: process.env.KEY_NAME
};
