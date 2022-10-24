import Head from "next/head";
import MainLayout from "@/components/pages/video/mainLayout";
const Janus = require('../utils/libs/janus');

export async function getServerSideProps({req}) {
  const forwarded = req.headers['x-forwarded-for'];
  const browser = req.headers['sec-ch-ua'];
  const userAgent = req.headers['user-agent'];
  const platform = req.headers['sec-ch-ua-platform'];
  const ip = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : req.socket.remoteAddress;

  return {
    props: {
      servers: [process.env.JANUS_DEFAULT_SERVER],
      clientInfo: {
        ip: ip || '',
        browser: browser || '',
        userAgent: userAgent || '',
        platform: platform || ''
      }
    },
  }
}

export default function Home({ servers, clientInfo }) {
  return (
    <>
      <Head>
        <title>Demo JANUS (multistream) with ReactJS</title>
      </Head>
      <div className="py-2">
        <div className="container m-auto px-6 text-gray-600 md:px-12 xl:px-6">
          <div className="mb-4 space-y-2 text-center">
            <span className="block w-max mx-auto px-3 py-1.5 border border-green-200 rounded-full bg-green-100 text-green-600">DEMO</span>
            <h2 className="text-2xl text-cyan-900 font-bold md:text-4xl">Demo JANUS (multistream) with ReactJS</h2>
          </div>
        </div>
      </div>
      <MainLayout servers={servers} clientInfo={clientInfo} />
    </>
  )
}
