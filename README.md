# Take-Home Project

## Goal

Build a small React + TypeScript application that lets a user list, create, update, and delete Scenes, upload viewer assets to Supabase Storage (local), and integrate the Tech Soft 3D assembly_creator demo as code (no iframes) to preview/edit a scene.

Keep it simple. Make pragmatic choices. The bonus is how you design and structure the app.

---

## What to Build

A minimal app with three flows:

1. **Scenes List** – show all of your scenes (sorted by `updatedAt`) with create/edit/delete.
2. **Scene Editor** – form (name, description) + file upload(s) saved to Supabase Storage.
3. **Scene Viewer** – renders at least one uploaded model via a component you build by integrating Tech Soft 3D's `assembly_creator` code directly (no iframe), loading files from Supabase Storage URLs.

All viewer files must be stored in local Supabase Storage.

---

## Data Handling

Use Supabase locally for persistence. You decide the table/storage structure, as long as Scenes and their associated files can be created, listed, updated, deleted, and loaded into the viewer.

---

## Requirements

- React + TypeScript (any setup).
- Supabase (local) only for storing and managing Scenes (name + description + timestamps).
- Viewer: integrate the `assembly_creator` code directly as a React component and use the sample `.scs` files already included in the HOOPS example.
- Delete a scene should remove it from your Supabase data.

No file uploads. No storage bucket configuration. Just use the example `.scs` files for viewing.

---

## Deliverables

Submit a pull request link to your repository. The PR should contain:

- The full working application.
- A short `README.md` explaining how to run it.

## Notes

- Use no iframe for the 3D viewer; integrate `assembly_creator` directly.
- Keep the instructions lean; the focus is your application design and implementation.
- Any model format supported by your `assembly_creator` integration is acceptable.
- `assembly_creator` Github repo link <https://github.com/techsoft3d/assembly_creator>
- Hoops Web Viewer Documentation <https://docs.techsoft3d.com/hoops/visualize-web/>
