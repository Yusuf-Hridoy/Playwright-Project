# test-files

One committed file: `small-photo.png`, a 24×24 PNG of about 100 bytes. It is the
good photo the Profile tests upload.

Everything else a test needs is made inside the test, with
`setInputFiles({ name, mimeType, buffer })`:

- the 1.1 MB photo that is too big for the app's 1 MB limit,
- the text file that is the wrong type.

Building those in the test keeps a megabyte of junk out of the repository, and
it says in the test itself exactly what makes the file wrong.
