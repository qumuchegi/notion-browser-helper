import { accessNotionWrapper } from "./base"
import type { AccessNotionWrappedFn } from "./base"

type Params = {
  pageIds: string[]
}
export type PageInfo = {
  id: string
  title: string
  url: string
}
const retriveNotionPages: AccessNotionWrappedFn<Params, PageInfo[]> = async (
  client,
  params
) => {
  const { pageIds } = params
  const pages = await Promise.allSettled(
    pageIds.map(async (id) => {
      const res = await client.pages.retrieve({
        page_id: id
      })
      return {
        id,
        //@ts-ignore
        title: res.properties?.title?.title?.[0]?.plain_text,
        //@ts-ignore
        url: res.url
      }
    })
  )
  return pages
    .map((r) => {
      if (r.status === "fulfilled") {
        return r.value
      } else {
        return null
      }
    })
    .filter((i) => !!i)
}

export default accessNotionWrapper(retriveNotionPages)
