/*
"use client"

import { useEffect } from "react"

export function VoiceflowWidget() {
  useEffect(() => {
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src = "https://cdn.voiceflow.com/widget/bundle.mjs"
    script.async = true
    script.onload = () => {
      window.voiceflow.chat.load({
        verify: { projectID: '67744408d18869ad2b731108' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production'
      })
    }
    document.body.appendChild(script)
  }, [])

  return null
}
*/ 