import * as reqHeader from "@/constants/reqHeader";
import makeRandomStr from "@/utils/common/makeRandomStr";
import uuid from "react-uuid";

async function homeGetServerSideProps(ctx) {
  const browser = ctx.req.headers[reqHeader.BROWSER_UA];
  const userAgent = ctx.req.headers[reqHeader.USER_AGENT];
  const platform = ctx.req.headers[reqHeader.PLATFORM_UA];
  const forwarded = ctx.req.headers[reqHeader.CLIENT_IP_FORWARDED];
  const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : ctx.req.socket.remoteAddress;
  const clientRandId = ctx.query?.name || makeRandomStr(9);
  const clientId = uuid();
  let server;
  let subServer;

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
      servers: [server],
      serverSubscriber: [subServer],
      clientInfo: {
        clientRandId: clientRandId,
        ip: ip || '',
        browser: browser || '',
        userAgent: userAgent || '',
        platform: platform || '',
        myName: ctx.query?.name || clientRandId,
        clientId: clientId || '',
        roomId: process.env.FIX_ROOM_ID,
        appDomain: process.env.APP_DOMAIN,
      }
    },
  }
}

export default homeGetServerSideProps;
