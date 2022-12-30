import React, { useEffect } from "react"

import useNotionAuth from "~Hooks/useNotionAuth"
import Logo from "~components/Logo"

import "./styles/authCallback.scss"

export default function NotionOauthCallbackPage() {
  const { cacheLoginNotion } = useNotionAuth()

  // parse oauth info
  useEffect(() => {
    try {
      const oauthInfoStr = window.location.search.replace("?oauthToQs=", "")
      const oauthObj = JSON.parse(decodeURIComponent(oauthInfoStr))
      // console.log({ oauthObj })
      cacheLoginNotion(oauthObj)
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
    </div>
  )
}
