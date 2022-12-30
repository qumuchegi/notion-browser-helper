import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import React, { useCallback, useEffect, useRef, useState } from "react"

import searchNotionPage from "~utils/notion/searchPage"

type SearchResultItem = {
  title: string
  pageId: string
  pageUrl: string
  // icon: {
  //   type: ''
  // }
}
export default function useSearchNotionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SearchResultItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const searchValueRef = useRef<string>()
  const searchCusorRef = useRef<string>()

  const search = useCallback(
    async ({ notionPageValue }: { notionPageValue?: string }) => {
      const isRefresh = searchValueRef.current !== notionPageValue
      setIsLoading(true)
      if (isRefresh) {
        searchCusorRef.current = undefined
        setHasMore(true)
        // setResult([])
      }
      const searchRes = await searchNotionPage({
        notionPageValue,
        lastSearchCusor: searchCusorRef.current,
        pageSize: 10
      })
      setIsLoading(false)
      searchCusorRef.current = searchRes.next_cursor || undefined
      setHasMore(searchRes.has_more)
      setResult((pre) => {
        if (isRefresh) {
          return deduplicateResult(
            searchRes.results.map((i: PageObjectResponse) => ({
              //@ts-ignore
              title: i.properties?.title?.title?.[0]?.plain_text,
              pageId: i.id,
              pageUrl: i.url
            }))
          )
        }
        return deduplicateResult(
          pre.concat(
            searchRes.results.map((i: PageObjectResponse) => ({
              //@ts-ignore
              title: i.properties?.title?.title?.[0]?.plain_text,
              pageId: i.id,
              pageUrl: i.url
            }))
          )
        )
      })
    },
    []
  )

  const loadMore = useCallback(() => {
    search({ notionPageValue: searchValueRef.current })
  }, [search])

  return {
    isLoading,
    result,
    search,
    hasMore,
    loadMore
  }
}

function deduplicateResult(result: SearchResultItem[]): SearchResultItem[] {
  return result.reduce((pre, i) => {
    if (pre.findIndex((p) => p.pageId === i.pageId) !== -1) {
      return pre
    } else {
      return [...pre, i]
    }
  }, [])
}
