\# Feature Feedback



\## Keep (works, valuable)

\-



\## Fix (works but wrong)

* Home page should have Recent: last 3 songs and last album worked on, then the Idea Pool, a list of all ideas (filterable by type and a search bar).
* On home, If no ideas exist in idea pool, an empty idea should be CTA to new idea (quick capture)
* On home, If no songs exists, an empty song should be CTA to new song
* On home, If no albums exists, an empty album should be CTA to new album
* Note picker takes too long to use. Picking different octaves, then duration, then root - then either note or chord is just too clunky. We need to explore different modalities or from different apps or systems to improve this. Then editing notes you have isn't really possible. And duration isn't displayed. This has to skirt the line between rapid idea input but not so complex as to be building a full midi editor.
* Patch loading takes too long. Either we are using too big of libraries or approaching it in the wrong way. Patch swapping should be super quick and fluid, even at the detriment of quality.
* Play behavior on anything should always be a loop, not a one-shot
* song status should be a slider, not a drop-down (for final UI) because this exposes the stages of making a song
* album status should also be a slider
* Key selection should be a dropdown, not freeform
* ideas should be able to 1. Turned into a song 2. Moved to a song 3. Copied to a song (idea also stays in pool, but a new copy goes into the song) 4. Copied into a new song
* ideas in songs should also be able to be 1.) kicked back out to idea pool 2.) copied out to idea pool (idea also stays in song)
* when importing from idea pool, again should be able to copy idea in, not just pull in
* text/lyrics shouldn't be an option in quick capture (or anywhere) it should just always be there like role, instrument, etc. And it should just be Lyrics not text/lyrics because we already notes.
* metronome only plays once. if you uncheck it stops playing. but re-checking does not play it again
* references either in album or song should be text (and/or) a link (and/or) attachment (audio or image or document)
* notes in album



\## Cut (built it, don't need it)

* We don't need New Idea on the homepage. It's not useful because it's an incomplete idea capture. So just remove it
* in quick capture record, we don't also need import audio there because we have a separate dedicated function for that
* albums don't need subtitles
* we do not need a rich-text editor anywhere. this just adds complexity
* 



\## Missing (need it, don't have it)

* Saved list of instruments that a user can edit. I shouldn't have to retype my instruments every single time. Either select from dropdown or Add New. Instrument is defined by Name and Type. Type should help auto populate audio preview patch. If I select my Bass Guitar, then the audio patch should auto match. If my instrument is a type of Synth (hardware or VST) then I now should also get a Patch input. Patches are a number or name. Instruments would also be a list/page manageable just like idea, song, album
* ideas should be treated the same as songs and albums. They also belong in the main nav. They should have their own page just like songs and albums
* songs should 1.) list what album they are in 2.) can be on any number of albums (no exclusivity)
* I should be able to hit "play" anywhere I see an idea (instead of having to click into it) that has 1.) an audio file or 2.) a midi attached. If it has both, we can show two types of buttons.
* songs should have a todo list that is text + (optional) timestamp in minutes and seconds. user can then check things off the todo list (they get crossed off, but not gone), re-sort todo list and delete todo list items. This probably makes sense to surface to the homepage in some form as workflow for users.
* songs should also be able to have the actual song attached to them (audio file) so from anywhere the user can play the song back. Songs should be able to have unlimited versions attached to them - with one version selectable as "main"

