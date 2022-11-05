import Head from "next/head";
import { useContext, useEffect } from "react";
import MainLayout from "@/components/pages/video/mainLayout";
import {getDatabase, onValue, ref} from "firebase/database";
import { RoomContext } from "@/contexts/RoomContext";
import roomCtAction from "@/constants/roomCtAction";
import TopHeader from "@/components/pages/video/topHeader";
import {RoomGlobalContext} from "@/contexts/RoomGlobalContext";
import roomGlobalCtAction from "@/constants/roomGlobalCtAction";
import {withIronSessionSsr} from "iron-session/next";
import * as reqHeader from "@/constants/reqHeader";
import makeRandomStr from "@/utils/common/makeRandomStr";
import uuid from "react-uuid";
import {sessionOptions} from "@/utils/auth/session";
import {UserContext} from "@/contexts/UserContext";

const db = getDatabase();
const dbRoomRef = ref(db, `videoroom/${process.env.FIX_ROOM_ID}`);

export const getServerSideProps = withIronSessionSsr(async function (ctx) {
  const browser = ctx.req.headers[reqHeader.BROWSER_UA];
  const userAgent = ctx.req.headers[reqHeader.USER_AGENT];
  const platform = ctx.req.headers[reqHeader.PLATFORM_UA];
  const forwarded = ctx.req.headers[reqHeader.CLIENT_IP_FORWARDED];
  const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : ctx.req.socket.remoteAddress;
  const clientRandId = ctx.query?.name || makeRandomStr(9);
  const clientId = uuid();
  const user = ctx.req.session.user;
  let server;
  let subServer;

  if (user === undefined) {
    ctx.res.setHeader("location", "/sign-in");
    ctx.res.statusCode = 302;
    ctx.res.end();

    return {
      props: {
        user: { isLoggedIn: false },
      },
    };
  }

  switch (ctx.query?.s) {
    case '2':
      server = process.env.JANUS_SECOND_SERVER;
      subServer = process.env.JANUS_DEFAULT_SERVER;
      break;
    default:
      server = process.env.JANUS_DEFAULT_SERVER;
      subServer = process.env.JANUS_SECOND_SERVER;
      break;
  }

  return {
    props: {
      user: ctx.req.session.user,
      servers: [server],
      serverSubscriber: [subServer],
      nameQuery: ctx.query?.name || '',
      clientInfo: {
        clientRandId: clientRandId,
        ip: ip || '',
        browser: browser || '',
        userAgent: userAgent || '',
        platform: platform || '',
        clientId: clientId || '',
        roomId: process.env.FIX_ROOM_ID,
        appDomain: process.env.APP_DOMAIN,
      }
    },
  }
}, sessionOptions);

export default function Home({ user, servers, clientInfo, serverSubscriber, nameQuery }) {
  /**
   * Prepare state and function.
   */
  const { roomState, roomDispatch } = useContext(RoomContext);
  const { userState, userDispatch } = useContext(UserContext);
  const { roomGlobalState, roomGlobalDispatch } = useContext(RoomGlobalContext);
  const dpPushClientPayload = {type: roomCtAction.PUSH_CLIENTS, payload: { clientId: clientInfo.clientId }}
  const dpSetMyNamePayload = {type: roomCtAction.SET_MY_NAME, payload: { displayName: user.displayName }}
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
    if (user) {
      userDispatch({
        type: 'set-user',
        payload: {
          uid: user.uid,
          displayName: user.displayName,
          imageUrl: user.imageUrl,
        }
      })
    }
  }, []);


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
        currentUser={user}
        nameQuery={nameQuery}
      />
    </>
  )
}
