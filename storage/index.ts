import { Storage } from "@plasmohq/storage"

import { AUTH_CACHE_KEY, DATABASE_ID_KEY } from "~constant"
import type { OAuthInfo } from "~type"

const storage = localStorage //new Storage()

export const cacheAuthInfo = (oauthInfo: OAuthInfo) => {
  return storage.setItem(AUTH_CACHE_KEY, JSON.stringify(oauthInfo))
}
export const getAuthInfo = () => {
  return JSON.parse(storage.getItem(AUTH_CACHE_KEY))
}
export const removeAuthInfoCache = () => {
  return storage.removeItem(AUTH_CACHE_KEY)
}
export const cacheNotionBlockIdByPageId = (
  pageId: string,
  databaseId: string
) => {
  return storage.setItem(DATABASE_ID_KEY + pageId, databaseId)
}
export const getNotionDatabaseIdByPageId = (pageId: string) => {
  return storage.getItem(DATABASE_ID_KEY + pageId)
}

export const clearAllStorage = () => {
  storage.clear()
}
