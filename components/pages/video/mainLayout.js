import {useContext, useEffect, useState} from "react";
import createNewJanus from "@/utils/libs/jaFunc/createNewJanus";
import createJanusSession from "@/utils/libs/jaFunc/createJanusSession";
import {RoomContext} from "@/contexts/RoomContext";
import roomCtAction from "@/constants/roomCtAction";
import VideoLocalSection from "@/components/pages/video/videoLocalSection";
import VideoRemoteSection from "@/components/pages/video/videoRemoteSection";

export default function MainLayout({servers, serverSubscriber, clientInfo, db, dbRoomRef}) {
  const { roomState, roomDispatch } = useContext(RoomContext);
  const [ initState, initStateSet ] = useState(true)
  const [ janusConnect1, janusConnect1Set ] = useState(null)
  const [ janusConnect2, janusConnect2Set ] = useState(null)
  const [ subSources1, subSources1Set ] = useState([])
  const [ myPvtIdState1, myPvtIdState1Set ] = useState(null)
  const [ subSources2, subSources2Set ] = useState([])
  const [ myPvtIdState2, myPvtIdState2Set ] = useState(null)

  useEffect(() => {
    if (window && initState) {
      initStateSet(false)

      return () => {
        createNewJanus()
          .then(() => createJanusSession(servers)
            .then(session => {
              roomDispatch({
                type: roomCtAction.SET_SESSION_ATTACHED,
                payload: {
                  clientId: clientInfo.clientId,
                  sessionId: session.getSessionId(),
                  server: session.getServer(),
                }
              })
              janusConnect1Set(session)
            })
            .catch(console.error))
          .catch(console.error)

        createNewJanus()
          .then(() => createJanusSession(serverSubscriber)
            .then(session => {
              roomDispatch({
                type: roomCtAction.SET_SESSION_ATTACHED,
                payload: {
                  clientId: clientInfo.clientId,
                  sessionId: session.getSessionId(),
                  server: session.getServer(),
                }
              })
              janusConnect2Set(session)
            })
            .catch(console.error))
          .catch(console.error)
      }
    }
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full">
        <VideoLocalSection
          janusConnect1={janusConnect1}
          janusConnect2={janusConnect2}
          clientInfo={clientInfo}
          subSources1Set={subSources1Set}
          myPvtIdState1Set={myPvtIdState1Set}
          subSources2Set={subSources2Set}
          myPvtIdState2Set={myPvtIdState2Set}
          db={db}
          dbRoomRef={dbRoomRef}
        />
        <VideoRemoteSection
          janusConnect1={janusConnect1}
          janusConnect2={janusConnect2}
          clientInfo={clientInfo}
          db={db}
          dbRoomRef={dbRoomRef}
          subSources1={subSources1}
          subSources2={subSources2}
          myPvtId1={myPvtIdState1}
          myPvtId2={myPvtIdState2}
          subscribeTo1={(source, mypvtid) => {
            subSources1Set(source)
            myPvtIdState1Set(mypvtid)
          }}
          subscribeTo2={(source, mypvtid) => {
            subSources2Set(source)
            myPvtIdState2Set(mypvtid)
          }}
        />
      </div>
    </>
  )
}
