// https://www.emmanuelgautier.com/blog/typescript-extend-window
// Declaring global types on window in order to set the peer objects on them

interface Window {
  SCRIBBLE_SOCK: WebSocket,
  ADMIN_SOCK: WebSocket,
}