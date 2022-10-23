import {useEffect, useState} from "react";
import Janus from "@/utils/libs/janus";
import adapter from "webrtc-adapter";
import VideoPlayer from "@/components/common/videoPlayer";
import VideoMainView from "@/components/pages/video/videoMainView";
import VideoSubView from "@/components/pages/video/videoSubView";

export default function Layout2({servers}) {
  const [ initState, initStateSet ] = useState(true)
  const [ janusConnect, janusConnectSet ] = useState(null)


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
                janusConnectSet(session)
              })
              .catch(console.error)
          })
          .catch(console.error)
      }
    }
  }, [])

  const [ subSources, subSourcesSet ] = useState([])
  const [ mypvtidState, mypvtidStateSet ] = useState(null)

  return (
    <>
      <div className="grid grid-cols-6 gap-2 p-2">
        <div className="col-span-5 h-screen">
          <div className=" overflow-hidden rounded-xl max-h-[42rem]">
            <VideoMainView janusConnect={janusConnect} subscribeTo={(source, mypvtid) => {
              console.log("XXX GET FROM SOURCE",mypvtid, source)
              subSourcesSet(source)
              mypvtidStateSet(mypvtid)
            }} />
          </div>
        </div>
        <div className="col-span-1 h-screen space-y-2">
          <div className=" overflow-hidden rounded-xl max-h-[10rem]">
            <VideoSubView janusConnect={janusConnect} sources={subSources} mypvtid={mypvtidState} />
          </div>
          <div className=" overflow-hidden rounded-xl max-h-[10rem]">
            <img className="h-full w-full object-cover "
                 src="https://picsum.photos/240?grayscale&random=3"
                 alt="" />
          </div>
          <div className=" overflow-hidden rounded-xl max-h-[10rem]">
            <img className="h-full w-full object-cover "
                 src="https://picsum.photos/240?grayscale&random=4"
                 alt="" />
          </div>
          <div className="relative overflow-hidden rounded-xl col-span-2 max-h-[10rem]">
            <div
              className="text-white text-xl absolute inset-0  bg-slate-900/80 flex justify-center items-center">
              + 23
            </div>
            <img className="h-full w-full object-cover "
                 src="https://picsum.photos/735?grayscale&random=5"
                 alt="" />
          </div>
        </div>
      </div>
    </>
  )
}