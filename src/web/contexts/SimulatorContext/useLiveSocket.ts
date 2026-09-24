import { useEffect, useState } from 'react'
import type { ServerMessage } from '../../../shared/snapshot'

const RECONNECT_MS = 1500

export function useLiveSocket(onMessage: (message: ServerMessage) => void): boolean {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let socket: WebSocket | null = null
    let retry: number | undefined
    let disposed = false

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      socket = new WebSocket(`${protocol}://${window.location.host}/ws`)
      socket.onopen = () => setConnected(true)
      socket.onmessage = (event) => onMessage(JSON.parse(String(event.data)) as ServerMessage)
      socket.onclose = () => {
        setConnected(false)
        if (!disposed) retry = window.setTimeout(connect, RECONNECT_MS)
      }
    }

    connect()
    return () => {
      disposed = true
      window.clearTimeout(retry)
      socket?.close()
    }
  }, [onMessage])

  return connected
}
