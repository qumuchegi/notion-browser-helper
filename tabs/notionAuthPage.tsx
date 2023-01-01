import { Button } from "antd"
import icArrowDouble from "data-base64:~assets/arrow_right_arrow_left_circle.png"
import icNotion from "data-base64:~assets/notion.png"
import React, { useEffect, useState } from "react"

import "./styles/authPage.scss"

import useNotionAuth from "~Hooks/useNotionAuth"
import Logo from "~components/Logo"

export default function NotionAuthPage() {
  const { isAuthed, oauthInfo } = useNotionAuth()

  if (isAuthed === null) {
    return (
      <div className="check-login-status">checking login status..........</div>
    )
  }
  if (isAuthed) {
    return (
      <div className="login-succ-module">
        <Logo />
        <h3 className="login-succ-title">
          welcome! {oauthInfo?.ownerUsername}, you have logined in Notion!
        </h3>
        <h2>
          Now try to click the icon in the upper right corner of your browser to
          open the pop-up window
        </h2>
      </div>
    )
  }
  return (
    <div className="not-login-module">
      <Logo />
      <Button
        type="link"
        href={
          "https://api.notion.com/v1/oauth/authorize?" +
          "owner=user" +
          `&client_id=${process.env.NOTION_AUTH_CLIENT_SECRET}` +
          "&response_type=code"
        }
        className="login-url"
        target="_blank"
        onClick={() => window.close()}>
        Login In Notion
      </Button>
      {/* <Button
        onClick={() => {
          chrome.cookies.get(
            { url: "https://www.chegi.fun", name: "oauthInfo" },
            (cookies) => {
              console.log({
                cookies,
                value: JSON.parse(decodeURIComponent(cookies.value))
              })
            }
          )
        }}>
        try to get cookies
      </Button> */}
    </div>
  )
}
