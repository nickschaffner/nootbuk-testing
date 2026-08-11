\# Known Issues / TODO



\## Phase 5: MIDI Recording

\- \[ ] Metronome stops when MIDI recording starts and won't restart. Likely Tone.js transport/scheduling conflict.

\- \[ ] Test Bluetooth MIDI controller

\- \[ ] Test Web MIDI fallback messaging in Safari and Firefox





\## Phase 7: Quick Capture

\- \[ ] Image attachments save but don't display a preview/thumbnail in Quick Capture or Idea Detail



\## Phase 8: Audio-to-MIDI

\- \[ ] Audio-to-MIDI conversion is slow/clunky — consider showing progress percentage or a more informative loading state

\- \[ ] Cannot select synth patch for MIDI preview after extraction — defaults to whatever patch is loaded

\- \[ ] Extract MIDI should be available inside Quick Capture on audio blocks, not just in Idea Detail



\## Phase 12: Integration Testing (deferred)

\- \[ ] Capture → export: Ctrl+Shift+C → add audio + text → Save to Pool → open idea → Move to Song → Export → Download ZIP → verify audio/, notes/lyrics.txt

\- \[ ] Audio-to-MIDI: Idea Detail → Extract MIDI → Save MIDI → Export song → open .mid in a DAW

\- \[ ] DnD: drag ideas within/between sections; drag section handles; drag album tracks

\- \[ ] Shortcut: Ctrl+Shift+C from home (not while typing in a field)

\- \[ ] Edge cases: disconnect MIDI mid-record; try export in Firefox (ZIP only, with notice)

