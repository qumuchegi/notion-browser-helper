import icNotion from "data-base64:~/assets/icon.png"
import * as React from "react"

import "./style.scss"

export default function Logo({
  size
}: {
  size?: { width: number; height: number }
}) {
  return (
    <img
      src={icNotion}
      className="logo"
      style={
        size ? { width: size.width + "px", height: size.height + "px" } : {}
      }
    />
  )
}
