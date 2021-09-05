import Web3 from "web3";
import config from "../config";

const provider = new Web3.providers.WebsocketProvider(config.web3_provider, {
  clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000
  }
});
export const web3 = new Web3(provider)
