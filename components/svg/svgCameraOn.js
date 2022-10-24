export default function SvgCameraOn({cssClass}) {
  return (
    <svg className={cssClass || ''} fill="none" stroke="currentColor" strokeLinecap="round"
         strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect height="14" rx="2" ry="2" width="15" x="1" y="5"/>
    </svg>
  )
}