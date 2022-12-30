export {}
interface IBookmarkChangeHandler {
  (id: string, changeInfo: chrome.bookmarks.BookmarkChangeInfo): void
}
interface IBookmarkCreateHandler {
  (id: string, bookmark: chrome.bookmarks.BookmarkTreeNode): void
}
interface IBookmarkRemoveHandler {
  (id: string, removeInfo: chrome.bookmarks.BookmarkRemoveInfo): void
}
interface IBookmarkMoveHandler {
  (id: string, moveInfo: chrome.bookmarks.BookmarkMoveInfo): void
}
interface IBookmarkImportedHandler {
  (): void
}
type Listener =
  | {
      listenerId: string
      type: "bookmarkChange"
      listener: IBookmarkChangeHandler
    }
  | {
      listenerId: string
      type: "bookmarkCreate"
      listener: IBookmarkCreateHandler
    }
  | {
      listenerId: string
      type: "bookmarkDelete"
      listener: IBookmarkRemoveHandler
    }
  | {
      listenerId: string
      type: "bookmarkMove"
      listener: IBookmarkMoveHandler
    }
  | {
      listenerId: string
      type: "bookmarkImported"
      listener: IBookmarkImportedHandler
    }

let listeners: Listener[] = []

function addBookmarkChangeListener(_listeners: Listener[]) {
  const newListener = _listeners.filter((l) => {
    return (
      listeners.findIndex(
        (_l) => _l.listenerId === l.listenerId && _l.type === l.type
      ) === -1
    )
  })
  // console.log({ newListener, listeners, _listeners })
  listeners.push(...newListener)
  onBookMarkChange(listeners)
}

function onBookMarkChange(listeners: Listener[]) {
  listeners.forEach(({ type, listener }) => {
    if (type === "bookmarkChange") {
      chrome.bookmarks.onChanged.addListener(listener)
    } else if (type === "bookmarkCreate") {
      chrome.bookmarks.onCreated.addListener(listener)
    } else if (type === "bookmarkDelete") {
      chrome.bookmarks.onRemoved.addListener(listener)
    } else if (type === "bookmarkMove") {
      chrome.bookmarks.onMoved.addListener(listener)
    } else if (type === "bookmarkImported") {
      chrome.bookmarks.onImportEnded.addListener(listener)
    }
  })
}

export function addBookmarkListenerOnAllEvent(
  listenerId: string,
  listenerCallback: () => void
) {
  addBookmarkChangeListener([
    {
      type: "bookmarkChange",
      listenerId,
      listener: (id, changeInfo) => {
        // console.log("bookmarkChange", { id, changeInfo })
        listenerCallback()
      }
    },
    {
      type: "bookmarkCreate",
      listenerId,
      listener: (id, bookmark) => {
        // console.log("bookmarkCreate", { id, bookmark })
        listenerCallback()
      }
    },
    {
      type: "bookmarkDelete",
      listenerId,
      listener: (id, removeInfo) => {
        // console.log("bookmarkDelete", { id, removeInfo })
        listenerCallback()
      }
    },
    {
      type: "bookmarkMove",
      listenerId,
      listener: (id, moveInfo) => {
        // console.log("bookmarkMove", { id, moveInfo })
        listenerCallback()
      }
    },
    {
      type: "bookmarkImported",
      listenerId,
      listener: () => {
        // console.log("bookmarkImported")
        listenerCallback()
      }
    }
  ])
}
