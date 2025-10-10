# Migration Guide: Separate Teacher and Student Collections

## Overview
The application has been updated to use separate collections for teachers and students instead of a single User collection. This provides better data organization and allows for role-specific fields.

## Changes Made

### 1. New Models Created
- `backend/models/Teacher.js` - Teacher-specific collection with fields like subjects, bio, experience, hourlyRate, availability, etc.
- `backend/models/Student.js` - Student-specific collection with fields like grade, school, learningGoals, preferredLearningStyle, etc.

### 2. Updated Auth Routes
- `backend/routes/auth.js` - Now uses Teacher and Student models instead of User model
- Registration and login now create/fetch from appropriate collections
- `/me` endpoint fetches user data from the correct collection based on role

### 3. Updated StudyMaterial Model
- `uploadedBy` field now references Teacher collection
- `reviews.userId` field now references Student collection

### 4. Frontend Updates
- Header component now shows different navigation based on user role
- Teacher dashboard shows only teacher-specific navigation
- Student dashboard shows student-specific navigation

## Migration Steps

### 1. Run the Migration Script
```bash
cd backend
node migrate.js
```

This script will:
- Connect to your MongoDB database
- Find all users in the old User collection
- Create corresponding Teacher or Student documents
- Preserve all existing data including hashed passwords
- Keep the old User collection for backup

### 2. Test the Application
1. Start the backend server: `npm run dev`
2. Start the frontend: `npm run dev`
3. Test teacher registration/login
4. Test student registration/login
5. Verify that study materials can be uploaded by teachers
6. Verify that students can view uploaded materials

### 3. Clean Up (Optional)
After confirming everything works correctly, you can drop the old User collection:
```javascript
// In MongoDB shell or compass
db.users.drop()
```

## New Features Available

### Teacher-Specific Fields
- Subjects they teach
- Bio and experience
- Hourly rate
- Availability schedule
- Rating and session count

### Student-Specific Fields
- Grade and school
- Learning goals
- Preferred learning style
- Timezone

## Database Structure

### Teachers Collection
```javascript
{
  fullName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  gender: String,
  birthdate: Date,
  subjects: [String],
  bio: String,
  experience: String,
  qualifications: [String],
  hourlyRate: Number,
  availability: Object,
  rating: Number,
  totalSessions: Number,
  isActive: Boolean
}
```

### Students Collection
```javascript
{
  fullName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  gender: String,
  birthdate: Date,
  grade: String,
  school: String,
  subjects: [String],
  learningGoals: [String],
  preferredLearningStyle: String,
  timezone: String,
  isActive: Boolean
}
```

## Rollback Plan
If you need to rollback:
1. The old User model is still available
2. Revert the auth.js routes to use User model
3. Update StudyMaterial references back to User
4. The migration script preserves all original data

## Notes
- All existing passwords remain functional (they're already hashed)
- Session management remains the same
- API endpoints remain the same
- Frontend components work with the new data structure

