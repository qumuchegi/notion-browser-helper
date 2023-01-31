import icBookmark from "data-base64:~/assets/bookmark.png"
import * as React from "react"

import "./style.scss"

export default function SyncBookmark() {
  return (
    <div className="sync-bookmark-entry">
      <a
        className="operation-btn"
        target="_blank"
        href={`/tabs/syncBookmarkPage.html`}>
        <img src={icBookmark} className="sync-bookmark-icon" />
        sync bookmark to notion &gt;{" "}
      </a>
    </div>
  )
}
