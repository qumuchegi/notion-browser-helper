import { Button } from "antd"
import React, { useEffect, useState } from "react"

import useNotionAuth from "~Hooks/useNotionAuth"

import "./style.scss"

export default function NotionLogin({
  notLoginFallback,
  loginedRender
}: {
  notLoginFallback?: JSX.Element
  loginedRender?: JSX.Element
}) {
  const { isAuthed, oauthInfo, loginIn, loginOut } = useNotionAuth()
  if (isAuthed === null) {
    return (
      <div className="check-login-status">checking login status..........</div>
    )
  }
  if (isAuthed) {
    return (
      <div className="login-succ">
        <h3 className="login-succ-title">
          welcome! {oauthInfo?.ownerUsername}, you have logined in Notion!
        </h3>
        {loginedRender}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "30px"
          }}>
          <Button onClick={() => loginOut(() => {})}>login out</Button>
        </div>
      </div>
    )
  }
  return (
    <div className="not-login-body">
      <Button
        type="link"
        // href={
        //   "https://api.notion.com/v1/oauth/authorize?" +
        //   "owner=user" +
        //   `&client_id=${process.env.NOTION_AUTH_CLIENT_SECRET}` +
        //   "&response_type=code"
        // }
        onClick={() => {
          window.open("/tabs/notionAuthPage.html")
        }}
        className="login-url"
        // target="_blank"
      >
        Login In Notion
      </Button>
      {notLoginFallback}
    </div>
  )
}
