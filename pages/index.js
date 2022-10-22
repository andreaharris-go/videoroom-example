import Layout2 from "@/components/pages/video/layout2";
const Janus = require('../utils/libs/janus')
import {useEffect, useState} from "react";
import adapter from "webrtc-adapter";

export async function getServerSideProps() {
  return {
    props: {
      servers: [process.env.JANUS_DEFAULT_SERVER]
    },
  }
}

export default function Home({ servers }) {
  const [ initState, initStateSet ] = useState(true)
  const opaqueId = "videoroomtest-"+Janus.randomString(12);
  const username = 'S1_yohk'
  let sfutest = null;
  let myid = null;
  let myusername = null;
  let mystream = null;
  let mypvtid = null;
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
    if (window && initState) {
      initStateSet(false)

      const createNewJanus = async () => {
        return new Promise((resolve, reject) => {
          Janus.init({
            debug: 'all',
            callback: function () {
              resolve({ status: 'success' })
            },
            error: function (error) {
              reject({ status: 'error', msg: error })
              console.log('[PUB_INIT][error]: ' + error)
            },
            destroyed: function () {
              console.log('[PUB_INIT][destroyed]')
              resolve({ status: 'destroyed' })
            },
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dependencies: Janus.useDefaultDependencies({ adapter }),
          })
        })
      }

      const createJanusSession = async () => {
        let session

        return new Promise((resolve, reject) => {
          const config = {
            server: servers,
            success: function () {
              resolve(session)
            },
            error: function (cause) {
              console.log('[SESSION_INIT][error]: ' + cause)
              reject(cause)
            },
            destroyed: function () {
              console.log('[SESSION_INIT][destroyed]')
            },
          }

          session = new Janus(config)
        })
      }

      return () => {
        createNewJanus()
          .then(() => {
            createJanusSession()
              .then(session => {
                function publishOwnFeed(useAudio) {
                  // Publish our stream

                  // We want sendonly audio and video (uncomment the data track
                  // too if you want to publish via datachannels as well)
                  let tracks = [];
                  if(useAudio) {
                    tracks.push({ type: 'audio', capture: true, recv: false });
                  }

                  tracks.push({ type: 'video', capture: true, recv: false, simulcast: doSimulcast });
                  //~ tracks.push({ type: 'data' });

                  sfutest.createOffer(
                    {
                      tracks: tracks,
                      success: function(jsep) {
                        Janus.debug("Got publisher SDP!");
                        Janus.debug(jsep);
                        let publish = { request: "configure", audio: useAudio, video: true };
                        if(acodec)
                          publish["audiocodec"] = acodec;
                        if(vcodec)
                          publish["videocodec"] = vcodec;
                        sfutest.send({ message: publish, jsep: jsep });
                      },
                      error: function(error) {
                        Janus.error("WebRTC error:", error);
                        if (useAudio) {
                          publishOwnFeed(false);
                        } else {
                          console.log("WebRTC error... " + error.message);
                        }
                      }
                    });
                }

                session.attach(
                  {
                    plugin: "janus.plugin.videoroom",
                    opaqueId: opaqueId,
                    success: function(pluginHandle) {
                      // $('#details').remove();
                      sfutest = pluginHandle;
                      Janus.log("Plugin attached! (" + sfutest.getPlugin() + ", id=" + sfutest.getId() + ")");
                      Janus.log("  -- This is a publisher/manager");

                      let register = {
                        request: "join",
                        room: myroom,
                        ptype: "publisher",
                        display: 'S1'
                      };
                      myusername = escapeXmlTags(username);
                      sfutest.send({ message: register });
                    },
                    error: function(error) {
                      Janus.error("  -- Error attaching plugin...", error);
                    },
                    // consentDialog: function(on) {
                    //   Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
                    //   if(on) {
                    //     // Darken screen and show hint
                    //     $.blockUI({
                    //       message: '<div><img src="up_arrow.png"/></div>',
                    //       css: {
                    //         border: 'none',
                    //         padding: '15px',
                    //         backgroundColor: 'transparent',
                    //         color: '#aaa',
                    //         top: '10px',
                    //         left: (navigator.mozGetUserMedia ? '-100px' : '300px')
                    //       } });
                    //   } else {
                    //     // Restore screen
                    //     $.unblockUI();
                    //   }
                    // },
                    iceState: function(state) {
                      Janus.log("ICE state changed to " + state);
                    },
                    mediaState: function(medium, on, mid) {
                      Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium + " (mid=" + mid + ")");
                    },
                    webrtcState: function(on) {
                      Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                      // $("#videolocal").parent().parent().unblock();
                      if(!on)
                        return;
                      // $('#publish').remove();
                      // This controls allows us to override the global room bitrate cap
                      // $('#bitrate').parent().parent().removeClass('hide').show();
                      // $('#bitrate a').click(function() {
                      //   let id = $(this).attr("id");
                      //   let bitrate = parseInt(id)*1000;
                      //   if(bitrate === 0) {
                      //     Janus.log("Not limiting bandwidth via REMB");
                      //   } else {
                      //     Janus.log("Capping bandwidth to " + bitrate + " via REMB");
                      //   }
                      //   $('#bitrateset').html($(this).html() + '<span class="caret"></span>').parent().removeClass('open');
                      //   sfutest.send({ message: { request: "configure", bitrate: bitrate }});
                      //   return false;
                      // });
                    },
                    slowLink: function(uplink, lost, mid) {
                      Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
                        " packets on mid " + mid + " (" + lost + " lost packets)");
                    },
                    onmessage: function(msg, jsep) {
                      Janus.debug(" ::: Got a message (publisher) :::", msg);
                      let event = msg["videoroom"];
                      Janus.debug("Event: " + event);
                      if(event != undefined && event != null) {
                        if(event === "joined") {
                          // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                          myid = msg["id"];
                          mypvtid = msg["private_id"];
                          Janus.log("Successfully joined room " + msg["room"] + " with ID " + myid);
                          if(subscriber_mode) {
                            // $('#videojoin').hide();
                            // $('#videos').removeClass('hide').show();
                          } else {
                            publishOwnFeed(true);
                          }
                          // Any new feed to attach to?
                          if(msg["publishers"]) {
                            let list = msg["publishers"];
                            Janus.debug("Got a list of available publishers/feeds:", list);
                            let sources = null;
                            for(let f in list) {
                              if(list[f]["dummy"])
                                continue;
                              let id = list[f]["id"];
                              let display = list[f]["display"];
                              let streams = list[f]["streams"];
                              for(let i in streams) {
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
                              Janus.debug("  >> [" + id + "] " + display + ":", streams);
                              if(!sources)
                                sources = [];
                              sources.push(streams);
                            }
                            if(sources)
                              subscribeTo(sources);
                          }
                        } else if(event === "destroyed") {
                          // The room has been destroyed
                          Janus.warn("The room has been destroyed!");
                        } else if(event === "event") {
                          // Any info on our streams or a new feed to attach to?
                          if(msg["streams"]) {
                            let streams = msg["streams"];
                            for(let i in streams) {
                              let stream = streams[i];
                              stream["id"] = myid;
                              stream["display"] = myusername;
                            }
                            feedStreams[myid] = {
                              id: myid,
                              display: myusername,
                              streams: streams
                            }
                          } else if(msg["publishers"]) {
                            let list = msg["publishers"];
                            Janus.debug("Got a list of available publishers/feeds:", list);
                            let sources = null;
                            for(let f in list) {
                              if(list[f]["dummy"])
                                continue;
                              let id = list[f]["id"];
                              let display = list[f]["display"];
                              let streams = list[f]["streams"];
                              for(let i in streams) {
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
                              Janus.debug("  >> [" + id + "] " + display + ":", streams);
                              if(!sources)
                                sources = [];
                              sources.push(streams);
                            }
                            if(sources)
                              subscribeTo(sources);
                          } else if(msg["leaving"]) {
                            // One of the publishers has gone away?
                            let leaving = msg["leaving"];
                            Janus.log("Publisher left: " + leaving);
                            unsubscribeFrom(leaving);
                          } else if(msg["unpublished"]) {
                            // One of the publishers has unpublished?
                            let unpublished = msg["unpublished"];
                            Janus.log("Publisher left: " + unpublished);
                            if(unpublished === 'ok') {
                              // That's us
                              sfutest.hangup();
                              return;
                            }
                            unsubscribeFrom(unpublished);
                          } else if(msg["error"]) {
                            if(msg["error_code"] === 426) {
                              // This is a "no such room" error: give a more meaningful description
                             console.log(
                                "<p>Apparently room <code>" + myroom + "</code> (the one this demo uses as a test room) " +
                                "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.cfg</code> " +
                                "configuration file? If not, make sure you copy the details of room <code>" + myroom + "</code> " +
                                "from that sample in your current configuration file, then restart Janus and try again."
                              );
                            } else {
                             console.log(msg["error"]);
                            }
                          }
                        }
                      }
                      if(jsep) {
                        Janus.debug("Handling SDP as well...", jsep);
                        sfutest.handleRemoteJsep({ jsep: jsep });
                        // Check if any of the media we wanted to publish has
                        // been rejected (e.g., wrong or unsupported codec)
                        let audio = msg["audio_codec"];
                        if(mystream && mystream.getAudioTracks() && mystream.getAudioTracks().length > 0 && !audio) {
                          // Audio has been rejected
                          console.log("Our audio stream has been rejected, viewers won't hear us");
                        }
                        let video = msg["video_codec"];
                        if(mystream && mystream.getVideoTracks() && mystream.getVideoTracks().length > 0 && !video) {
                          // Video has been rejected
                          console.log("Our video stream has been rejected, viewers won't see us");
                          // Hide the webcam video
                          // $('#myvideo').hide();
                          // $('#videolocal').append(
                          //   '<div class="no-video-container">' +
                          //   '<i class="fa fa-video-camera fa-5 no-video-icon" style="height: 100%;"></i>' +
                          //   '<span class="no-video-text" style="font-size: 16px;">Video rejected, no webcam</span>' +
                          //   '</div>');
                        }
                      }
                    },
                    onlocaltrack: function(track, on) {
                      Janus.debug(" ::: Got a local track event :::");
                      Janus.debug("Local track " + (on ? "added" : "removed") + ":", track);
                      // We use the track ID as name of the element, but it may contain invalid characters
                      let trackId = track.id.replace(/[{}]/g, "");
                      if(!on) {
                        // Track removed, get rid of the stream and the rendering
                        let stream = localTracks[trackId];
                        if(stream) {
                          try {
                            let tracks = stream.getTracks();
                            for(let i in tracks) {
                              let mst = tracks[i];
                              if(mst)
                                mst.stop();
                            }
                          } catch(e) {}
                        }
                        if(track.kind === "video") {
                          // $('#myvideo' + trackId).remove();
                          localVideos--;
                          if(localVideos === 0) {
                            // No video, at least for now: show a placeholder
                            // if($('#videolocal .no-video-container').length === 0) {
                            //   $('#videolocal').append(
                            //     '<div class="no-video-container">' +
                            //     '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                            //     '<span class="no-video-text">No webcam available</span>' +
                            //     '</div>');
                            // }
                          }
                        }
                        delete localTracks[trackId];
                        return;
                      }
                      // If we're here, a new track was added
                      let stream = localTracks[trackId];
                      if(stream) {
                        // We've been here already
                        return;
                      }
                      // $('#videos').removeClass('hide').show();
                      // if($('#mute').length === 0) {
                      //   // Add a 'mute' button
                      //   $('#videolocal').append('<button class="btn btn-warning btn-xs" id="mute" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;">Mute</button>');
                      //   $('#mute').click(toggleMute);
                      //   // Add an 'unpublish' button
                      //   $('#videolocal').append('<button class="btn btn-warning btn-xs" id="unpublish" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;">Unpublish</button>');
                      //   $('#unpublish').click(unpublishOwnFeed);
                      // }
                      if(track.kind === "audio") {
                        // We ignore local audio tracks, they'd generate echo anyway
                        if(localVideos === 0) {
                          // No video, at least for now: show a placeholder
                          // if($('#videolocal .no-video-container').length === 0) {
                          //   $('#videolocal').append(
                          //     '<div class="no-video-container">' +
                          //     '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                          //     '<span class="no-video-text">No webcam available</span>' +
                          //     '</div>');
                          // }
                        }
                      } else {
                        // New video track: create a stream out of it
                        localVideos++;
                        // $('#videolocal .no-video-container').remove();
                        stream = new MediaStream([track]);
                        localTracks[trackId] = stream;
                        Janus.log("Created local stream:", stream);
                        Janus.log(stream.getTracks());
                        Janus.log(stream.getVideoTracks());
                        // $('#videolocal').append('<video class="rounded centered" id="myvideo' + trackId + '" width=100% autoplay playsinline muted="muted"/>');
                        // Janus.attachMediaStream($('#myvideo' + trackId).get(0), stream);
                        console.log(stream)
                      }
                      if(sfutest.webrtcStuff.pc.iceConnectionState !== "completed" &&
                        sfutest.webrtcStuff.pc.iceConnectionState !== "connected") {
                        // $("#videolocal").parent().parent().block({
                        //   message: '<b>Publishing...</b>',
                        //   css: {
                        //     border: 'none',
                        //     backgroundColor: 'transparent',
                        //     color: 'white'
                        //   }
                        // });
                      }
                    },
                    onremotetrack: function(track, mid, on) {
                      // The publisher stream is sendonly, we don't expect anything here
                    },
                    // oncleanup: function() {
                    //   Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
                    //   mystream = null;
                    //   delete feedStreams[myid];
                    //   $('#videolocal').html('<button id="publish" class="btn btn-primary">Publish</button>');
                    //   $('#publish').click(function() { publishOwnFeed(true); });
                    //   $("#videolocal").parent().parent().unblock();
                    //   $('#bitrate').parent().parent().addClass('hide');
                    //   $('#bitrate a').unbind('click');
                    //   localTracks = {};
                    //   localVideos = 0;
                    // }
                  });
              })
              .catch(console.error)
          })
          .catch(console.error)
      }
    }
  }, [])

  return (
    <>
      <Layout2 />
    </>
  )
}
