
export const NFTMetadata = (minter, videoId, videoTitle, videoTokenId, videoEditionTokenId) => {
    const network = "4"
    const tokenAddress = "0xcb590796c76f4b3f764575163b6f85bf3075e5d4"
    const when = new Date()
    const until = new Date(new Date().setFullYear(new Date().getFullYear() + 1))

    return `{
  "@context": {
    "@vocab": "https://schema.org/",
    "cro": "https://rhizomik.net/ontologies/copyrightonto.owl#",
    "external_link": "https://opensea.io/metadata/external_link",
    "animation_url": "https://opensea.io/metadata/animation_url",
    "youtube_url": "https://opensea.io/metadata/youtube_url"
  },
  "@id": "did:eip155:${network}:erc721:${tokenAddress}:${videoEditionTokenId}",
  "@type": "cro:Agree",
  "name": "'${videoTitle}' #${parseInt(videoEditionTokenId.substring(videoTokenId.length, videoEditionTokenId.length))}",
  "description": "Grants the owner non-exclusive permission to make '${videoTitle}' available on the World Wide Web from ${when.toUTCString()} to ${until.toUTCString()}",
  "external_link": "https://ytvideonft.rhizomik.net/nfts/${videoTokenId}",
  "image": "https://img.youtube.com/vi/${videoId}/0.jpg",
  "youtube_url": "https://www.youtube.com/watch?v=${videoId}",
  "cro:when": "${when.toISOString()}",
  "cro:who": {
    "@id": "did:ethr:0x4:${minter}",
    "url": "https://ytvideonft.rhizomik.net/creators/${minter}" },
  "cro:what": {
    "@type": "cro:MakeAvailable",
    "startTime": "${when.toISOString()}",
    "endTime": "${until.toISOString()}",
    "cro:who": {
      "owns": "did:eip155:${network}:erc721:${tokenAddress}:${videoEditionTokenId}" },
    "cro:what": {
      "@id": "https://youtu.be/${videoId}",
      "@type": "cro:Manifestation",
      "name": "Copyright in blocks",
      "url": "https://www.youtube.com/watch?v=${videoId}"
    },
    "cro:with": { "@id": "https://dbpedia.org/resource/World_Wide_Web" }
  }
}`;
}
