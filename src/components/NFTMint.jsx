import {Button, Input, Typography, Form, Alert, Steps, Checkbox, Tooltip, Card, Modal} from "antd";
import React, {useEffect, useState} from "react";
import contractInfo from "contracts/contractInfo.json";
import {useMoralis, useMoralisSubscription} from "react-moralis";
import {useMoralisDapp} from "../providers/MoralisDappProvider/MoralisDappProvider";
import TextArea from "antd/es/input/TextArea";
import {NFTMetadata} from "../helpers/nft-metadata";
import {NFTStorage, Blob} from 'nft.storage'
import {LoadingOutlined, SmileOutlined} from "@ant-design/icons";
import {getExplorer} from "../helpers/networks";
import styles from "./styles";
import axios from "axios";
const {Meta} = Card;
const {Step} = Steps;
const {Text} = Typography;

const NFT_STORAGE_API_KEY = process.env.REACT_APP_NFT_STORAGE
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY

export default function NFTMint() {
    const {Moralis} = useMoralis();
    const {isAuthenticated} = useMoralis();
    const {chainId, walletAddress} = useMoralisDapp();
    const contractName = "YTVideoNFT";
    let networkName, contract, options;

    if (chainId && contractInfo[parseInt(chainId)]) {
        networkName = Object.keys(contractInfo[parseInt(chainId)])[0];
        contract = contractInfo[parseInt(chainId)][networkName].contracts[contractName];
        options = {
            contractAddress: contract.address,
            abi: contract.abi
        };
    } else if (chainId) {
        return (<Alert message="Please, switch to one of the supported networks" type="error"/>)
    }

    if (!isAuthenticated) {
        return ( <Alert message="Authenticate to be able to mint NFTs" type="warning" /> )
    }

    const [videoId, setVideoId] = useState("");
    const [videoNotFound, setVideoNotFount] = useState(true);
    const [videoTitle, setVideoTitle] = useState("");
    const [tokenId, setTokenId] = useState({});
    const [edited, setEdited] = useState(false);
    const [current, setCurrent] = useState(0);
    const [metadata, setMetadata] = useState("");
    const [alerts, setAlerts] = useState([]);
    const [minted, setMinted] = useState(false);
    const [formCheckVideoId] = Form.useForm();
    const [formValidateVideo] = Form.useForm();

    useMoralisSubscription("VerificationRequest", q => q, [], {
        onCreate: data => {
            console.log("VerificationRequest:", data)
            openNotification({
                type: "info",
                message: "🔊 Verification Request",
                description: `Verifying ownership of YouTube video ${data.attributes.videoId}, takes about 1 minute...`,
            });
        },
    });

    useMoralisSubscription("YouTubeVideoVerification", q => q, [], {
        onCreate: data => {
            console.log("YouTubeVideoVerification:", data)
            openNotification({
                type: data.attributes.isVerified ? "success" : "error",
                message: "🔊 Verification Result",
                description: data.attributes.isVerified ?
                    (<span>Video {data.attributes.videoId} ownership verified, NFT being minted...</span>) :
                    (<span>Video {data.attributes.videoId} ownership couldn't be verified. Please, check that the
                        required text has been added to the description on YouTube and try again</span>),
            });
        },
    });

    useMoralisSubscription("YTVNFTMinted", q => q, [], {
        onCreate: data => {
            console.log("YTVNFTMinted:", data)
            const nft = { name: 'YouTube Video NFT', token_address: data.attributes.address,
                token_id: data.attributes.tokenId, metadata: JSON.parse(metadata) }
            if (nft.metadata?.youtube_url && nft.metadata?.youtube_url.indexOf('youtube.com') > 0) {
                nft.youtube_url = nft.metadata.youtube_url.replace('watch?v=', 'embed/')
            }
            nft.image = nft.metadata?.image;
            console.log("NFT:", nft)
            openNotification({
                type: "success",
                message: "🔊 NFT Minted",
                description:
                    (<div>
                        <Card hoverable
                           title={ <div>
                               <p>{nft.name}</p>
                               <small><a href={getExplorer(chainId)+"token/"+nft.token_address+"/?a="+nft.token_id}
                                         target="_blank">{nft.token_id.slice(0, 10)+'...'+nft.token_id.slice(-10)}</a>
                               </small>
                           </div> }
                           actions={[
                               <Tooltip title="Trade on OpenSea">
                                   <a target="_blank"
                                      href={"https://testnets.opensea.io/assets/" + nft.token_address + "/" +
                                      nft.token_id}>
                                       <img alt="Trade on Opensea" width="20px" style={styles.center}
                                            src="https://testnets.opensea.io/static/images/logos/opensea.svg"/></a>
                               </Tooltip>,
                           ]}
                           style={{width: 300, border: "2px solid #e7eaf3"}}
                           cover={
                               <iframe src={nft.youtube_url} frameBorder="0" allowFullScreen title="YouTube Video"/>
                           }
                           >
                           <Meta title={nft.metadata?.name} description={nft.metadata?.description}/>
                        </Card>
                        <Text>
                            Please, note that it might take some minutes for the NFT
                            to appear in your wallet or in OpenSea.</Text>
                    </div>),
            });
            setMinted(true)
        },
    });

    const openNotification = ({type, message, description}) => {
        setAlerts(alerts.concat({ key: alerts.length + 1, type, message, description }))
    };

    const checkVideoId = async () => {
        const tokenId = await Moralis.executeFunction({
            functionName: "generateTokenId",
            params: {videoId},
            ...options
        });
        setTokenId({"videoTokenId": tokenId.videoTokenId, "videoEditionTokenId": tokenId.tokenId})
        setCurrent(current + 1)
    };

    const copyText = () => {
        console.log(formValidateVideo.getFieldsValue())
        navigator.clipboard.writeText(formValidateVideo.getFieldValue("descriptionText"))
    };

    const onCheckboxChange = (e) => { setEdited(e.target.checked); };

    const validateVideo = async () => {
        setCurrent(current + 1)
        const metadata = NFTMetadata(walletAddress, videoId, videoTitle, tokenId.videoTokenId, tokenId.videoEditionTokenId)
        setMetadata(metadata)
        console.log("NFT metadata:\n" + metadata)
        openNotification({
            type: "info",
            message: "📃 Uploading NFT Metadata",
            description: ""
        });
        const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });
        const cid = await client.storeBlob(new Blob([metadata]));
        openNotification({
            type: "info",
            message: "📃 NFT Metadata Uploaded",
            description: `IPFS metadata hash: ${cid}`
        });
        const tx = await Moralis.executeFunction({ functionName: "mint",
            params: { videoId: videoId, metadataHash: cid }, awaitReceipt: false, ...options});
        tx.on("transactionHash", (hash) => {
            openNotification({
                message: "🔊 Transaction Submitted",
                description: (<a href={"https://rinkeby.etherscan.io/tx/"+hash}
                                 target="_blank">{hash}</a>),
            });
            console.log("🔊 Transaction Submitted", hash);
        })
            .on("receipt", (receipt) => {
                openNotification({
                    type: "info",
                    message: "📃 Transaction Accepted",
                    description: (<a href={"https://rinkeby.etherscan.io/tx/"+receipt.transactionHash}
                                     target="_blank">{receipt.transactionHash}</a>),
                });
                console.log("🔊 New Receipt: ", receipt);
            })
            .on("error", (error) => {
                openNotification({
                    type: "error",
                    message: "📃 Transaction Error",
                    description: error.message
                });
                console.log(error);
            });
    };

    useEffect(() => {
        const fetchData = async () => {
            const results = await axios(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
            );
            if (results.data.items?.length >0) {
                setVideoTitle(results.data.items[0].snippet.title)
                setVideoNotFount(false)
            } else {
                setVideoNotFount(true)
                setVideoTitle("Error, video not found")
            }
        }
        if (videoId) {
            fetchData();
        }
    }, [videoId])

    return (
        <div style={{width: 500, margin: "40px auto"}}>
            <Steps current={current}>
                <Step key={0} title="Input video"/>
                <Step key={1} title="Validation"/>
                <Step key={2} title="NFT minting" icon={minted ? <SmileOutlined /> : <LoadingOutlined />}/>
            </Steps>
            <div style={{margin: "50px 10px"}}>
                {current === 0 && (
                    <Form form={formCheckVideoId}
                        name="check-videoid"
                        layout={"horizontal"}>
                        <Form.Item name="videoId" label="YouTube Video Identifier" required
                                   tooltip='11 letters and numbers, including characters "-" and "_"'
                                   rules={[{
                                       pattern: new RegExp("^[a-zA-Z0-9_-]{11}$"),
                                       message: 'Should be 11 letters and numbers, including "-" and "_"',
                                   }]}>
                            <Input onChange={(e) => {
                                if (e.target.value.match("^[a-zA-Z0-9_-]{11}$")) {
                                    setVideoId(e.target.value)
                                } else {
                                    setVideoTitle("")
                                }
                            }}/>
                        </Form.Item>
                        <Form.Item name="videoTitle" label="YouTube Video Title" required>
                            <Text>{videoTitle}</Text>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" disabled={videoNotFound} onClick={checkVideoId}>Next</Button>
                        </Form.Item>
                    </Form>
                )}
                {current === 1 && (
                    <Form form={formValidateVideo}
                          name="validate-video"
                          initialValues={{
                              "descriptionText":
                                  "Tokenized at https://ytvideonft.rhizomik.net/nfts/"+tokenId.videoTokenId }}
                          layout={"horizontal"}
                    >
                        <Form.Item>
                            <Text>To validate that you are the owner of the YouTube video to be tokenized, please, add
                                a link to the NFT to be minted to the description of the video: </Text>
                        </Form.Item>
                        <Form.Item name="descriptionText">
                            <TextArea />
                        </Form.Item>
                        <Form.Item>
                            <Button type="default" onClick={copyText}>Copy</Button>
                        </Form.Item>
                        <Form.Item>
                            <Text>Follow this link to edit the description of the video and paste the link so it is part
                                of the description of the video (only if not already done):</Text>
                        </Form.Item>
                        <Form.Item>
                            <Button type="default" href={"https://studio.youtube.com/video/"+videoId+"/edit"}
                                    target="_blank">Edit {videoId}</Button>
                        </Form.Item>
                        <Form.Item>
                            <Checkbox checked={edited} onChange={onCheckboxChange}>
                                The YouTube video description has been already edited to include a link to the video
                                NFT token identifier
                            </Checkbox>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" disabled={!edited} onClick={validateVideo}>Next</Button>
                        </Form.Item>
                    </Form>
                )}
                {current === 2 && (
                    <div>
                        <Text style={{marginBottom: "20px"}} >Requesting YouTube video {videoId} ownership verification
                            to mint NFT {tokenId.videoEditionTokenId}...
                        </Text>
                        { alerts.map(alert => {
                            return (
                                <Alert key={alert.key} style={{marginBottom: "10px"}} showIcon type={alert.type}
                                       message={alert.message} description={alert.description} />)
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
