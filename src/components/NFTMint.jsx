import {Button, Input, Typography, Form, Alert, Steps, Checkbox} from "antd";
import React, {useState} from "react";
import contractInfo from "contracts/contractInfo.json";
import {useMoralis, useMoralisSubscription} from "react-moralis";
import {useMoralisDapp} from "../providers/MoralisDappProvider/MoralisDappProvider";
import TextArea from "antd/es/input/TextArea";
import {NFTMetadata} from "../helpers/nft-metadata";
import {NFTStorage, Blob} from 'nft.storage'
import {LoadingOutlined, SmileOutlined} from "@ant-design/icons";

const {Step} = Steps;
const {Text} = Typography;

const NFT_STORAGE_API_KEY = process.env.REACT_APP_NFT_STORAGE

export default function NFTMint() {
    const {Moralis} = useMoralis();
    const currentUser = Moralis.User.current();
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
    const [videoId, setVideoId] = useState("");
    const [videoTitle, setVideoTitle] = useState("");
    const [tokenId, setTokenId] = useState({});
    const [edited, setEdited] = useState(false);
    const [current, setCurrent] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [minted, setMinted] = useState(false);

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
                    (<span>Video {data.attributes.videoId} ownership verified, NFT minted at
                        <a href={"/nfts/"+tokenId.videoEditionTokenId}>{tokenId.videoEditionTokenId}</a></span>) :
                    (<span>Video {data.attributes.videoId} ownership couldn't be verified. Please, check that the
                        required text has been added to the description on YouTube and try again</span>),
            });
            if (data.attributes.isVerified) {
                setMinted(true);
            }
        },
    });

    const openNotification = ({type, message, description}) => {
        setAlerts(alerts.concat({ key: alerts.length + 1, type, message, description }))
    };

    const [formCheckVideoId] = Form.useForm();
    const [formValidateVideo] = Form.useForm();

    const checkVideoId = async () => {
        const videoId = formCheckVideoId.getFieldValue("videoId")
        setVideoId(videoId)
        const videoTitle = formCheckVideoId.getFieldValue("videoTitle")
        setVideoTitle(videoTitle)
        // TODO: Check video ID exists:
        // GET https://www.googleapis.com/youtube/v3/videos?part=id&id=Tr5WcGSDqDg&key={YOUR_API_KEY}
        const tokenId = await Moralis.executeFunction({
            functionName: "generateTokenId",
            params: {videoId: formCheckVideoId.getFieldValue("videoId")},
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
        console.log("NFT metadata:\n" + metadata)
        openNotification({
            type: "info",
            message: "📃 Uploading NFT Metadata",
            description: ""
        });
        //const jsonFile = new Moralis.File(tokenId.videoEditionTokenId+'.json', { base64: btoa(metadata) });
        //const upload = await jsonFile.saveIPFS();
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

    if (!currentUser) {
        return ( <Alert message="Authenticate to be able to mint NFTs" type="warning" /> )
    }

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
                        layout={"horizontal"}
                    >
                        <Form.Item name="videoId" label="YouTube Video Identifier" required
                                   tooltip='11 letters and numbers, including characters "-" and "_"'
                                   rules={[{
                                       pattern: new RegExp("^[a-zA-Z0-9_-]{11}$"),
                                       message: 'Should be 11 letters and numbers, including "-" and "_"',
                                   }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="videoTitle" label="YouTube Video Title" required>
                            <Input />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" onClick={checkVideoId}>Next</Button>
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
                                of the description of the video (only if it wasn't already):</Text>
                        </Form.Item>
                        <Form.Item>
                            <Button type="default" href={"https://studio.youtube.com/video/"+videoId+"/edit"}
                                    target="_blank">Edit {videoId}</Button>
                        </Form.Item>
                        <Form.Item>
                            <Checkbox checked={edited} onChange={onCheckboxChange}>
                                The YouTube video description has been edited to include a link to the video NFT token identifier
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
