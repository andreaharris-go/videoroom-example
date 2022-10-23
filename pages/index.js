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
  return (
    <>
      <Layout2 servers={servers} />
    </>
  )
}
