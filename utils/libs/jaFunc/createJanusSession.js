import Janus from "@/utils/libs/janus";

async function createJanusSession (serv) {
  let session

  return new Promise((resolve, reject) => {
    const config = {
      server: serv,
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

export default createJanusSession;
