import React, { useCallback, useEffect, useRef, useState } from "react"

import { cacheAuthInfo, clearAllStorage, getAuthInfo } from "~storage"
import { initNotionClient, killNotionClient } from "~utils/notion/base"

import type { OAuthInfo } from "../type"

export default function useNotionAuth() {
  const [isAuthed, setIsAuthed] = useState(null)
  const [oauthInfo, setOauthInfo] = useState<OAuthInfo>(null)
  const authWinRef = useRef<Window>()
  const cacheLoginNotion = useCallback((oauthInfo: OAuthInfo) => {
    cacheAuthInfo(oauthInfo)
    return initNotionClient(oauthInfo.access_token)
  }, [])
  // check is authed by first login cookie
  useEffect(() => {
    chrome.cookies.get(
      { url: process.env.NOTION_AUTH_CALLBACK_PAGE_URL, name: "oauthInfo" },
      async (cookies) => {
        try {
          console.log({ cookies })
          const authInfoObj = JSON.parse(decodeURIComponent(cookies.value))
          setOauthInfo(authInfoObj)
          await cacheLoginNotion(authInfoObj)
          setIsAuthed(!!authInfoObj)
        } catch (err) {
          console.error(err)
        }
      }
    )
  }, [cacheLoginNotion])
  // check is authed by local storage
  useEffect(() => {
    const checkAuthNotion = async () => {
      try {
        const value = getAuthInfo()
        await cacheLoginNotion(value)
        setIsAuthed(!!value)
        setOauthInfo(value)
      } catch (err) {
        setIsAuthed(false)
      }
    }
    checkAuthNotion()
  }, [cacheLoginNotion])

  const loginIn = useCallback(() => {
    authWinRef.current = window.open(
      "https://api.notion.com/v1/oauth/authorize?" +
        "owner=user" +
        `&client_id=${process.env.NOTION_AUTH_CLIENT_SECRET}` +
        "&response_type=code"
    )
  }, [])
  const loginOut = useCallback(async (onLoginOut?: () => void) => {
    // update current state
    setIsAuthed(false)
    setOauthInfo(null)
    // update storage
    clearAllStorage()
    killNotionClient()
    // update auth suotrce
    chrome.cookies.remove({
      url: process.env.NOTION_AUTH_CALLBACK_PAGE_URL,
      name: "oauthInfo"
    })
    onLoginOut?.()

    return true
  }, [])
  return {
    isAuthed,
    oauthInfo,
    cacheLoginNotion,
    loginIn,
    loginOut
  }
}
