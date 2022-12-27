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
export const cacheBookmarkNotionBlockIdByPageId = (
  pageId: string,
  bookmarkBlockIds: string[],
  statusBlockId: string
) => {
  storage.setItem(DATABASE_ID_KEY + "-bookmark-status-" + pageId, statusBlockId)
  storage.setItem(
    DATABASE_ID_KEY + "-bookmark-content-" + pageId,
    bookmarkBlockIds.join("|")
  )
}
export const getBookmarkBlockIdByPageId = (
  pageId: string
): [string, string[]] => {
  return [
    storage.getItem(DATABASE_ID_KEY + "-bookmark-status-" + pageId),
    storage.getItem(DATABASE_ID_KEY + "-bookmark-content-" + pageId)?.split("|")
  ]
}

export const clearAllStorage = () => {
  storage.clear()
}
