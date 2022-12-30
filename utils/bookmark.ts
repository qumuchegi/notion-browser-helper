export const getBookmarkTree = async (): Promise<
  chrome.bookmarks.BookmarkTreeNode[]
> => {
  return new Promise((res) => {
    chrome.bookmarks.getTree((bookmarkTree) => res(bookmarkTree))
  })
}
