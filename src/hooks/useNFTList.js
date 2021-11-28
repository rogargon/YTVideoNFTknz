import {useMoralisDapp} from "providers/MoralisDappProvider/MoralisDappProvider";
import {useEffect, useState} from "react";
import {useMoralisWeb3Api, useMoralisWeb3ApiCall} from "react-moralis";

export const useNFTList = (options) => {
    const {token} = useMoralisWeb3Api();
    let {chainId} = useMoralisDapp();
    chainId = chainId ? chainId : "0x13881";
    const [NFTList, setNFTList] = useState([]);
    const { fetch: getNFTList, data, error, isLoading } = useMoralisWeb3ApiCall(token.getAllTokenIds,
        {chain: chainId, ...options});

    useEffect(() => {
        if (data?.result) {
            const NFTs = data.result
                .filter(NFT => options.searchId ? NFT.token_id.indexOf(options.searchId) >= 0 : true)
                .map(NFT => {
                    if (NFT?.metadata) {
                        NFT.metadata = JSON.parse(NFT.metadata);
                        if (NFT.metadata?.youtube_url && NFT.metadata?.youtube_url.indexOf('youtube.com') > 0) {
                            NFT.youtube_url = NFT.metadata.youtube_url.replace('watch?v=', 'embed/')
                        }
                        NFT.image = NFT.metadata?.image;
                    }
                    return NFT; })
                .sort((a, b) => b.block_number - a.block_number  );
            setNFTList(NFTs);
        }
    }, [data]);

    return {getNFTList, NFTList, error, isLoading};
};
