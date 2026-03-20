A search input that fetches results live as you type — exactly like Google Suggest or Spotify's search. Uses debounce to prevent flooding the API, AbortController to cancel stale requests, and keyboard navigation for accessibility.

What is in this project:
Search the iTunes API for any artist, song, or album in real time.
Results appear 300ms after the user stops typing — debounced.
Stale requests are cancelled with AbortController — no race conditions.
Keyboard navigation: arrow keys move through results, Enter selects.
Recent searches saved to localStorage — persist across page reloads.
Loading spinner, empty state, and error state all handled.
