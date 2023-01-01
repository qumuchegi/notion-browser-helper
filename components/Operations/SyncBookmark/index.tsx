import icBookmark from "data-base64:~/assets/bookmark.png"
import * as React from "react"

import { test_extension_id } from "~constant"

import "./style.scss"

export default function SyncBookmark() {
  return (
    <div className="sync-bookmark-entry">
      <img src={icBookmark} className="sync-bookmark-icon" />
      <a
        className="operation-btn"
        target="_blank"
        href={`/tabs/syncBookmarkPage.html`}>
        sync bookmark to notion &gt;{" "}
      </a>
    </div>
  )
}
