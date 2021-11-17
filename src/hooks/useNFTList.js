import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider";
import {useEffect, useState} from "react";
import {useMoralisWeb3Api, useMoralisWeb3ApiCall} from "react-moralis";

export const useNFTList = (options) => {
    const {token} = useMoralisWeb3Api();
    const {chainId} = useMoralisDapp();

    const [NFTList, setNFTList] = useState([]);

    const { fetch: getNFTList, data, error, isLoading } = useMoralisWeb3ApiCall(token.getAllTokenIds,
        {chain: chainId, ...options});

    useEffect(() => {
        if (data?.result) {
            const NFTs = data.result;
            for (let NFT of NFTs) {
                if (NFT?.metadata) {
                    NFT.metadata = JSON.parse(NFT.metadata);
                    // metadata is a string type
                    if (NFT.metadata?.youtube_url && NFT.metadata?.youtube_url.indexOf('youtube.com') > 0) {
                        NFT.youtube_url = NFT.metadata.youtube_url.replace('watch?v=', 'embed/')
                    }
                    NFT.image = NFT.metadata?.image;
                }
            }
            setNFTList(NFTs);
        }
    }, [data]);

    return {getNFTList, NFTList, error, isLoading};
};
