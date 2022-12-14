export default function SvgCameraOff({cssClass}) {
  return (
    <svg className={cssClass} fill="none" stroke="currentColor" strokeLinecap="round"
         strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
      <line x1="1" x2="23" y1="1" y2="23"/>
    </svg>
  )
}