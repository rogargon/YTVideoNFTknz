import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider";
import {useEffect, useState} from "react";
import {useMoralisWeb3Api, useMoralisWeb3ApiCall} from "react-moralis";

export const useNFTBalance = (options) => {
    const {account} = useMoralisWeb3Api();
    const {chainId} = useMoralisDapp();

    const [NFTBalance, setNFTBalance] = useState([]);

    const { fetch: getNFTBalance, data, error, isLoading } = useMoralisWeb3ApiCall(account.getNFTsForContract,
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
            setNFTBalance(NFTs);
        }
    }, [data]);

    return {getNFTBalance, NFTBalance, error, isLoading};
};
