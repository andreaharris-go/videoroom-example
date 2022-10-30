import Head from "next/head";
import { useContext, useEffect } from "react";
import MainLayout from "@/components/pages/video/mainLayout";
import {getDatabase, onValue, ref} from "firebase/database";
import { RoomContext } from "@/contexts/RoomContext";
import roomCtAction from "@/constants/roomCtAction";
import TopHeader from "@/components/pages/video/topHeader";
import homeGetServerSideProps from "@/utils/server/homeGetServerSideProps";
import {RoomGlobalContext} from "@/contexts/RoomGlobalContext";
import roomGlobalCtAction from "@/constants/roomGlobalCtAction";

const db = getDatabase();
const dbRoomRef = ref(db, `videoroom/${process.env.FIX_ROOM_ID}`);

export const getServerSideProps = async (ctx) => homeGetServerSideProps(ctx)

export default function Home({ servers, clientInfo, serverSubscriber }) {
  /**
   * Prepare state and function.
   */
  const { roomState, roomDispatch } = useContext(RoomContext);
  const { roomGlobalState, roomGlobalDispatch } = useContext(RoomGlobalContext);
  const dpPushClientPayload = {type: roomCtAction.PUSH_CLIENTS, payload: { clientId: clientInfo.clientId }}
  const dpSetMyNamePayload = {type: roomCtAction.SET_MY_NAME, payload: { myName: clientInfo.clientRandId }}
  const dpPushClient = (dpPushClientPayload) => roomDispatch(dpPushClientPayload)
  const dpSetMyName = (dpSetMyNamePayload) => roomDispatch(dpSetMyNamePayload)

  /**
   * Client side do.
   */
  useEffect(() => {
    return () => {
      if (!roomState.clients.includes(clientInfo.clientRandId)) {
        dpPushClient(dpPushClientPayload)
        dpSetMyName(dpSetMyNamePayload)
      }
    };
  }, [clientInfo]);

  useEffect(() => {
    if (!roomGlobalState.roomId) {
      roomGlobalDispatch({
        type: roomGlobalCtAction.SET_ROOM_ID,
        payload: {
          roomId: clientInfo.roomId
        }
      })
    }

    onValue(dbRoomRef, (snapshot) => {
      const data = snapshot.val();
      let ps = [];

      for (let i in data) {
        ps.push(data[i])
      }

      roomGlobalDispatch({
        type: roomGlobalCtAction.SET_PARTICIPANTS,
        payload: {
          participants: ps
        }
      })

      roomGlobalDispatch({
        type: roomGlobalCtAction.SET_PARTICIPANT_COUNT,
        payload: {
          participantCount: ps.length
        }
      })
    });
  }, []);

  return (
    <>
      <Head>
        <title>Demo JANUS (multistream) with ReactJS</title>
      </Head>
      <TopHeader />
      <MainLayout
        servers={servers}
        serverSubscriber={serverSubscriber}
        clientInfo={clientInfo}
        db={db}
        dbRoomRef={dbRoomRef}
      />
    </>
  )
}
