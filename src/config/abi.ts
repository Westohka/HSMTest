export default [
    {
    "inputs": [
        {
        "internalType": "uint256",
        "name": "arg",
        "type": "uint256"
        }
    ],
    "name": "get",
    "outputs": [
        {
        "components": [
            {
            "internalType": "address",
            "name": "recoverAbi",
            "type": "address"
            },
            {
            "internalType": "address",
            "name": "recoverMsg",
            "type": "address"
            },
            {
            "internalType": "address",
            "name": "sender",
            "type": "address"
            },
            {
            "internalType": "uint8",
            "name": "v",
            "type": "uint8"
            },
            {
            "internalType": "bytes32",
            "name": "r",
            "type": "bytes32"
            },
            {
            "internalType": "bytes32",
            "name": "s",
            "type": "bytes32"
            },
            {
            "internalType": "bytes32",
            "name": "message",
            "type": "bytes32"
            }
        ],
        "internalType": "struct HSMTester.Request",
        "name": "",
        "type": "tuple"
        }
    ],
    "stateMutability": "view",
    "type": "function"
    },
    {
    "inputs": [
        {
        "internalType": "uint256",
        "name": "arg",
        "type": "uint256"
        },
        {
        "internalType": "uint8",
        "name": "v",
        "type": "uint8"
        },
        {
        "internalType": "bytes32",
        "name": "r",
        "type": "bytes32"
        },
        {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
        },
        {
        "internalType": "bytes32",
        "name": "m",
        "type": "bytes32"
        }
    ],
    "name": "set",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
    }
]