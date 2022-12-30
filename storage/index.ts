import { AUTH_CACHE_KEY, DATABASE_ID_KEY, PAGE_ID_KEY } from "~constant"
import type { OAuthInfo } from "~type"

const storage = window.localStorage

export const cacheAuthInfo = (oauthInfo: OAuthInfo) => {
  return storage.setItem(AUTH_CACHE_KEY, JSON.stringify(oauthInfo))
}
export const getAuthInfo = () => {
  return JSON.parse(storage.getItem(AUTH_CACHE_KEY))
}
export const removeAuthInfoCache = () => {
  return storage.removeItem(AUTH_CACHE_KEY)
}
export const cacheSyncBookmarkPageId = (syncTargetNotionPageId: string) => {
  const cachedPageIds = getAllSyncBookmarkToPageIds()
  storage.setItem(
    PAGE_ID_KEY,
    [...new Set(cachedPageIds), syncTargetNotionPageId].join("|")
  )
}
export const getAllSyncBookmarkToPageIds = () => {
  const cached = storage.getItem(PAGE_ID_KEY)
  return (cached || "").split("|").filter((i) => !!i)
}
export const checkCachedSyncBookmarkPageId = (
  syncTargetNotionPageId: string
) => {
  const cachedPageIds = getAllSyncBookmarkToPageIds()
  return cachedPageIds.findIndex((id) => id === syncTargetNotionPageId) !== -1
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
export const getBookmarkBlockIdByPageId = (pageId: string) => {
  return {
    bookmarkBlockIds: storage
      .getItem(DATABASE_ID_KEY + "-bookmark-content-" + pageId)
      ?.split("|"),
    statusBlockId: storage.getItem(
      DATABASE_ID_KEY + "-bookmark-status-" + pageId
    )
  }
}

export const clearAllStorage = () => {
  storage.clear()
}
