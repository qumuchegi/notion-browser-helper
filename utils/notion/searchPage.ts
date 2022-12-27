import type { SearchResponse } from "@notionhq/client/build/src/api-endpoints"

import { accessNotionWrapper } from "./base"
import type { AccessNotionWrappedFn } from "./base"

type Params = {
  notionPageValue?: string
  lastSearchCusor?: string
  pageSize?: number
}
const searchNotionPage: AccessNotionWrappedFn<Params, SearchResponse> = async (
  client,
  params
) => {
  const { notionPageValue, lastSearchCusor, pageSize } = params
  const res = await client.search({
    sort: {
      timestamp: "last_edited_time",
      direction: "ascending"
    },
    query: notionPageValue,
    page_size: pageSize || 10,
    start_cursor: lastSearchCusor,
    filter: {
      property: "object",
      value: "page"
    }
  })
  return res
}

export default accessNotionWrapper(searchNotionPage)
