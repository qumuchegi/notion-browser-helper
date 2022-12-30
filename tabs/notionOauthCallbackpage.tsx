import React, { useEffect, useState } from "react"

import useNotionAuth from "~Hooks/useNotionAuth"
import Logo from "~components/Logo"

import "./styles/authCallback.scss"

export default function NotionOauthCallbackPage() {
  const [closeTime, setCloseTime] = useState(5)
  const { cacheLoginNotion } = useNotionAuth()

  // parse oauth info
  useEffect(() => {
    try {
      const oauthInfoStr = window.location.search.replace("?oauthToQs=", "")
      const oauthObj = JSON.parse(decodeURIComponent(oauthInfoStr))
      // console.log({ oauthObj })
      cacheLoginNotion(oauthObj)
      setInterval(() => {
        setCloseTime((pre) => {
          if (--pre === 0) {
            window.close()
          }
          return pre
        })
      }, 1000)
    } catch (err) {
      alert(err)
    }
  }, [])

  return (
    <div className="body">
      <div>
        <Logo />
      </div>
      <h1>
        login in Notion success! please try to re-open the extension popup
      </h1>
      <h3>
        current tab will self close after{" "}
        <span style={{ color: "red" }}>{closeTime}</span> second
      </h3>
    </div>
  )
}
