export { addBookmarkChangeListener }
interface IBookmarkChangeHandler {
  (id: string, changeInfo: chrome.bookmarks.BookmarkChangeInfo): void
}
interface IBookmarkCreateHandler {
  (id: string, bookmark: chrome.bookmarks.BookmarkTreeNode): void
}

type Listener =
  | { type: "bookmarkChange"; listener: IBookmarkChangeHandler }
  | { type: "bookmarkCreate"; listener: IBookmarkCreateHandler }

let listeners: Listener[] = []

function addBookmarkChangeListener(_listeners: Listener[]) {
  listeners.push(..._listeners)
  onBookMarkChange(listeners)
}

function onBookMarkChange(listeners: Listener[]) {
  listeners.forEach(({ type, listener }) => {
    if (type === "bookmarkChange") {
      chrome.bookmarks.onChanged.addListener(listener)
    } else if (type === "bookmarkCreate") {
      chrome.bookmarks.onCreated.addListener(listener)
    }
  })
}

onBookMarkChange(listeners)
