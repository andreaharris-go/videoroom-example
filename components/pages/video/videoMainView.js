import VideoPlayer from "@/components/common/videoPlayer";
import {useEffect, useState} from "react";
import Janus from "@/utils/libs/janus";
import publishOwnFeed from "@/utils/libs/jaFunc/publishOwnFeed";
import getQueryStringValue from "@/utils/common/getQueryStringValue";
import escapeXmlTags from "@/utils/common/escapeXmlTags";

export default function VideoMainView({janusConnect, subscribeTo, emitInfo = () => {}}) {
  const [ initState, initStateSet ] = useState(true)
  const [ mediaState, mediaStateSet ] = useState(null)
  const [ myInfoState, myInfoStateSet ] = useState({})
  const opaqueId = "videoRoomTest-"+Janus.randomString(12);
  const username = 'S1_yohk'
  const appDomain = process.env.APP_DOMAIN;

  useEffect(() => {
    let sfuTest = null;
    let myId = null;
    let myUsername = null;
    let myStream = null;
    let myPvtId = null;
    let myRoom = 1234; // Demo room
    let feedStreams = {};
    let localTracks = {}, localVideos = 0;
    let acodec = (getQueryStringValue("acodec", appDomain) !== "" ? getQueryStringValue("acodec", appDomain) : null);
    let vcodec = (getQueryStringValue("vcodec", appDomain) !== "" ? getQueryStringValue("vcodec", appDomain) : null);

    if (janusConnect !== null && initState && mediaState === null) {
      initStateSet(false)

      janusConnect.attach(
        {
          plugin: "janus.plugin.videoroom",
          opaqueId: opaqueId,
          success: function(pluginHandle) {
            sfuTest = pluginHandle;
            myUsername = escapeXmlTags(username);
            let register = {
              request: "join",
              room: myRoom,
              ptype: "publisher",
              display: myUsername
            };

            myInfoStateSet(Object.assign(myInfoState, {sfuId: sfuTest.id}));
            emitInfo(myInfoState)

            sfuTest.send({ message: register });
          },
          error: function (error) {
            //
          },
          iceState: function (state) {
            //
          },
          mediaState: function (medium, on, mid) {
            //
          },
          webrtcState: function (on) {
            //
          },
          slowLink: function (uplink, lost, mid) {
            //
          },
          onmessage: function (msg, jsep) {
            let event = msg["videoroom"];

            if (event !== undefined && event !== null) {
              if (event === "joined") {
                myId = msg["id"];
                myPvtId = msg["private_id"];
                publishOwnFeed(true, sfuTest, acodec, vcodec);

                if (msg["publishers"]) {
                  let list = msg["publishers"];
                  let sources = null;

                  for (let f in list) {
                    if (list[f]["dummy"]) { continue; }

                    let id = list[f]["id"];
                    let display = list[f]["display"];
                    let streams = list[f]["streams"];

                    for (let i in streams) {
                      let stream = streams[i];

                      stream["id"] = id;
                      stream["display"] = display;
                    }

                    let slot = feedStreams[id] ? feedStreams[id].slot : null;
                    let remoteVideos = feedStreams[id] ? feedStreams[id].remoteVideos : 0;
                    feedStreams[id] = {
                      id: id,
                      display: display,
                      streams: streams,
                      slot: slot,
                      remoteVideos: remoteVideos
                    }

                    if (!sources) {
                      sources = [];
                    }

                    sources.push(streams);

                    if (sources) {
                      subscribeTo(sources, myPvtId);
                    }
                  }
                }
              } else if (event === "destroyed") {
                //
              } else if (event === "event") {
                if (msg["streams"]) {
                  let streams = msg["streams"];

                  for (let i in streams) {
                    let stream = streams[i];
                    stream["id"] = myId;
                    stream["display"] = myUsername;
                  }

                  feedStreams[myId] = {
                    id: myId,
                    display: myUsername,
                    streams: streams
                  }
                } else if (msg["publishers"]) {
                  let list = msg["publishers"];
                  let sources = null;

                  for (let f in list) {
                    if (list[f]["dummy"]) { continue; }

                    let id = list[f]["id"];
                    let display = list[f]["display"];
                    let streams = list[f]["streams"];

                    for (let i in streams) {
                      let stream = streams[i];
                      stream["id"] = id;
                      stream["display"] = display;
                    }

                    let slot = feedStreams[id] ? feedStreams[id].slot : null;
                    let remoteVideos = feedStreams[id] ? feedStreams[id].remoteVideos : 0;
                    feedStreams[id] = {
                      id: id,
                      display: display,
                      streams: streams,
                      slot: slot,
                      remoteVideos: remoteVideos
                    }

                    if(!sources) {
                      sources = [];
                    }

                    sources.push(streams);
                  }
                } else if (msg["leaving"]) {
                  //
                } else if (msg["unpublished"]) {
                  let unpublished = msg["unpublished"];

                  if (unpublished === 'ok') {
                    sfuTest.hangup();
                    return;
                  }
                } else if (msg["error"]) {
                  if (msg["error_code"] === 426) {
                    //
                  }
                }
              }
            }
            if (jsep) {
              sfuTest.handleRemoteJsep({ jsep: jsep });
              let audio = msg["audio_codec"];

              if (myStream && myStream.getAudioTracks() && myStream.getAudioTracks().length > 0 && !audio) {
                // Audio has been rejected
              }

              let video = msg["video_codec"];

              if (myStream && myStream.getVideoTracks() && myStream.getVideoTracks().length > 0 && !video) {
                // Video has been rejected
              }
            }
          },
          onlocaltrack: function (track, on) {
            let trackId = track.id.replace(/[{}]/g, "");

            if (!on) {
              let stream = localTracks[trackId];

              if (stream) {
                try {
                  let tracks = stream.getTracks();

                  for (let i in tracks) {
                    let mst = tracks[i];
                    if (mst)
                      mst.stop();
                  }
                } catch (e) {}
              }

              if (track.kind === "video") {
                localVideos--;
                if (localVideos === 0) {
                  // No video, at least for now: show a placeholder
                }
              }

              delete localTracks[trackId];
              return;
            }

            let stream = localTracks[trackId];

            if (track.kind === 'video') {
              myInfoStateSet(Object.assign(myInfoState, {
                trackVideoId: trackId,
                trackKindVideo: track.kind,
              }));
              emitInfo(myInfoState)
            }

            if (track.kind === 'audio') {
              myInfoStateSet(Object.assign(myInfoState, {
                trackAudioId: trackId,
                trackKindAudio: track.kind,
              }));
              emitInfo(myInfoState)
            }


            if (stream) { return; }

            if (track.kind === "audio") {
              if (localVideos === 0) {
                // No video, at least for now: show a placeholder
              }
            } else {
              localVideos++;
              stream = new MediaStream([track]);
              localTracks[trackId] = stream;
              mediaStateSet(stream);
            }

            if(
              sfuTest.webrtcStuff.pc.iceConnectionState !== "completed" &&
              sfuTest.webrtcStuff.pc.iceConnectionState !== "connected"
            ) {
              // Publishing..
            }
          },
          onremotetrack: function (track, mid, on) {
            // The publisher stream is send only, we don't expect anything here
          },
        });
    }
  }, [janusConnect])

  return <VideoPlayer cssClass="w-full h-full object-cover" srcObject={mediaState} />
}