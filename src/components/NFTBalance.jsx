import React, {useState} from "react";
import {Card, Alert, Tooltip, Modal, Input, Button, Space, Spin} from "antd";
import {useNFTBalance} from "hooks/useNFTBalance";
import {FileSearchOutlined, ShoppingCartOutlined} from "@ant-design/icons";
import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider";
import {getExplorer, getOpensea} from "helpers/networks";
import {useMoralis} from "react-moralis";
const contractInfo = require("../../src/contracts/contractInfo.json");

const {Meta} = Card;

const styles = {
    NFTs: {
        display: "flex",
        flexWrap: "wrap",
        WebkitBoxPack: "start",
        justifyContent: "flex-start",
        margin: "0 auto",
        maxWidth: "1000px",
        gap: "10px",
    },
    center: {
        display: "block",
        marginLeft: "auto",
        marginRight: "auto",
    }
};

function NFTBalance() {
    const contractName = "YTVideoNFT";
    const options = {};
    const {chainId} = useMoralisDapp();
    if (chainId && contractInfo[parseInt(chainId)]) {
        const networkName = Object.keys(contractInfo[parseInt(chainId)])[0];
        options.token_address = contractInfo[parseInt(chainId)][networkName].contracts[contractName].address;
    } else if (chainId) {
        return (<Alert message="Please, switch to one of the supported networks" type="error" />)
    }

    const {isAuthenticated} = useMoralis();
    if (!isAuthenticated) {
        return (<Alert message="Authenticate to see your YTVNFTs or mint them..." type="warning" />)
    }

    const {NFTBalance, error, isLoading} = useNFTBalance(options);
    const [visible, setVisibility] = useState(false);
    const [nftToDisplay, setNftToDisplay] = useState(null);

    const handleNftToDisplay = (nft) => {
        setNftToDisplay(nft);
        setVisibility(true);
    };

    console.log(NFTBalance);

    if (isLoading) { return ( <Space size="middle"><Spin size="large" /></Space>) }
    else if (error) { return (<Alert message={error} type="error" />) }
    else if (!NFTBalance.length) {
        return (<Alert message="You don't own any YTVNFT" type="warning" />)
    }
    return (
        <>
            <div style={styles.NFTs}>{NFTBalance && NFTBalance.map((nft, index) => (
                <Card hoverable
                      title={ <div>
                          <p>{nft.name}</p>
                          <small><a href={getExplorer(chainId)+"token/"+nft.token_address+"/?a="+nft.token_id}
                                    target="_blank">{nft.token_id.slice(0, 10)+'...'+nft.token_id.slice(-10)}</a>
                          </small>
                      </div> }
                      actions={[
                        <Tooltip title="Token metadata">
                            <FileSearchOutlined onClick={() => handleNftToDisplay(nft)}/>
                        </Tooltip>,
                        <Tooltip title="Trade on OpenSea">
                            <a target="_blank"
                               href={getOpensea(chainId) + nft.token_address + "/" +
                               nft.token_id}>
                                <img alt="Trade on Opensea" width="20px" style={styles.center}
                                     src="https://testnets.opensea.io/static/images/logos/opensea.svg"/></a>
                        </Tooltip>,
                    ]}
                    style={{width: 300, border: "2px solid #e7eaf3"}}
                    cover={
                        <iframe src={nft.youtube_url} frameBorder="0" allowFullScreen title="YouTube Video"/>
                    }
                    key={index}>
                    <Meta title={nft.metadata?.name} description={nft.metadata?.description}/>
                </Card>
            ))}
            </div>
            <Modal
                title = "Metadata for Token"
                visible={visible}
                onCancel={() => setVisibility(false)}
                footer={
                    <Button key="submit" type="primary" onClick={() => setVisibility(false)}>
                        Close
                    </Button>}>
                <small><pre>{JSON.stringify(nftToDisplay?.metadata, undefined, 3)}</pre></small>
            </Modal>
        </>
    );
}

export default NFTBalance;
