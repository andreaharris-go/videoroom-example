import VideoPlayer from "@/components/common/videoPlayer";
import {useEffect, useState} from "react";
import Janus from "@/utils/libs/janus";

export default function VideoSubView({janusConnect, sources, mypvtid}) {
  const [ initState, initStateSet ] = useState(true)
  const [ mediaState, mediaStateSet ] = useState(null)
  const opaqueId = "videoroomtest-"+Janus.randomString(12);
  const username = 'S1_yohk'
  let sfutest = null;
  let myid = null;
  let myusername = null;
  let mystream = null;
  let myroom = 1234; // Demo room
  let remoteFeed = null;
  let feeds = {}, feedStreams = {}, subStreams = {}, slots = {}, mids = {}, subscriptions = {};
  let localTracks = {}, localVideos = 0, remoteTracks = {};
  let bitrateTimer = [], simulcastStarted = {};
  let subscriber_mode = '';
  let doSimulcast = (getQueryStringValue("simulcast") === "yes" || getQueryStringValue("simulcast") === "true");
  let acodec = (getQueryStringValue("acodec") !== "" ? getQueryStringValue("acodec") : null);
  let vcodec = (getQueryStringValue("vcodec") !== "" ? getQueryStringValue("vcodec") : null);
  let use_msid = (getQueryStringValue("msid") === "yes" || getQueryStringValue("msid") === "true");
  let creatingSubscription = false;

  function getQueryStringValue(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    let regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(process.env.APP_DOMAIN);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  function escapeXmlTags(value) {
    if(value) {
      let escapedValue = value.replace(new RegExp('<', 'g'), '&lt');
      escapedValue = escapedValue.replace(new RegExp('>', 'g'), '&gt');
      return escapedValue;
    }
  }

  useEffect(() => {
    if (janusConnect !== null && initState && mediaState === null && sources.length > 0) {
      initStateSet(false)

      console.log('GIVE SOURCE', sources)

      janusConnect.attach(
        {
          plugin: "janus.plugin.videoroom",
          opaqueId: opaqueId,
          success: function(pluginHandle) {
            console.log('pluginHandle MMMMM', pluginHandle)
            remoteFeed = pluginHandle;
            console.log('REMOTE FEED', sources)
            remoteTracks = {};
            Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
            Janus.log("  -- This is a multistream subscriber");
            // Prepare the streams to subscribe to, as an array: we have the list of
            // streams the feed is publishing, so we can choose what to pick or skip
            let subscription = [];
            for(let s in sources) {
              console.log('SOURCE[S]', sources[s])
              let streams = sources[s];
              for(let i in streams) {
                let stream = streams[i];
                console.log('STRUEMS[i]', stream)
                // If the publisher is VP8/VP9 and this is an older Safari, let's avoid video
                if(stream.type === "video" && Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                  (stream.codec === "vp9" || (stream.codec === "vp8" && !Janus.safariVp8))) {
                  continue;
                }
                if(stream.disabled) {
                  Janus.log("Disabled stream:", stream);
                  // TODO Skipping for now, we should unsubscribe
                  continue;
                }
                Janus.log("Subscribed to " + stream.id + "/" + stream.mid + "?", subscriptions);
                if(subscriptions[stream.id] && subscriptions[stream.id][stream.mid]) {
                  Janus.log("Already subscribed to stream, skipping:", stream);
                  continue;
                }
                // console.log(feedStreams[stream.id])
                // Find an empty slot in the UI for each new source
                if(!feedStreams[stream.id]?.slot) {
                  let slot;
                  for(let i=1;i<6;i++) {
                    if(!feeds[i]) {
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

                      // $('#remote' + slot).removeClass('hide').html(escapeXmlTags(stream.display)).show();
                      break;
                    }
                  }
                }

                subscription.push({
                  feed: stream.id,	// This is mandatory
                  mid: stream.mid		// This is optional (all streams, if missing)
                });
                if(!subscriptions[stream.id])
                  subscriptions[stream.id] = {};
                subscriptions[stream.id][stream.mid] = true;
              }
            }
            // We wait for the plugin to send us an offer
            let subscribe = {
              request: "join",
              room: myroom,
              ptype: "subscriber",
              streams: subscription,
              use_msid: use_msid,
              private_id: mypvtid
            };
            console.log('SSSSSSSSSSSSSS', subscribe)
            remoteFeed.send({ message: subscribe });
          },
          error: function(error) {
            Janus.error("  -- Error attaching plugin...", error);
          },
          iceState: function(state) {
            Janus.log("ICE state (remote feed) changed to " + state);
          },
          webrtcState: function(on) {
            Janus.log("Janus says this WebRTC PeerConnection (remote feed) is " + (on ? "up" : "down") + " now");
          },
          slowLink: function(uplink, lost, mid) {
            Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
              " packets on mid " + mid + " (" + lost + " lost packets)");
          },
          onmessage: function(msg, jsep) {
            Janus.debug(" ::: Got a message (subscriber) :::", msg);
            let event = msg["videoroom"];
            Janus.debug("Event: " + event);
            if(msg["error"]) {
              //
            } else if(event) {
              if(event === "attached") {
                // Now we have a working subscription, next requests will update this one
                creatingSubscription = false;
                Janus.log("Successfully attached to feed in room " + msg["room"]);
              } else if(event === "event") {
                // Check if we got an event on a simulcast-related event from this publisher
                let mid = msg["mid"];
                let substream = msg["substream"];
                let temporal = msg["temporal"];
                if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                  // Check which this feed this refers to
                  let sub = subStreams[mid];
                  let feed = feedStreams[sub.feed_id];
                  let slot = slots[mid];
                  if(!simulcastStarted[slot]) {
                    simulcastStarted[slot] = true;
                    // Add some new buttons
                    // addSimulcastButtons(slot, true);
                  }
                  // We just received notice that there's been a switch, update the buttons
                  // updateSimulcastButtons(slot, substream, temporal);
                }
              } else {
                // What has just happened?
              }
            }
            if(msg["streams"]) {
              // Update map of subscriptions by mid
              for(let i in msg["streams"]) {
                let mid = msg["streams"][i]["mid"];
                subStreams[mid] = msg["streams"][i];
                let feed = feedStreams[msg["streams"][i]["feed_id"]];
                if(feed && feed.slot) {
                  slots[mid] = feed.slot;
                  mids[feed.slot] = mid;
                }
              }
            }
            if(jsep) {
              Janus.debug("Handling SDP as well...", jsep);
              // Answer and attach
              remoteFeed.createAnswer(
                {
                  jsep: jsep,
                  // We only specify data channels here, as this way in
                  // case they were offered we'll enable them. Since we
                  // don't mention audio or video tracks, we autoaccept them
                  // as recvonly (since we won't capture anything ourselves)
                  tracks: [
                    { type: 'data' }
                  ],
                  success: function(jsep) {
                    Janus.debug("Got SDP!");
                    Janus.debug(jsep);
                    let body = { request: "start", room: myroom };
                    remoteFeed.send({ message: body, jsep: jsep });
                  },
                  error: function(error) {
                    Janus.error("WebRTC error:", error);
                  }
                });
            }
          },
          onlocaltrack: function(track, on) {
            console.log('LOCAL TRACK', track)
            // The subscriber stream is recvonly, we don't expect anything here
          },
          onremotetrack: function(track, mid, on) {
            console.log('REMOTE TRACK', track, mid, on)
            Janus.debug("Remote track (mid=" + mid + ") " + (on ? "added" : "removed") + ":", track);
            // Which publisher are we getting on this mid?
            let sub = subStreams[mid];
            let feed = feedStreams[sub.feed_id];
            let stream = null
            Janus.debug(" >> This track is coming from feed " + sub.feed_id + ":", feed);
            let slot = slots[mid];
            if(feed && !slot) {
              slot = feed.slot;
              slots[mid] = feed.slot;
              mids[feed.slot] = mid;
            }
            Janus.debug(" >> mid " + mid + " is in slot " + slot);
            if(!on) {
              // Track removed, get rid of the stream and the rendering
              // $('#remotevideo' + slot + '-' + mid).remove();
              if(track.kind === "video" && feed) {
                feed.remoteVideos--;
                if(feed.remoteVideos === 0) {
                  // No video, at least for now: show a placeholder
                  // if($('#videoremote' + slot + ' .no-video-container').length === 0) {
                  //   $('#videoremote' + slot).append(
                  //     '<div class="no-video-container">' +
                  //     '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                  //     '<span class="no-video-text">No remote video available</span>' +
                  //     '</div>');
                  // }
                }
              }
              delete remoteTracks[mid];
              delete slots[mid];
              delete mids[slot];
              return;
            }
            // If we're here, a new track was added
            if(feed.spinner) {
              feed.spinner.stop();
              feed.spinner = null;
            }
            // console.log('TRACK', track)
            if(track.kind === "audio") {
              // New audio track: create a stream out of it, and use a hidden <audio> element
              stream = new MediaStream([track]);
              remoteTracks[mid] = stream;
              Janus.log("Created remote audio stream:", stream);
              // $('#videoremote' + slot).append('<audio class="hide" id="remotevideo' + slot + '-' + mid + '" autoplay playsinline/>');
              // Janus.attachMediaStream($('#remotevideo' + slot + '-' + mid).get(0), stream);
              // TODO add media remote
              if(feed.remoteVideos === 0) {
                // No video, at least for now: show a placeholder
                // if($('#videoremote' + slot + ' .no-video-container').length === 0) {
                //   $('#videoremote' + slot).append(
                //     '<div class="no-video-container">' +
                //     '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                //     '<span class="no-video-text">No remote video available</span>' +
                //     '</div>');
                // }
              }
            } else {
              // New video track: create a stream out of it
              feed.remoteVideos++;
              // $('#videoremote' + slot + ' .no-video-container').remove();
              stream = new MediaStream([track]);
              remoteTracks[mid] = stream;
              Janus.log("Created remote video stream:", stream);
              mediaStateSet(stream)
              // $('#videoremote' + slot).append('<video class="rounded centered" id="remotevideo' + slot + '-' + mid + '" width=100% autoplay playsinline/>');
              // $('#videoremote' + slot).append(
              //   '<span class="label label-primary hide" id="curres'+slot+'" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;"></span>' +
              //   '<span class="label label-info hide" id="curbitrate'+slot+'" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;"></span>');
              // Janus.attachMediaStream($('#remotevideo' + slot + '-' + mid).get(0), stream);
              // Note: we'll need this for additional videos too
              if(!bitrateTimer[slot]) {
                // $('#curbitrate' + slot).removeClass('hide').show();
                bitrateTimer[slot] = setInterval(function() {
                  // if(!$("#videoremote" + slot + ' video').get(0))
                  //   return;
                  // Display updated bitrate, if supported
                  let bitrate = remoteFeed.getBitrate(mid);
                  // $('#curbitrate' + slot).text(bitrate);
                  // Check if the resolution changed too
                  // let width = $("#videoremote" + slot + ' video').get(0).videoWidth;
                  // let height = $("#videoremote" + slot + ' video').get(0).videoHeight;
                  // if(width > 0 && height > 0)
                  //   $('#curres' + slot).removeClass('hide').text(width+'x'+height).show();
                }, 1000);
              }
            }
          },
          oncleanup: function() {
            Janus.log(" ::: Got a cleanup notification (remote feed) :::");
            for(let i=1;i<6;i++) {
              // $('#videoremote'+i).empty();
              if(bitrateTimer[i])
                clearInterval(bitrateTimer[i]);
              bitrateTimer[i] = null;
              feedStreams[i].simulcastStarted = false;
              feedStreams[i].remoteVideos = 0;
              // $('#simulcast'+i).remove();
            }
            remoteTracks = {};
          }
        });
    }
  }, [sources])

  console.log(mediaState)

  if (mediaStateSet) {
    return <VideoPlayer cssClass="h-full w-full object-cover" srcObject={mediaState} />
  } else {
    return <></>
  }

}