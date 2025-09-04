# ❤️ Heart Reactions System Implementation

## Overview

The heart reactions system allows students and faculty to react to news and announcements with Instagram-style heart buttons. When users click the heart, it fills with red color and the reaction is stored in the database with real-time like counts.

## Database Structure

### Tables Used

1. **`posts`** - Stores news and announcements
   - `PostID` (Primary Key)
   - `Title`, `Content`, `Type` (news/announcement)
   - `TargetAudience` (all/students/faculty)
   - `IsActive`, `CreatedBy`, `CreatedAt`, `UpdatedAt`

2. **`post_reactions`** - Stores individual user reactions
   - `ReactionID` (Primary Key, Auto Increment)
   - `PostID` (Foreign Key to posts)
   - `UserID` (Student/Faculty/Admin ID)
   - `UserType` (enum: 'admin', 'student', 'faculty')
   - `ReactionType` (enum: 'like', 'love', 'care', 'laugh', 'wow', 'sad', 'angry')
   - `CreatedAt`, `UpdatedAt`

3. **`post_reaction_summary`** - Aggregated reaction counts for performance
   - `PostID` (Primary Key, Foreign Key to posts)
   - `TotalReactions`, `LikeCount`, `LoveCount`, etc.
   - `UpdatedAt`

## Frontend Components

### 1. PostReactionsComponent (`src/app/components/post-reactions/`)

**Features:**
- Instagram-style heart button that fills red when liked
- Real-time like count display
- Hover animations and visual feedback
- Loading states and error handling
- Dark mode support
- Accessibility features (ARIA labels, keyboard navigation)

**Usage:**
```html
<app-post-reactions 
  [post]="getAnnouncementAsPost(announcement)" 
  [isDarkMode]="isDarkMode"
  (reactionChanged)="onReactionChanged($event)">
</app-post-reactions>
```

### 2. HeartReactionComponent (`src/app/components/heart-reaction/`)

**Features:**
- Simplified heart-only reaction component
- User tooltip showing who reacted
- Animation effects on interaction
- Configurable sizes (sm/md/lg)

### 3. ReactionService (`src/app/services/reaction.service.ts`)

**Key Methods:**
- `toggleHeartReaction(postId)` - Add/remove heart reaction
- `getUserReaction(postId)` - Get current user's reaction status
- `getPostReactions(postId)` - Get all reactions for a post
- `getReactionUsers(postId)` - Get users who reacted
- `formatReactionCount(count)` - Format numbers (1K, 1M, etc.)

## Backend API Endpoints

### Base URL: `http://localhost:3000/api/v1/reactions`

1. **GET `/posts/:postId/reactions`**
   - Get all reactions for a post
   - Returns: `{ totalReactions, summary, reactions }`

2. **POST `/posts/:postId/reactions`** (Authenticated)
   - Add/remove/update reaction
   - Body: `{ reactionType: 'heart' }`
   - Returns: `{ action: 'added'|'removed'|'updated' }`

3. **GET `/posts/:postId/user-reaction`** (Authenticated)
   - Get current user's reaction status
   - Returns: `{ hasReaction, reactionType, reactedAt }`

4. **GET `/posts/:postId/reactions/users`**
   - Get users who reacted to a post
   - Query: `?reactionType=heart` (optional)
   - Returns: `{ users: [{ user_name, user_type, reaction_type }] }`

## Integration in Dashboards

### Admin Dashboard (`src/app/dashboard/overview/`)
- Heart reactions enabled for both news and announcements
- Admins can see and react to their own posts
- Toast notifications for reaction feedback

### Faculty Dashboard (`src/app/faculty-dashboard/`)
- Heart reactions for news and faculty-targeted announcements
- Faculty can react to library updates and academic content

### Student Dashboard (`src/app/student-dashboard/`)
- Heart reactions for news and student-targeted announcements
- Students can react to library updates and academic content

## How It Works

### 1. User Clicks Heart Button
```typescript
async toggleHeartReaction(): Promise<void> {
  // Check authentication
  if (!this.isAuthenticated) return;
  
  // Make API call
  const response = await this.reactionService.toggleHeartReaction(this.post.id);
  
  // Update UI based on response
  if (response.data.action === 'added') {
    this.hasReacted = true;
    this.reactionCount++;
    this.showHeartAnimation();
  }
}
```

### 2. Backend Processes Request
```javascript
// Check if user already reacted
const [existingReaction] = await db.execute(
  'SELECT ReactionType FROM post_reactions WHERE PostID = ? AND UserID = ? AND UserType = ?',
  [postId, userId, userType]
);

if (existingReaction.length > 0) {
  // Remove reaction (unlike)
  await db.execute('DELETE FROM post_reactions WHERE ...');
  await updateReactionSummary(postId, reactionType, false);
} else {
  // Add new reaction
  await db.execute('INSERT INTO post_reactions ...');
  await updateReactionSummary(postId, reactionType, true);
}
```

### 3. Database Updates
- Individual reaction stored in `post_reactions`
- Aggregated count updated in `post_reaction_summary`
- Real-time updates sent to frontend

## Visual Design

### Heart Button States
- **Default**: Gray outline heart (🤍)
- **Hovered**: Slightly larger, subtle shadow
- **Liked**: Red filled heart (❤️) with background
- **Loading**: Spinning indicator overlay
- **Animation**: Heart "pop" effect when liked

### Like Count Display
- Shows next to heart button
- Format: "1 like", "5 likes", "1.2K likes"
- Color matches heart state (gray/red)
- Tooltip shows "X people reacted"

## Authentication & Authorization

### Token-Based Authentication
- Supports admin, student, and faculty tokens
- Tokens stored in localStorage
- JWT middleware validates requests

### User Type Detection
```javascript
function parseUserFromToken(req, res, next) {
  if (req.user.AdminID) {
    req.userInfo = { id: req.user.AdminID, type: 'admin' };
  } else if (req.user.StudentID) {
    req.userInfo = { id: req.user.StudentID, type: 'student' };
  } else if (req.user.FacultyID) {
    req.userInfo = { id: req.user.FacultyID, type: 'faculty' };
  }
}
```

## Testing

### 1. Manual Testing
- Open `test-heart-reactions.html` in browser
- Login as student/faculty/admin
- Click heart buttons to test reactions
- Check database for stored reactions

### 2. API Testing
- Run `node test-reactions-api.js`
- Tests all API endpoints
- Verifies database connections

### 3. Database Verification
```sql
-- Check posts
SELECT * FROM posts;

-- Check reactions
SELECT * FROM post_reactions;

-- Check reaction summary
SELECT * FROM post_reaction_summary;

-- Get post with reaction counts
SELECT p.*, prs.TotalReactions 
FROM posts p 
LEFT JOIN post_reaction_summary prs ON p.PostID = prs.PostID;
```

## Troubleshooting

### Common Issues

1. **Heart button not responding**
   - Check if user is authenticated
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **Reactions not saving**
   - Verify database connection
   - Check JWT token validity
   - Ensure post exists in database

3. **Count not updating**
   - Check `post_reaction_summary` table
   - Verify aggregation triggers are working
   - Refresh component data

### Debug Steps

1. **Check Authentication**
   ```javascript
   console.log('Auth token:', localStorage.getItem('studentToken'));
   console.log('Is authenticated:', this.reactionService.isAuthenticated());
   ```

2. **Check API Response**
   ```javascript
   // In browser console
   fetch('http://localhost:3000/api/v1/reactions/posts/1/reactions')
     .then(r => r.json())
     .then(console.log);
   ```

3. **Check Database**
   ```sql
   SELECT COUNT(*) FROM post_reactions WHERE PostID = 1;
   ```

## Future Enhancements

### Planned Features
1. **Multiple Reaction Types**: Like, Love, Laugh, Wow, Sad, Angry
2. **Real-time Updates**: WebSocket integration for live reactions
3. **Reaction Analytics**: Dashboard for admins to see engagement
4. **Notification System**: Notify post authors of reactions
5. **Reaction History**: View who reacted and when

### Performance Optimizations
1. **Caching**: Redis cache for reaction counts
2. **Pagination**: For posts with many reactions
3. **Debouncing**: Prevent rapid-fire clicking
4. **Lazy Loading**: Load reactions on demand

## Conclusion

The heart reactions system provides an engaging way for users to interact with library content. The Instagram-style interface is familiar and intuitive, while the robust backend ensures reliable data storage and real-time updates.

The system is fully integrated into all three dashboards (admin, faculty, student) and ready for production use.