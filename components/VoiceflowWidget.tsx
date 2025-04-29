/*
"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    voiceflow: {
      chat: {
        load: (config: any) => void
      }
    }
  }
}

export function VoiceflowWidget() {
  useEffect(() => {
    console.log('Iniciando carga del widget...')
    
    const script = document.createElement('script')
    script.src = "https://cdn.voiceflow.com/widget/bundle.mjs"
    script.type = "text/javascript"
    script.async = true

    script.onload = () => {
      window.voiceflow.chat.load({
        verify: { projectID: '67744408d18869ad2b731108' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production'
      })
    }

    // Añadir el script al documento
    document.body.appendChild(script)

    // Cleanup
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return null
}
*/ 