require("@/utils/firebase")
import Head from 'next/head'
import '../styles/globals.css'
import {useEffect, useState} from "react"
import BrowserContext from "@/contexts/BrowserContext"

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    winWidth: undefined,
    winHeight: undefined,
  })

  const [scroll, setScroll] = useState({
    scrollX: undefined,
    scrollY: undefined,
  })

  useEffect(() => {
    if (typeof window !== undefined) {
      function handleResize() {
        setWindowSize({
          winWidth: window.innerWidth,
          winHeight: window.innerHeight,
        })
      }

      window.addEventListener("resize", handleResize)
      handleResize()
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== undefined) {
      function handleScroll() {
        setScroll({
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        })
      }

      window.addEventListener("scroll", handleScroll)
      handleScroll()
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return {
    winWidth: windowSize.winWidth,
    winHeight: windowSize.winHeight,
    scrollX: scroll.scrollX,
    scrollY: scroll.scrollY,
  }
}

export default function _App({ Component, pageProps }) {
  const { winWidth, winHeight, scrollX, scrollY } = useWindowSize()

  return (
    <BrowserContext.Provider value={{
      winWidth: winWidth === undefined ? 1920 : winWidth,
      winHeight: winHeight === undefined ? 1080 : winHeight,
      scrollX: scrollX === undefined ? 0 : scrollX,
      scrollY: scrollY === undefined ? 0 : scrollY
    }}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title />
      </Head>
      <Component {...pageProps} />
    </BrowserContext.Provider>
  )
}
