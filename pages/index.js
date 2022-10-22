import Layout2 from "@/components/pages/video/layout2";
const Janus = require('../utils/libs/janus')
import {useEffect} from "react";
import adapter from "webrtc-adapter";

export async function getServerSideProps() {
  return {
    props: {
      servers: [process.env.JANUS_DEFAULT_SERVER]
    },
  }
}

export default function Home({ servers }) {
  useEffect(() => {
    if (window) {
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

      createNewJanus().then(() => { createJanusSession().catch(console.error) }).catch(console.error)
    }
  }, [])

  return (
    <>
      <Layout2 />
    </>
  )
}
