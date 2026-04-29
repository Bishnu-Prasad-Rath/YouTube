import { AccessToken } from "livekit-server-sdk";

const createLiveToken = async (roomName, user, isStreamer) => {
    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: user._id.toString(),
            name: user.username,
        }
    );

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
    })

    return await at.toJwt();
}

export {
    createLiveToken,
}