import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useEffect, useState } from "react";
import { useMoralisWeb3ApiCall, useMoralisWeb3Api } from "react-moralis";

export const useNFTTransfers = (options) => {
  const { chainId } = useMoralisDapp();
  const { token } = useMoralisWeb3Api();
  const [NFTTransfers, setNFTTransfers] = useState([]);
  const { fetch: getNFTTransfers, data, error, isLoading,} = useMoralisWeb3ApiCall(
      token.getContractNFTTransfers, { chain: chainId, order: "block_number.ASC", ...options });

  useEffect(() => data &&
      setNFTTransfers(data?.result.sort((a, b) => b.block_number - a.block_number  )),
      [data]);

  return { getNFTTransfers, NFTTransfers, error, isLoading };
};
