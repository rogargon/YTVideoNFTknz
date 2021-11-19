import {Button, Card, Input, Typography, Form, notification, Alert, Steps, Row, Col, Checkbox} from "antd";
import React, {useMemo, useState} from "react";
import contractInfo from "contracts/contractInfo.json";
import Address from "components/Address/Address";
import {useMoralis, useMoralisQuery} from "react-moralis";
import {getEllipsisTxt} from "helpers/formatters";
import {useEffect} from "react";
import {useMoralisDapp} from "../providers/MoralisDappProvider/MoralisDappProvider";
import TextArea from "antd/es/input/TextArea";

const {Step} = Steps;
const {Text} = Typography;

export default function NFTMint() {
    const {Moralis} = useMoralis();
    const {chainId} = useMoralisDapp();
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
    const [tokenId, setTokenId] = useState({});
    const [edited, setEdited] = useState(false);
    const [current, setCurrent] = useState(0);

    /**Live query */
    const {data} = useMoralisQuery("Events", (query) => query, [], {
        live: true,
    });

    useEffect(() => console.log("New data: ", data), [data]);

    const openNotification = ({message, description}) => {
        notification.open({
            placement: "bottomRight",
            message,
            description,
            onClick: () => {
                console.log("Notification Clicked!");
            },
        });
    };

    const [formCheckVideoId] = Form.useForm();
    const [formValidateVideo] = Form.useForm();

    const checkVideoId = () => {
        console.log("VideoID:", formCheckVideoId.getFieldValue("videoid"))
        setVideoId(formCheckVideoId.getFieldValue("videoid"))
        // TODO: Check video ID exists:
        // GET https://www.googleapis.com/youtube/v3/videos?part=id&id=Tr5WcGSDqDg&key={YOUR_API_KEY}
        Moralis.executeFunction({
            functionName: "generateTokenId",
            params: { videoId: formCheckVideoId.getFieldValue("videoid") },
            ...options }).then((response) => {
                setTokenId({ "videoTokenId": response.videoTokenId, "tokenId": response.tokenId })
                setCurrent(current + 1);
            })
    };

    const copyText = () => {
        console.log(formValidateVideo.getFieldsValue());
        navigator.clipboard.writeText(formValidateVideo.getFieldValue("descriptionText"));
    };

    const onCheckboxChange = (e) => { setEdited(e.target.checked); };

    const validateVideo = () => {};

    return (
        <div style={{width: 500, margin: "40px auto"}}>
            <Steps current={current}>
                <Step key={0} title="Input video"/>
                <Step key={1} title="Video validation"/>
                <Step key={2} title="NFT minting"/>
            </Steps>
            <div style={{margin: "50px 10px"}}>
                {current === 0 && (
                    <Form form={formCheckVideoId}
                        name="check-videoid"
                        layout={"horizontal"}
                    >
                        <Form.Item name="videoid" label="YouTube Video Identifier" required
                                   tooltip='11 letters and numbers, including characters "-" and "_"'
                                   rules={[{
                                       pattern: new RegExp("^[a-zA-Z0-9_-]{11}$"),
                                       message: 'Should be 11 letters and numbers, including "-" and "_"',
                                   }]}>
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
            </div>

            {/*            <Card
                title={
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                        Your contract: {contractName}
                        <Address avatar="left" copyable address={contract?.address} size={8}/>
                    </div>
                }
                size="large"
                style={{width: "60%"}}
            >
                <Form.Provider
                    onFormFinish={async (name, {forms}) => {
                        const params = forms[name].getFieldsValue();

                        let isView = false;

                        for (let method of contract.abi) {
                            if (method.name !== name) continue;
                            if (method.stateMutability === "view") isView = true;
                        }

                        if (!isView) {
                            const tx = await Moralis.executeFunction({awaitReceipt: false, ...options});
                            tx.on("transactionHash", (hash) => {
                                setResponses({...responses, [name]: {result: null, isLoading: true}});
                                openNotification({
                                    message: "🔊 New Transaction",
                                    description: `${hash}`,
                                });
                                console.log("🔊 New Transaction", hash);
                            })
                                .on("receipt", (receipt) => {
                                    setResponses({...responses, [name]: {result: null, isLoading: false}});
                                    openNotification({
                                        message: "📃 New Receipt",
                                        description: `${receipt.transactionHash}`,
                                    });
                                    console.log("🔊 New Receipt: ", receipt);
                                })
                                .on("error", (error) => {
                                    console.log(error);
                                });
                        } else {
                            Moralis.executeFunction(options).then((response) =>
                                setResponses({...responses, [name]: {result: response, isLoading: false}})
                            );
                        }
                    }}
                >
                    {displayedContractFunctions &&
                    displayedContractFunctions.map((item, key) => (
                        <Card
                            title={`${key + 1}. ${item?.name}`}
                            size="small"
                            style={{marginBottom: "20px"}}
                        >
                            <Form layout="vertical" name={`${item.name}`}>
                                {item.inputs.map((input, key) => (
                                    <Form.Item
                                        label={`${input.name} (${input.type})`}
                                        name={`${input.name}`}
                                        required
                                        style={{marginBottom: "15px"}}
                                    >
                                        <Input placeholder="input placeholder"/>
                                    </Form.Item>
                                ))}
                                <Form.Item style={{marginBottom: "5px"}}>
                                    <Text style={{display: "block"}}>
                                        {responses[item.name]?.result &&
                                        `Response: ${JSON.stringify(responses[item.name]?.result)}`}
                                    </Text>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={responses[item?.name]?.isLoading}
                                    >
                                        {item.stateMutability === "view" ? "Read🔎" : "Transact💸"}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    ))}
                </Form.Provider>
            </Card>
            <Card title={"Contract Events"} size="large" style={{width: "40%"}}>
                {data.map((event, key) => (
                    <Card title={"Transfer event"} size="small" style={{marginBottom: "20px"}}>
                        {getEllipsisTxt(event.attributes.transaction_hash, 14)}
                    </Card>
                ))}
            </Card>*/}
        </div>
    );
}
