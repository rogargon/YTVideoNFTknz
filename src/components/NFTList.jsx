import React, {useState} from "react";
import {Card, Tooltip, Modal, Button, Alert, Space, Spin, Avatar, Comment, Row, Col, Layout} from "antd";
import {useNFTList} from "hooks/useNFTList";
import {FileSearchOutlined} from "@ant-design/icons";
import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider";
import {getExplorer, getOpensea, getOpenseaCollection} from "helpers/networks";
import {useParams} from "react-router";
import styles from "./styles";
import {Content, Footer} from "antd/es/layout/layout";
import {Link, NavLink} from "react-router-dom";

const {Meta} = Card;
const contractInfo = require("../../src/contracts/contractInfo.json");

function NFTList() {
    const contractName = "YTVideoNFT";
    const options = {};
    const {chainId} = useMoralisDapp();
    if (chainId && contractInfo[parseInt(chainId)]) {
        const networkName = Object.keys(contractInfo[parseInt(chainId)])[0];
        options.address = contractInfo[parseInt(chainId)][networkName].contracts[contractName].address;
    } else if (chainId) {
        return (<Alert message="Please, switch to one of the supported networks" type="error"/>)
    }

    const {id} = useParams();
    if (id) {
        options.searchId = id;
    }
    const {NFTList, error, isLoading} = useNFTList(options);
    const [visible, setVisibility] = useState(false);
    const [nftToDisplay, setNftToDisplay] = useState(null);

    const handleNftToDisplay = (nft) => {
        setNftToDisplay(nft);
        setVisibility(true);
    };

    console.log(NFTList);

    if (isLoading) {
        return (<Space size="middle"><Spin size="large"/></Space>)
    } else if (error) {
        return (<Alert message={error} type="error"/>)
    }

    return (
        <>
            <Layout>
                <Content style={{margin: "20px"}}>
                    <Row justify="center">
                        <Col>
                            <Comment
                                avatar={<Avatar src="https://joeschmoe.io/api/v1/random" alt="Minter"/>}
                                content={
                                    <p><Link to="/mint"><b>Mint</b></Link> trustful NFTs for your YouTube videos! And you can also trade them in <a
                                        target="_blank" href={getOpenseaCollection(chainId) + "/"}>
                                        OpenSea <img alt="Trade on Opensea" width="20px"
                                                     style={{display: "inline-block"}}
                                                     src="https://testnets.opensea.io/static/images/logos/opensea.svg"/></a>
                                    </p>
                                }
                            />
                        </Col>
                    </Row>
                    <Row justify="center">
                        <Col>
                            <div style={styles.NFTs}>{NFTList && NFTList.map((nft, index) => (
                                <Card hoverable
                                      title={<div>
                                          <p>{nft.name}</p>
                                          <small><a
                                              href={getExplorer(chainId) + "token/" + nft.token_address + "/?a=" + nft.token_id}
                                              target="_blank">{nft.token_id.slice(0, 10) + '...' + nft.token_id.slice(-10)}</a>
                                          </small>
                                      </div>}
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
                                          <iframe src={nft.youtube_url} frameBorder="0" allowFullScreen
                                                  title="YouTube Video"/>
                                      }
                                      key={index}>
                                    <Meta title={nft.metadata?.name} description={nft.metadata?.description}/>
                                </Card>
                            ))}
                            </div>
                        </Col>
                        <Modal
                            title="Metadata for Token"
                            visible={visible}
                            onCancel={() => setVisibility(false)}
                            footer={
                                <Button key="submit" type="primary" onClick={() => setVisibility(false)}>
                                    Close
                                </Button>}>
                            <small>
                                <pre>{JSON.stringify(nftToDisplay?.metadata, undefined, 3)}</pre>
                            </small>
                        </Modal>
                    </Row>
                </Content>
                <Footer />
            </Layout>
        </>
    );
}

export default NFTList;
