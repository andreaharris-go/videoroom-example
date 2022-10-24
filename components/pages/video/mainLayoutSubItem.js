import {useEffect, useState} from "react";
import Janus from "@/utils/libs/janus";
import getQueryStringValue from "@/utils/common/getQueryStringValue";
import DisplaySubViewVideo from "@/components/pages/video/displaySubViewvideo";

export default function MainLayoutSubItem({janusConnect, sources, myPvtId}) {
  const [ initState, initStateSet ] = useState(true)
  const [ mediaState, mediaStateSet ] = useState(null)
  const [ videoTracksState, videoTracksStateSet ] = useState([])
  const opaqueId = "videoRoomTest-"+Janus.randomString(12);
  const appDomain = process.env.APP_DOMAIN;
  const [ videoTracks, videoTracksSet ] = useState([])
  const [ removeStateUpdate, removeStateUpdateSet ] = useState(0)

  useEffect(() => {
    console.log('YYY', videoTracksState, videoTracks)
  }, [removeStateUpdate])

  useEffect(() => {
    let myRoom = 1234; // Demo room
    let remoteFeed = null;
    let feeds = {}, feedStreams = {}, subStreams = {}, slots = {}, mids = {}, subscriptions = {};
    let remoteTracks = {};
    let bitrateTimer = [], simulcastStarted = {};
    let use_msid = (getQueryStringValue("msid", appDomain) === "yes" || getQueryStringValue("msid", appDomain) === "true");
    let creatingSubscription = false;
    let videoMid = [];

    if (janusConnect !== null && initState && mediaState === null && sources.length > 0) {
      initStateSet(false)

      janusConnect.attach(
        {
          plugin: "janus.plugin.videoroom",
          opaqueId: opaqueId,
          success: function (pluginHandle) {
            remoteFeed = pluginHandle;
            remoteTracks = {};
            let subscription = [];

            for (let s in sources) {
              let streams = sources[s];

              for (let i in streams) {
                let stream = streams[i];

                if (
                  stream.type === "video" &&
                  Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                  (
                    stream?.codec === "vp9" ||
                    (stream?.codec === "vp8" && !Janus.safariVp8)
                  )
                ) {
                  continue;
                }

                if (stream.disabled) {
                  // TODO Skipping for now, we should unsubscribe
                  continue;
                }

                if (
                  subscriptions[stream.id] &&
                  subscriptions[stream.id][stream.mid]
                ) {
                  continue;
                }

                if (!feedStreams[stream.id]?.slot) {
                  let slot;

                  for (let i = 1; i < 6; i++) {
                    if (!feeds[i]) {
                      slot = i;
                      feeds[slot] = stream.id;

                      if (feedStreams[stream.id]) {
                        feedStreams[stream.id].slot = slot;
                        feedStreams[stream.id].remoteVideos = 0;
                      } else {
                        feedStreams[stream.id] = {
                          slot: slot,
                          remoteVideos: 0
                        }
                      }

                      break;
                    }
                  }
                }

                subscription.push({
                  feed: stream.id,
                  mid: stream.mid
                });

                if (!subscriptions[stream.id]) {
                  subscriptions[stream.id] = {};
                }

                subscriptions[stream.id][stream.mid] = true;
              }
            }

            let subscribe = {
              request: "join",
              room: myRoom,
              ptype: "subscriber",
              streams: subscription,
              use_msid: use_msid,
              private_id: myPvtId
            };

            remoteFeed.send({ message: subscribe });
          },
          error: function (error) {
            //
          },
          iceState: function (state) {
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

            if (msg["error"]) {
              //
            } else if (event) {
              if (event === "attached") {
                creatingSubscription = false;
              } else if (event === "event") {
                let mid = msg["mid"];
                let substream = msg["substream"];
                let temporal = msg["temporal"];

                if (
                  (substream !== null && substream !== undefined) ||
                  (temporal !== null && temporal !== undefined)
                ) {
                  let sub = subStreams[mid];
                  let feed = feedStreams[sub.feed_id];
                  let slot = slots[mid];

                  if (!simulcastStarted[slot]) {
                    simulcastStarted[slot] = true;
                  }
                }
              }
            }

            if (msg["streams"]) {
              /**
               * Update map of subscriptions by mid
               */
              for (let i in msg["streams"]) {
                let mid = msg["streams"][i]["mid"];
                subStreams[mid] = msg["streams"][i];
                let feed = feedStreams[msg["streams"][i]["feed_id"]];

                if (feed && feed.slot) {
                  slots[mid] = feed.slot;
                  mids[feed.slot] = mid;
                }
              }
            }

            if (jsep) {
              remoteFeed.createAnswer({
                jsep: jsep,
                tracks: [
                  { type: 'data' }
                ],
                success: function (jsep) {
                  remoteFeed.send({
                    message: { request: "start", room: myRoom },
                    jsep: jsep
                  });
                },
                error: function (error) {
                  //
                }
              });
            }
          },
          onlocaltrack: function (track, on) {
            //
          },
          onremotetrack: function (track, mid, on) {
            /**
             * Which publisher are we getting on this mid?
             */
            // console.log('ON REMOTE TRACK', mid, track);
            const ownTrack = {
              mid: mid,
              track: track
            }
            let sub = subStreams[mid];
            let feed = feedStreams[sub.feed_id];
            let stream = null
            let slot = slots[mid];

            if (feed && !slot) {
              slot = feed.slot;
              slots[mid] = feed.slot;
              mids[feed.slot] = mid;
            }

            if (!on) {
              if (track.kind === "video" && feed) {
                feed.remoteVideos--;
                if (feed.remoteVideos === 0) {
                  // No video, at least for now: show a placeholder
                }
              }

              delete remoteTracks[mid];
              delete slots[mid];
              delete mids[slot];

              return;
            }

            if (feed.spinner) {
              feed.spinner.stop();
              feed.spinner = null;
            }

            if (track.kind === "audio") {
              // console.log('AUDIO', mid, track)
              stream = new MediaStream([track]);
              remoteTracks[mid] = stream;
              // TODO add media remote
              if (feed.remoteVideos === 0) {
                // No video, at least for now: show a placeholder
              }
            } else {
              if (!videoMid.includes(ownTrack.mid)) {
                videoMid.push(ownTrack.mid)
                feed.remoteVideos++;
                stream = new MediaStream([ownTrack.track]);
                remoteTracks[mid] = stream;
                console.log('OWN TRACK', ownTrack)

                mediaStateSet(stream)
                videoTracks.push(stream);
                videoTracksStateSet([...videoTracksState, ...stream])
                removeStateUpdateSet(removeStateUpdate + 1)

                if (!bitrateTimer[slot]) {
                  bitrateTimer[slot] = setInterval(function() {
                    // Display updated bitrate, if supported
                  }, 1000);
                }
              }
            }
          },
          oncleanup: function () {
            for (let i = 1; i < 6; i++) {
              if (bitrateTimer[i]) {
                clearInterval(bitrateTimer[i]);
              }

              bitrateTimer[i] = null;
              feedStreams[i].simulcastStarted = false;
              feedStreams[i].remoteVideos = 0;
            }

            remoteTracks = {};
          }
        });
    }
  }, [sources])

  return <DisplaySubViewVideo videoTracks={videoTracks} removeStateUpdate={removeStateUpdate} />
}