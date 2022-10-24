import Janus from "@/utils/libs/janus";

function publishOwnFeed(useAudio, sfuTest, acodec, vcodec) {
  let tracks = [];

  if(useAudio) {
    tracks.push({ type: 'audio', capture: true, recv: false });
  }

  tracks.push({ type: 'video', capture: true, recv: false, simulcast: false });

  sfuTest.createOffer(
    {
      tracks: tracks,
      success: function(jsep) {
        let publish = { request: "configure", audio: useAudio, video: true };

        if (acodec) { publish["audiocodec"] = acodec; }

        if (vcodec) { publish["videocodec"] = vcodec; }

        sfuTest.send({ message: publish, jsep: jsep });
      },
      error: function(error) {
        Janus.error("WebRTC error:", error);
      }
    });
}

export default publishOwnFeed;