import React from "react";
import {useMoralis} from "react-moralis";
import {getEllipsisTxt, nftEvent, dateTime} from "../helpers/formatters";
import {getExplorer} from "../helpers/networks";
import "antd/dist/antd.css";
import {Skeleton, Table} from "antd";
import styles from "./styles";
import {useNFTTransfers} from "../hooks/useNFTTransfers";
import {useMoralisDapp} from "../providers/MoralisDappProvider/MoralisDappProvider";
import contractInfo from "../contracts/contractInfo.json";

function NFTTransfers() {
    const contractName = "YTVideoNFT";
    const options = {address: "0xcb590796c76F4B3F764575163B6f85Bf3075e5D4"};
    const { Moralis } = useMoralis();
    const {chainId} = useMoralisDapp();
    if (chainId) {
        const networkName = Object.keys(contractInfo[parseInt(chainId)])[0];
        options.token_address = contractInfo[parseInt(chainId)][networkName].contracts[contractName].address;
    }
    const {NFTTransfers} = useNFTTransfers(options);

    const columns = [
        {
            title: "Token ID",
            dataIndex: "token_id",
            key: "token_id",
            render: (token) => getEllipsisTxt(token, 8),
        },
        {
            title: "Event",
            dataIndex: "token_id",
            key: "token_id",
            render: (token, row) => nftEvent(token, row),
        },
        {
            title: "From",
            dataIndex: "from_address",
            key: "from_address",
            render: (from) => getEllipsisTxt(from, 8),
        },
        {
            title: "To",
            dataIndex: "to_address",
            key: "to_address",
            render: (to) => getEllipsisTxt(to, 8),
        },
        {
            title: "Date/Time",
            dataIndex: "block_timestamp",
            key: "block_timestamp",
            render: (date) => dateTime(date),
        },
        {
            title: "Transaction",
            dataIndex: "transaction_hash",
            key: "transaction_hash",
            render: (hash) => (
                <a
                    href={
                        `${getExplorer(chainId)}tx/${hash}`
                    }
                    target="_blank"
                    rel="noreferrer"
                >
                    View
                </a>
            ),
        },
    ];

    let key = 0;
    return (
        <div style={{width: "65vw", padding: "15px"}}>
            <h1 style={styles.title}>💸 Last YTVNFT Transfers</h1>
            <Skeleton loading={!NFTTransfers}>
                <Table
                    dataSource={NFTTransfers}
                    columns={columns}
                    rowKey={(record) => {
                        key++;
                        return `${record.transaction_hash}-${key}`;
                    }}
                />
            </Skeleton>
        </div>
    );
}

export default NFTTransfers;
