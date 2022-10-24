export default function SvgSpeakerOn({cssClass}) {
  return (
    <>
      <svg viewBox="0 0 256 256" className={cssClass || ''} xmlns="http://www.w3.org/2000/svg">
        <rect fill="none" height="256" width="256"/>
        <path d="M80,168H32a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8H80Z" opacity="0.2"/>
        <path d="M218.9,77.1a71.9,71.9,0,0,1,0,101.8" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <path d="M80,168H32a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8H80l72-56V224Z" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" x1="80" x2="80" y1="88" y2="168"/>
        <path d="M190.6,105.4a31.9,31.9,0,0,1,0,45.2" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    </>
  )
}