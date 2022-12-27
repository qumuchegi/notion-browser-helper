import React, { useCallback, useEffect, useState } from "react"

import {
  cacheAuthInfo,
  clearAllStorage,
  getAuthInfo,
  removeAuthInfoCache
} from "~storage"
import { initNotionClient, killNotionClient } from "~utils/notion/base"

import type { OAuthInfo } from "../type"

export default function useNotionAuth() {
  const [isAuthed, setIsAuthed] = useState(null)
  const [oauthInfo, setOauthInfo] = useState<OAuthInfo>(null)
  // check is authed
  useEffect(() => {
    const checkAuthNotion = async () => {
      try {
        const value = getAuthInfo()
        setIsAuthed(!!value)
        setOauthInfo(value)
      } catch (err) {
        setIsAuthed(false)
      }
    }
    checkAuthNotion()
  }, [])

  const cacheLoginNotion = useCallback((oauthInfo: OAuthInfo) => {
    cacheAuthInfo(oauthInfo)
    initNotionClient(oauthInfo.access_token)
  }, [])

  const loginOut = useCallback(async () => {
    // await removeAuthInfoCache()
    clearAllStorage()
    killNotionClient()
    return true
  }, [])
  return {
    isAuthed,
    oauthInfo,
    cacheLoginNotion,
    loginOut
  }
}
