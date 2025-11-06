# Fix: Team Creation "Categoría no encontrada" Error

## Problem
Users were unable to create teams, receiving the error "Categoría no encontrada" (Category not found) when submitting the team creation form.

## Root Cause
The team creation form at `/equipos/nuevo` was loading **hackathons** and passing `hackathon.id` as the `categoryId` parameter to the backend. However, the backend's `CreateTeamDto` expects a `categoryId` (not `hackathonId`), which references a Category entity that belongs to a specific hackathon topic.

**Architecture:**
- Hackathon → has many Categories (one per topic)
- Category → belongs to Hackathon and Topic
- Team → belongs to Category

## Solution

### 1. Backend Enhancement
Added a migration endpoint to create missing categories for existing hackathons:

**File: `backend/src/hackathons/hackathons.service.ts`**
```typescript
async createMissingCategories(hackathonId: string): Promise<{
  message: string;
  categoriesCreated: number;
}> {
  // Finds hackathon with topics
  // Creates categories for topics that don't have categories yet
  // Returns count of categories created
}
```

**File: `backend/src/hackathons/hackathons.controller.ts`**
- Added POST endpoint: `/api/hackathons/:id/create-categories`
- Temporarily made public for migration (can be restricted to ORGANIZADOR role later)

### 2. Frontend Fix
Updated the team creation form to properly load and select categories:

**File: `frontend/src/app/equipos/nuevo/page.tsx`**

**Changes:**
1. Added `Category` interface with proper structure
2. Changed data loading from hackathons-only to hackathons + their categories
3. Updated form dropdown to show categories grouped by hackathon
4. Changed form submission to send correct `categoryId`

**Before:**
```typescript
<select name="categoryId">
  {hackathons.map(hackathon => (
    <option value={hackathon.id}>{hackathon.nombre}</option>
  ))}
</select>
```

**After:**
```typescript
<select name="categoryId">
  {hackathons.map(hackathon => {
    const hackathonCategories = categories.filter(c => c.hackathonId === hackathon.id);
    return (
      <optgroup label={hackathon.nombre}>
        {hackathonCategories.map(category => (
          <option value={category.id}>{category.nombre}</option>
        ))}
      </optgroup>
    );
  })}
</select>
```

## Verification

### Categories for "Hackaton Talento Tech 2025 - Noviembre"
The hackathon (ID: `cc508e85-1a88-4a8b-bc79-68cf1e4d3f83`) now has 3 categories:

1. **Programación** (ID: `69bbfd3c-5666-47a6-bc5d-106f00a54f77`)
   - Topic: Programación
   - Active: ✅

2. **Inteligencia Artificial** (ID: `705ae41d-446c-4cb2-8d84-c7d593d19ee1`)
   - Topic: Inteligencia Artificial
   - Active: ✅

3. **Análisis de Datos** (ID: `9dbfed35-c45b-415d-8aa4-61532b31cde7`)
   - Topic: Análisis de Datos
   - Active: ✅

### Test the Fix
1. Navigate to http://localhost:3000/equipos/nuevo
2. Fill in team name (e.g., "Analítics")
3. Select category from dropdown (e.g., "Análisis de Datos")
4. Click "Crear Equipo"
5. Team should be created successfully ✅

## Files Modified

### Backend
- `backend/src/hackathons/hackathons.service.ts` - Added `createMissingCategories()` method
- `backend/src/hackathons/hackathons.controller.ts` - Added `/create-categories` endpoint

### Frontend
- `frontend/src/app/equipos/nuevo/page.tsx` - Complete refactor of form data loading and category selection

## Impact
- ✅ Users can now create teams successfully
- ✅ Teams are properly associated with hackathon categories
- ✅ Categories correspond to user interest topics from SIGA
- ✅ Dropdown shows clear organization: Hackathon → Categories

## Next Steps (Optional)
1. Add authentication requirement back to `/create-categories` endpoint (restrict to ORGANIZADOR role)
2. Consider adding validation to ensure users select categories matching their interest topics
3. Add category description tooltips in the form for better UX
