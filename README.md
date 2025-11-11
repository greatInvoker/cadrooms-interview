# CAD ROOMS - 3D Scene Management System

A modern 3D scene editing and management platform that integrates HOOPS Web Viewer 3D engine and Supabase backend services, providing complete CAD part management and scene editing functionality.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://reactjs.org/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18.svg)](https://vitest.dev/)
[![Coverage](https://img.shields.io/badge/Coverage-84.49%25-brightgreen.svg)](./TEST_REPORT.md)

## 📋 Project Overview

CAD ROOMS is a full-stack web application that provides users with an intuitive experience for creating and managing 3D scenes. Through a modern technology stack and industrial-grade 3D engine, it implements a complete workflow from part uploading and scene editing to configuration saving.

### Core Features

- **Scene Management** - Create, edit, delete 3D scenes with support for scene configuration serialization and deserialization
- **Part Management** - Upload and manage CAD files (.scs/.step/.stl) with thumbnail previews
- **3D Editor** - Interactive 3D scene editor based on HOOPS Web Viewer
- **Drag & Drop** - Drag parts from the library into 3D space with WYSIWYG experience
- **Scene Persistence** - Automatic scene configuration saving to Supabase, including part positions and transformation matrices
- **Preset Part Library** - Built-in mechanical parts library, ready to use out of the box

## ✨ Features

### 🎨 Scene Management

- **Scene List** - View all scenes sorted by update time
- **Create Scene** - Add new scenes with name and description
- **Edit Scene Info** - Update scene name, description, and other metadata
- **Delete Scene** - Soft delete mechanism with confirmation dialog
- **Scene Preview** - Quick view of scene configuration and contained parts
- **JSON Viewer** - View and export scene configuration in JSON format

### 🔧 Part Management

- **Part Upload** - Support for .scs, .step, .stl and other CAD file formats
- **Thumbnail Management** - Upload preview images (PNG/JPG) for parts
- **Part Library** - Browse all available parts, including system presets and user uploads
- **File Validation** - Automatic validation of file type and size (max 100MB)
- **Soft Delete** - Parts can be recovered after deletion
- **Dual Buckets** - Separate storage for CAD files and images

### 🖥️ 3D Editor

- **HOOPS Web Viewer** - Based on industrial-grade HOOPS Communicator engine
- **Drag & Drop** - Drag parts from the library into the 3D scene
- **View Controls** - Rotate, pan, zoom 3D view
- **Part Selection** - Click to select parts in the scene
- **Transform Editing** - Support for editing part position and rotation transformation matrices
- **Visibility Control** - Show/hide parts in the scene
- **Scene Serialization** - Automatically save scene configuration to database

### 🎯 User Experience

- **Welcome Page** - Beautiful 3D animated welcome interface (Spline)
- **Real-time Feedback** - Toast notifications for operation results
- **Responsive Design** - Support for different screen sizes
- **Loading States** - Clear loading and error state indicators

## 🛠️ Tech Stack

### Frontend Technologies

- **React 19.1** - Latest React version with concurrent features
- **TypeScript 5.9** - Strict type checking for enhanced code quality
- **Vite 7** (Rolldown) - Ultra-fast build tool
- **Tailwind CSS 4** - Modern CSS framework
- **Radix UI** - Accessible UI component library

### 3D Engine

- **HOOPS Web Viewer 2024** - Industrial-grade 3D engine by Tech Soft 3D
- Support for multiple CAD formats (.scs, .step, .stl)
- High-performance rendering and interaction

### Backend Services

- **Supabase** - Open-source Firebase alternative
  - PostgreSQL database
  - Storage service
  - Row Level Security (RLS)
  - Real-time data subscriptions

### Testing Tools

- **Vitest 4.0** - Fast unit testing framework
- **Testing Library** - React component testing
- **Coverage: 84.49%** - High code coverage
- **59 Test Cases** - All passing ✅

### Development Tools

- **ESLint 9** - Code quality checking
- **pnpm** - Efficient package manager
- **happy-dom** - Lightweight DOM testing environment

## 📁 Project Structure

```
take-home/
├── public/
│   ├── preset_parts/           # Preset parts library
│   │   ├── axe.scs/.png       # Axe and thumbnail
│   │   ├── bearing_*.scs/.png # Bearing series
│   │   └── parts_list.json    # Parts catalog
│   └── testing_parts/          # Testing parts
│
├── src/
│   ├── components/
│   │   ├── ScenesList.tsx      # Scene list management UI
│   │   ├── SceneEditor.tsx     # 3D scene editor
│   │   ├── SceneViewer.tsx     # Read-only scene viewer
│   │   ├── SceneJsonViewer.tsx # JSON configuration viewer
│   │   ├── PartsList.tsx       # Parts library component
│   │   ├── PartUploadDialog.tsx # Part upload dialog
│   │   ├── WelcomePage.tsx     # Welcome page
│   │   └── ui/                 # Radix UI components
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── card.tsx
│   │       └── ...
│   │
│   ├── services/
│   │   ├── partsManager.ts     # Parts management API
│   │   ├── sceneSerializer.ts  # Scene serialization/deserialization
│   │   └── scenesService.ts    # Scene CRUD operations
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # Utility functions
│   │
│   ├── types/
│   │   ├── Scene.ts            # Scene type definitions
│   │   ├── parts.ts            # Parts type definitions
│   │   ├── sceneConfig.ts      # Scene configuration types
│   │   └── hoops.d.ts          # HOOPS type declarations
│   │
│   ├── test/                   # Test files
│   │   ├── setup.ts            # Test environment setup
│   │   ├── sceneSerializer.test.ts  # Scene serialization tests
│   │   ├── partsManager.test.ts     # Parts management tests
│   │   ├── ui.test.tsx         # UI component tests
│   │   └── integration/
│   │       └── scene.test.ts   # Integration tests
│   │
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
│
├── supabase/
│   ├── config.toml             # Supabase configuration
│   └── migrations/
│       ├── table/
│       │   ├── scenes_table.sql    # Scenes table
│       │   └── parts_table.sql     # Parts table
│       └── bucket/
│           ├── asset_file_bucket.sql   # CAD file storage bucket
│           └── asset_image_bucket.sql  # Image storage bucket
│
├── coverage/                   # Test coverage reports
├── dist/                       # Build output
├── .env.local                  # Environment variables
├── package.json
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Vitest configuration
├── tsconfig.json               # TypeScript configuration
├── README.md                   # English documentation (this file)
├── README-zh.md                # Chinese documentation
├── TESTING.md                  # Testing guide
├── TEST_REPORT.md              # Detailed test report
└── TEST_CASES.md               # Test cases checklist
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher
- **Supabase Account**: [Register at Supabase](https://supabase.com) or use local instance
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Installation Steps

#### 1. Clone Repository

```bash
git clone <repository-url>
cd take-home
```

#### 2. Install Dependencies

```bash
pnpm install
```

#### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_API_KEY=your_supabase_anon_key
```

**Getting Supabase Credentials:**

- Log in to [Supabase Dashboard](https://app.supabase.com)
- Create a new project or select an existing one
- Go to Settings → API
- Copy the `Project URL` and `anon/public` API key

#### 4. Setup Database

Two ways to set up the database:

**Method A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or use local development environment
supabase start
supabase db reset
```

**Method B: Manual SQL Execution**

Execute the following SQL files in order in the Supabase Dashboard SQL Editor:

1. `supabase/migrations/table/scenes_table.sql`
2. `supabase/migrations/table/parts_table.sql`
3. `supabase/migrations/bucket/asset_file_bucket.sql`
4. `supabase/migrations/bucket/asset_image_bucket.sql`

#### 5. Start Development Server

```bash
pnpm dev
```

The application will start at `http://localhost:5173` and automatically open in your browser.

### 📦 Available Scripts

```bash
# Development server (hot reload)
pnpm dev

# Type check + production build
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Run tests (watch mode)
pnpm test

# Run tests (single run)
pnpm test:run

# Test coverage report
pnpm test:coverage

# Test UI interface
pnpm test:ui
```

## 📊 Database Schema

### `scenes` Table

Stores metadata and configuration for 3D scenes.

| Column        | Type        | Description                                                    |
| ------------- | ----------- | -------------------------------------------------------------- |
| `id`          | UUID        | Primary key (auto-generated)                                   |
| `name`        | TEXT        | Scene name (required)                                          |
| `description` | TEXT        | Scene description (optional)                                   |
| `assets`      | TEXT[]      | Array of asset file names (deprecated)                         |
| `scene_json`  | JSONB       | Serialized scene configuration (parts, transforms, positions)  |
| `user_id`     | UUID        | User ID (reserved field)                                       |
| `del_flag`    | INTEGER     | Soft delete flag (0=active, 1=deleted)                         |
| `created_at`  | TIMESTAMPTZ | Creation timestamp (automatic)                                 |
| `updated_at`  | TIMESTAMPTZ | Last update timestamp (automatic)                              |

**Indexes:**

- `idx_scenes_updated_at` - Sorting by update time
- `idx_scenes_user_id` - User-related queries
- `idx_scenes_del_flag` - Soft delete filtering
- `idx_scenes_name` - Name search

**Triggers:**

- Automatically updates `updated_at` field

### `parts` Table

Stores metadata and file references for CAD parts.

| Column        | Type        | Description                                      |
| ------------- | ----------- | ------------------------------------------------ |
| `id`          | UUID        | Primary key (auto-generated)                     |
| `name`        | TEXT        | Part name (required)                             |
| `description` | TEXT        | Part description (optional)                      |
| `file_id`     | UUID        | CAD file ID (pointing to Storage)                |
| `image_id`    | UUID        | Thumbnail ID (pointing to Storage, optional)     |
| `remarks`     | TEXT        | Additional remarks                               |
| `is_system`   | BOOLEAN     | Whether it's a system preset part (default false)|
| `del_flag`    | INTEGER     | Soft delete flag (0=active, 1=deleted)           |
| `created_at`  | TIMESTAMPTZ | Creation timestamp (automatic)                   |
| `updated_at`  | TIMESTAMPTZ | Last update timestamp (automatic)                |

**Indexes:**

- `idx_parts_name` - Name search
- `idx_parts_del_flag` - Soft delete filtering
- `idx_parts_is_system` - System/user part distinction
- `idx_parts_created_at` - Sorting by creation time

### Storage Buckets

**`asset-file` Bucket**

- Stores CAD files (.scs, .step, .stl)
- Max file size: 100MB
- Public access

**`asset-image` Bucket**

- Stores part thumbnails (PNG, JPG)
- Max file size: 10MB
- Public access

## 🎮 Usage Guide

### First-time Use

1. **Start Application** - Visit `http://localhost:5173`
2. **Welcome Page** - Click "Enter" to access the main interface
3. **Create Scene** - Click "Create New Scene" to create your first scene

### Scene Management

#### Create New Scene

1. Click the "Create New Scene" button in the top right corner
2. Enter scene name (required)
3. Enter scene description (optional)
4. Click "Create" to finish

#### Edit Scene Metadata

1. Click the "Edit Info" button on a scene card
2. Modify name and/or description
3. Click "Update" to save changes

#### Delete Scene

1. Click the "Delete" button on a scene card
2. Click "Confirm" in the confirmation dialog
3. The scene will be soft-deleted (can be recovered from database)

### 3D Scene Editing

#### View Scene

1. Click the "View" button on a scene card
2. The 3D viewer will open and display the scene content
3. The parts library is displayed in the right panel

#### Edit Scene

1. Click the "Edit 3D" button on a scene card
2. **Add Parts**:
   - Drag parts from the right panel into the 3D view
   - Parts will be automatically added to the scene
3. **Select Parts**:
   - Click on parts in the 3D view to select them
   - Selected parts will be highlighted
4. **Delete Parts**:
   - Select the part to delete
   - Click the "Delete Selected" button
5. **Save Scene**:
   - Click the "Save" button to save all changes
   - Scene configuration will be automatically serialized and saved to the database

#### 3D View Operations

- **Rotate View** - Left mouse button drag
- **Pan View** - Middle mouse button or Shift + left mouse button drag
- **Zoom View** - Mouse wheel

### Part Management

#### Browse Part Library

- The parts library is displayed in the right panel of the editor
- Each part shows a thumbnail and name
- Supports both system preset parts and user-uploaded parts

#### Upload New Part

1. Click the "Upload New Part" button at the top of the parts library
2. Fill in part information:
   - Name (required)
   - Description (optional)
   - Remarks (optional)
3. Upload CAD file (.scs/.step/.stl)
4. Upload thumbnail (PNG/JPG, optional)
5. Click "Upload" to complete

### View Scene Configuration

1. Click the "View JSON" button on a scene card
2. View the scene's JSON configuration
3. Can copy configuration for debugging or backup

## 🧪 Testing

This project includes a comprehensive testing suite to ensure code quality and functionality.

### Test Statistics

- **Test Files**: 4
- **Test Cases**: 59
- **Pass Rate**: 100% ✅
- **Code Coverage**: 84.49%
- **Test Framework**: Vitest + Testing Library

### Running Tests

```bash
# Run tests in watch mode
pnpm test

# Single run of all tests
pnpm test:run

# Generate coverage report
pnpm test:coverage

# Open test UI interface
pnpm test:ui
```

### Test Coverage

#### ✅ Tested Modules

- **Scene Serialization** (`sceneSerializer.ts`) - 15 tests
  - Serialization and deserialization
  - Transformation matrix handling
  - Node metadata management

- **Part Management** (`partsManager.ts`) - 24 tests
  - File upload (CAD + images)
  - CRUD operations
  - File validation
  - URL generation

- **Integration Tests** (`integration/scene.test.ts`) - 10 tests
  - Complete scene workflow
  - Large scene handling
  - Error recovery mechanisms

- **UI Components** (`ui.test.tsx`) - 10 tests
  - Button component
  - Event handling
  - Style variants

### View Detailed Reports

- **[TESTING.md](./TESTING.md)** - Testing guide and configuration instructions
- **[TEST_REPORT.md](./TEST_REPORT.md)** - Detailed test report and analysis
- **[TEST_CASES.md](./TEST_CASES.md)** - Complete test cases checklist
- **coverage/index.html** - HTML format coverage report

## 🏗️ Architecture Design

### Frontend Architecture

```
User Interface
    ↓
React Component Layer
    ↓
Service Layer (Services)
    ↓
Supabase Client
    ↓
Backend API
```

### Core Modules

#### 1. Component Layer (`src/components/`)

- **Business Components** - Scene management, editor, parts library
- **UI Components** - Reusable components based on Radix UI
- **Layout Components** - Welcome page, main layout

#### 2. Service Layer (`src/services/`)

- **partsManager** - Part CRUD, file upload, URL generation
- **sceneSerializer** - Scene serialization/deserialization
- **scenesService** - Scene CRUD operations

#### 3. Type System (`src/types/`)

- Complete TypeScript type definitions
- HOOPS Web Viewer type declarations
- Scene configuration and part data structures

### Data Flow

#### Scene Save Flow

```
1. User edits scene in 3D editor
2. Click "Save" button
3. serializeScene() extracts scene data
4. Generate SceneConfig JSON
5. Save to Supabase scenes table
6. Update scene_json field
```

#### Scene Load Flow

```
1. Read scene_json from database
2. deserializeScene() parses configuration
3. Load each part based on cadUrl
4. Apply transformation matrix and visibility
5. Render complete 3D scene
```

## 🔧 Development

### Technical Requirements

- TypeScript strict mode
- ESLint configuration
- Code formatting (Prettier recommended)
- Git commit conventions

### Adding New Features

1. **Create Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop Feature**

   - Write code
   - Add type definitions
   - Update related documentation

3. **Write Tests**

   ```bash
   # Add tests for new features
   touch src/test/your-feature.test.ts
   ```

4. **Run Tests and Checks**

   ```bash
   pnpm test:run
   pnpm lint
   pnpm build
   ```

5. **Commit Code**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

### Debugging Tips

#### Debugging HOOPS Viewer

Access the viewer instance in the browser console:

```javascript
// The global viewer is exposed in SceneEditor.tsx
window.hwv_viewer.model.getNodeChildren(0);
```

#### View Scene Configuration

```javascript
// Serialize current scene
const config = await window.serializeCurrentScene();
console.log(JSON.stringify(config, null, 2));
```

### Performance Optimization Suggestions

1. **Large Scenes** - Use LOD (Level of Detail)
2. **Parts Library** - Implement virtual scrolling
3. **Scene Loading** - Add loading progress bar
4. **3D Rendering** - Adjust HOOPS Viewer rendering quality

## 📦 Deployment

### Build Production Version

```bash
# Type check + build
pnpm build
```

Build output is located in the `dist/` directory.

### Deploy to Vercel

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Deploy:

   ```bash
   vercel --prod
   ```

3. Configure environment variables:
   - Add in Vercel project settings:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_API_KEY`

### Deploy to Netlify

1. Connect Git repository to Netlify
2. Configure build settings:
   - Build command: `pnpm build`
   - Publish directory: `dist`
3. Add environment variables

### Preview Production Build

```bash
pnpm preview
```

Local preview address: `http://localhost:4173`

## ⚠️ Notes and Limitations

### Current Limitations

1. **User Authentication** - User login and permission management not yet implemented

   - All scenes and parts are currently public
   - `user_id` field reserved for future use

2. **HOOPS Viewer License** - Requires valid HOOPS Communicator license

   - Currently using Tech Soft 3D example code
   - Production environment requires official license

3. **File Format Support**

   - Full support: .scs (HOOPS native format)
   - Partial support: .step, .stl (requires conversion)
   - Some complex models may fail to load

4. **Browser Compatibility**

   - Recommended: Chrome 90+, Edge 90+
   - Supported: Firefox 88+, Safari 14+
   - WebGL 2.0 is required

5. **Performance Considerations**
   - Large scenes (>50 parts) may affect performance
   - Recommend splitting complex parts into sub-assemblies
   - Limited performance on mobile devices

### Security Considerations

1. **Row Level Security (RLS)** - Enabled but requires user policy configuration
2. **File Upload** - Need to add stricter file type validation
3. **API Keys** - Do not commit `.env.local` to Git
4. **CORS Configuration** - Supabase Storage needs proper CORS settings

### Best Practices

- **Scene Naming** - Use descriptive names for easy management
- **Part Organization** - Add detailed descriptions and tags to parts
- **Regular Backups** - Export JSON configurations of important scenes
- **Performance Monitoring** - Pay attention to loading times for large scenes
- **Test Coverage** - Write test cases when adding new features

## 🔮 Future Roadmap

### Near-term Plans (1-2 months)

#### Feature Enhancements

- [ ] **User Authentication System** - Integrate Supabase Auth
  - User registration and login
  - Ownership management for scenes and parts
  - Team collaboration features

- [ ] **Part Search and Filtering** - Enhance parts library experience
  - Search by name, tags
  - Filter by type, size
  - Favorites and recently used

- [ ] **Scene Version Control** - Save scene history
  - Auto-save drafts
  - Version history
  - Rollback to previous versions

#### Editor Enhancements

- [ ] **Part Transform Controls** - More precise editing
  - UI controls for position, rotation, scale
  - Alignment and snapping features
  - Grid and guidelines

- [ ] **Assembly Constraints** - Smart assembly
  - Coplanar constraints
  - Coaxial constraints
  - Distance constraints

- [ ] **Measurement Tools** - CAD measurement features
  - Distance measurement
  - Angle measurement
  - Area and volume calculation

### Mid-term Plans (3-6 months)

#### Performance Optimization

- [ ] **Virtualized Parts Library** - Improve large list performance
- [ ] **Scene Preview Thumbnails** - Quick scene identification
- [ ] **Incremental Loading** - Chunk loading for large scenes
- [ ] **Web Workers** - Background serialization processing

#### Collaboration Features

- [ ] **Multi-user Real-time Collaboration** - Like Figma
- [ ] **Comments and Annotations** - Scene annotation system
- [ ] **Share Links** - Public scene previews
- [ ] **Export Functionality** - Export as images, PDF

#### Data Management

- [ ] **Scene Templates** - Preset scene templates
- [ ] **Part Categories and Tags** - Better organization
- [ ] **Batch Operations** - Batch import/export
- [ ] **Recycle Bin** - Soft delete data recovery

### Long-term Vision (6+ months)

#### Advanced Features

- [ ] **AI-assisted Design** - Smart part placement recommendations
- [ ] **Auto-assembly** - Rule-based automatic assembly
- [ ] **Collision Detection** - Real-time collision detection
- [ ] **Motion Simulation** - Simple animation and simulation

#### Integration and Extension

- [ ] **PLM Integration** - Integration with PLM systems
- [ ] **CAD Software Plugins** - SolidWorks, AutoCAD plugins
- [ ] **API Opening** - RESTful API and SDK
- [ ] **Mobile Apps** - iOS and Android applications

#### Enterprise Features

- [ ] **Permission Management** - Role-based access control
- [ ] **Audit Logs** - Operation history tracking
- [ ] **SSO Integration** - Enterprise single sign-on
- [ ] **Private Deployment** - Support for on-premises deployment

## 📚 References

### Official Documentation

- **[HOOPS Communicator](https://docs.techsoft3d.com/communicator/latest/overview/overview.html)** - 3D engine official docs
- **[Supabase Documentation](https://supabase.com/docs)** - Backend service docs
- **[React Documentation](https://react.dev/)** - React framework docs
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript official guide
- **[Vite Guide](https://vitejs.dev/)** - Build tool documentation
- **[Vitest Documentation](https://vitest.dev/)** - Test framework documentation

### Related Resources

- **[Radix UI](https://www.radix-ui.com/)** - Accessible UI component library
- **[Tailwind CSS](https://tailwindcss.com/)** - CSS utility framework
- **[pnpm Documentation](https://pnpm.io/)** - Package manager documentation

### Examples and Tutorials

- **[assembly_creator](https://github.com/techsoft3d/assembly_creator)** - HOOPS assembly example (reference for this project)
- **[Supabase Examples](https://github.com/supabase/supabase/tree/master/examples)** - Official example collection
- **[React Testing Library](https://testing-library.com/react)** - Testing best practices

### Project Documentation

- **[README.md](./README.md)** - English documentation (this file)
- **[README-zh.md](./README-zh.md)** - Chinese documentation
- **[TESTING.md](./TESTING.md)** - Testing guide
- **[TEST_REPORT.md](./TEST_REPORT.md)** - Detailed test report
- **[TEST_CASES.md](./TEST_CASES.md)** - Test cases checklist

## 🤝 Contributing

### How to Contribute

We welcome all forms of contributions!

1. **Fork the Repository**
2. **Create Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to Branch** (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

### Code Standards

- Follow ESLint configuration
- Write clear commit messages
- Add tests for new features
- Update related documentation

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: code formatting
refactor: code refactoring
test: add tests
chore: build/toolchain updates
```

### Reporting Issues

Found a bug or have a feature suggestion? Please [create an Issue](https://github.com/your-repo/issues).

Helpful information to include:

- Issue description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment info (browser, OS)
- Screenshots or error logs

## 📄 License

This project is for technical assessment and demonstration purposes.

Related technologies and libraries licenses:

- React - MIT License
- Supabase - Apache License 2.0
- HOOPS Communicator - Commercial license (requires acquisition)
- Radix UI - MIT License

## 🙏 Acknowledgments

### Technical Support

- **[Tech Soft 3D](https://www.techsoft3d.com/)** - Providing HOOPS Communicator 3D engine
- **[Supabase](https://supabase.com/)** - Providing open-source backend services
- **[Vercel](https://vercel.com/)** - Providing build tools and deployment platform

### Open Source Community

Thanks to all open source contributors, especially:

- React and TypeScript teams
- Vite and Vitest teams
- Radix UI and Tailwind CSS teams
- All dependency library maintainers

### Inspiration

- **[assembly_creator](https://github.com/techsoft3d/assembly_creator)** - Tech Soft 3D assembly example
- **[Wikifactory CADRooms](https://github.com/wikifactory/cadrooms-interview)** - Original interview project

---

## 📞 Contact

### Developer

- **GitHub**: [@lvweipeng](https://github.com/greatInvoker)
- **Email**: 593597559@qq.com

### Project Links

- **Repository**: [https://github.com/greatInvoker/take-home](https://github.com/your-username/take-home)
- **Documentation**: [English](./README.md) | [中文](./README-zh.md)

---

<div align="center">

**⭐ If this project helps you, please give it a Star!**

Made with ❤️ by [lvweipeng](https://github.com/greatInvoker/take-home)

---

**Last Updated**: 2025-11-11
**Version**: 0.0.0
**Status**: 🚧 Under Active Development

</div>
