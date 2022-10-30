import VideoRemoteView from "@/components/pages/video/videoRemoteView";

export default function VideoRemoteSection(
  {
    janusConnect1,
    janusConnect2,
    clientInfo,
    db,
    dbRoomRef,
    subSources1,
    subSources2,
    myPvtId1,
    myPvtId2,
    subscribeTo1,
    subscribeTo2
  }
) {
  return (
    <>
      <VideoRemoteView
        janusConnect={janusConnect1}
        sources={subSources1}
        myPvtId={myPvtId1}
        subscribeTo1={(source, mypvtid) => {
          subscribeTo1(source, mypvtid)
        }}
        clientInfo={clientInfo}
        db={db}
        dbRoomRef={dbRoomRef}
      />

      <VideoRemoteView
        janusConnect={janusConnect2}
        sources={subSources2}
        myPvtId={myPvtId2}
        subscribeTo2={(source, mypvtid) => {
          subscribeTo2(source, mypvtid)
        }}
        clientInfo={clientInfo}
        db={db}
        dbRoomRef={dbRoomRef}
      />
    </>
  )
}
