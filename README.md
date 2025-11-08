# CADRooms Scene Manager

A React + TypeScript application for managing 3D assembly scenes with HOOPS Web Viewer integration and Supabase backend.

## 📋 Project Overview

This project provides a web-based interface for creating, editing, and viewing 3D assembly scenes. Users can:

- Manage scene collections (create, read, update, delete)
- View 3D models using HOOPS Web Viewer
- Drag and drop parts from a library into scenes
- Edit scene assemblies interactively
- Persist scene data in Supabase

## ✨ Features

### Scene Management

- **Scene List**: View all scenes sorted by last update time
- **Create Scene**: Add new scenes with name and description
- **Edit Scene Info**: Update scene metadata
- **Delete Scene**: Remove scenes with confirmation
- **Real-time Updates**: Automatic refresh after modifications

### 3D Viewer

- **HOOPS Integration**: Direct integration of Tech Soft 3D's `assembly_creator` as a React component
- **Parts Library**: Visual catalog of 15 available parts with thumbnails
- **Drag & Drop**: Intuitive part placement in 3D space
- **Interactive View**: Rotate, zoom, and pan the 3D scene
- **Axis Triad**: Visual orientation helper

### Scene Editor

- **Part Management**: Add and remove parts from assemblies
- **Selection**: Click to select parts in the scene
- **Delete Parts**: Remove selected parts from the assembly
- **Save Scenes**: Persist scene state to database

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 7 (rolldown-vite fork)
- **Backend**: Supabase (PostgreSQL + client SDK)
- **3D Viewer**: HOOPS Web Viewer 2024.0.0
- **Package Manager**: pnpm
- **Linting**: ESLint 9 with React plugins

## 📁 Project Structure

```
take-home/
├── public/
│   ├── parts/                      # 3D model files (.scs) and thumbnails
│   │   ├── parts_list.json         # Parts catalog (15 parts)
│   │   ├── housing.scs/.png        # Individual part files
│   │   └── ...
│   └── test-viewer.html            # HOOPS Viewer test page
├── src/
│   ├── components/
│   │   ├── ScenesList.tsx          # Scene management UI (CRUD)
│   │   ├── SceneViewer.tsx         # 3D scene viewer component
│   │   ├── SceneEditor.tsx         # Interactive scene editor
│   │   └── PartsList.tsx           # Draggable parts library
│   ├── lib/
│   │   └── supabase.ts             # Supabase client singleton
│   ├── types/
│   │   ├── index.ts                # Scene type definitions
│   │   └── hoops.d.ts              # HOOPS Web Viewer types
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles
├── supabase/
│   └── migrations/
│       └── 20250108000000_create_scenes_table.sql  # Database schema
├── .env.local                      # Environment variables (gitignored)
├── CLAUDE.md                       # Claude Code usage guide
├── PROJECT_PLAN.md                 # Development progress report
├── README.md                       # English Document
├── README-zh.md                    # Chinese Document
└── package.json                    # Project configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Supabase CLI**: For local development
- **Git**: For version control

### Environment Variables

Create a `.env.local` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_API_KEY=your_supabase_anon_key
```

**Example for local Supabase:**

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_API_KEY=your_local_anon_key
```

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd take-home
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up Supabase**

   **Option A: Use Supabase Cloud**

   - Create a project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env.local`
   - Run migrations (see Database Setup below)

   **Option B: Use Local Supabase**

   ```bash
   # Start Supabase local instance
   supabase start

   # Copy the API URL and anon key to .env.local
   # These will be displayed after starting Supabase
   ```

4. **Run database migrations**

   ```bash
   # For local Supabase
   supabase db reset

   # Or manually execute the migration file
   psql <connection-string> < supabase/migrations/20250108000000_create_scenes_table.sql
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   The application will open at `http://localhost:5173/`

## 📊 Database Schema

### `scenes` Table

| Column        | Type        | Description                  |
| ------------- | ----------- | ---------------------------- |
| `id`          | UUID        | Primary key (auto-generated) |
| `name`        | TEXT        | Scene name (required)        |
| `description` | TEXT        | Scene description (optional) |
| `assets`      | TEXT[]      | Array of asset file names    |
| `created_at`  | TIMESTAMPTZ | Creation timestamp (auto)    |
| `updated_at`  | TIMESTAMPTZ | Last update timestamp (auto) |

**Features:**

- Automatic `updated_at` timestamp via trigger
- Indexed on `updated_at` for efficient sorting
- UUID primary keys for global uniqueness

## 🎮 Usage Guide

### Managing Scenes

1. **Create a Scene**

   - Click "Create New Scene" button
   - Enter a name (required) and description (optional)
   - Click "Create"

2. **Edit Scene Metadata**

   - Click "Edit Info" on any scene
   - Modify name and/or description
   - Click "Update"

3. **Delete a Scene**
   - Click "Delete" on any scene
   - Confirm the deletion in the dialog

### Working with 3D Scenes

1. **View a Scene**

   - Click "View" on any scene
   - The 3D viewer opens with the housing model loaded by default
   - Browse available parts in the right panel

2. **Edit a Scene**
   - Click "Edit 3D" on any scene
   - Drag parts from the right panel into the 3D view
   - Click on parts to select them
   - Use "Delete Selected" to remove parts
   - Click "Save" to persist changes

### Part Library

The parts library includes 15 mechanical parts:

- Axe
- Bearings (CS, Pr Dw, Pr Up)
- Carburetor
- Crankshaft
- Cylinder Liner
- Housing (Main, Back, Front, Top)
- Piston
- Push Rod
- Screws (Back, Top)

Each part displays a thumbnail preview for easy identification.

## 🔧 Development

### Available Scripts

```bash
# Start development server (auto-opens browser)
pnpm dev

# Build for production (TypeScript check + Vite build)
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

### TypeScript Configuration

The project uses strict TypeScript mode with:

- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `strictNullChecks`: true
- Target: ES2022
- Module resolution: bundler mode

### Testing HOOPS Viewer

A standalone test page is available at `/test-viewer.html` to verify HOOPS Web Viewer functionality independently from the React app.

## 📦 Build and Deploy

### Build for Production

```bash
pnpm build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
pnpm preview
```

Serves the production build at `http://localhost:4173/`

## ⚠️ Known Limitations

1. **Initial Model Loading**: The viewer currently loads `housing.scs` as the default initial model on startup.

2. **Scene Persistence**: Scene configurations (part positions, rotations) are not yet fully persisted to Supabase Storage.

3. **Part Files**: Only 6 of 15 parts have been downloaded:

   - housing, piston, crankshaft, bearing_CS, cylinder_liner, carburetor
   - Remaining 9 parts need to be added for full functionality

4. **Browser Compatibility**: Tested primarily on Chrome. Firefox and Safari compatibility not fully verified.

5. **File Upload**: Direct .scs file upload functionality not yet implemented.

## 🔮 Future Improvements

### High Priority

- [ ] Complete scene persistence (save/load part positions)
- [ ] Supabase Storage integration for .scs files
- [ ] Download remaining 9 part files
- [ ] Fix viewer initialization issues (if any)

### Medium Priority

- [ ] Undo/redo functionality
- [ ] Part rotation controls
- [ ] Assembly constraints (collinear, concentric, coplanar)
- [ ] Scene export to JSON
- [ ] Loading progress indicators

### Low Priority

- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance optimization for large assemblies
- [ ] Multi-user collaboration features

## 📚 References

- **HOOPS Web Viewer Docs**: https://docs.techsoft3d.com/hoops/visualize-web/
- **assembly_creator Source**: https://github.com/techsoft3d/assembly_creator
- **Supabase Documentation**: https://supabase.com/docs
- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/

## 🤝 Contributing

This is an interview project. For the actual assignment, please refer to:
https://github.com/wikifactory/cadrooms-interview

## 📄 License

This project is created for interview purposes.

## 🙏 Acknowledgments

- **Tech Soft 3D** for the HOOPS Web Viewer and assembly_creator example
- **Supabase** for the backend infrastructure
- **Vite** team for the excellent build tool

---

**Development Status**: Active Development
**Last Updated**: January 2025
**Node Version**: 18+
**Package Manager**: pnpm 8+
