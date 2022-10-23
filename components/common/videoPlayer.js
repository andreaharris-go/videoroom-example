import {useCallback} from "react";

const VideoPlayer = ({ srcObject, cssClass, ...props }) => {
  const refVideo = useCallback(
    (node) => {
      if (node) {
        if (srcObject) {
          node.srcObject = srcObject
          node.muted = true
        }
      }
    },
    [srcObject],
  )

  return <video className={cssClass} ref={refVideo} {...props} autoPlay muted />
}

export default VideoPlayer
