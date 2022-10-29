import Janus from "@/utils/libs/janus";
import adapter from "webrtc-adapter";

async function createNewJanus () {
  return new Promise((resolve, reject) => {
    Janus.init({
      debug: 'error',
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

export default createNewJanus;
