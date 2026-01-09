# 🛠️ Backend Improvement Todo List

> **Priority Legend**: 🔴 High | 🟡 Medium | 🟢 Low

---

## 🔴 High Priority (Security & Reliability) ✅ COMPLETED

### 1. Server-Side Validation & Security
- [x] Create validation schemas for Task, Template, User data *(validationSchemas.ts)*
- [ ] Add Firebase Cloud Functions for write validation *(requires Blaze plan)*
- [x] Implement rate limiting on API routes *(rateLimit.ts - all 5 routes)*
- [x] Add input sanitization on all API endpoints *(sanitize.ts)*
- [x] Review and tighten Firestore security rules *(firestore.rules)*

### 2. Error Handling & Retry Logic
- [x] Replace all `alert()` calls with `sonner` toast notifications
- [x] Implement global error boundary component *(ErrorBoundary.tsx)*
- [x] Add automatic retry logic for Firestore operations (3 retries with exponential backoff) *(firestoreUtils.ts)*
- [x] Create centralized error logging service *(logger.ts)*
- [x] Add user-friendly error messages for common failures *(firestoreUtils.ts)*


---

## 🟡 Medium Priority (Maintainability & Automation)

### 3. Move Business Logic to API Routes ✅ COMPLETED
- [x] Create `/api/tasks/add` endpoint
- [x] Create `/api/tasks/update` endpoint
- [x] Create `/api/tasks/delete` endpoint
- [x] Create `/api/tasks/complete` endpoint
- [x] Create `/api/stats/calculate` endpoint
- [x] Create `/api/leaderboard/rankings` endpoint
- [ ] Refactor `TaskContext.tsx` to use API routes (optional - current direct Firestore approach works with optimistic updates)

### 4. Implement Background Jobs ✅ COMPLETED
- [x] Set up Vercel Cron *(vercel.json)*
- [x] Create daily streak recalculation job (midnight UTC)
- [x] Create weekly analytics summary job (Sundays 9 AM)
- [x] Create daily motivation notification job (6 AM UTC)
- [x] Create task reminder notification job *(daily cron + client-side delivery)*
- [ ] Add cleanup job for old completion history (optional)

### 5. Optimistic Updates with Rollback ✅ COMPLETED
- [x] Implement optimistic update pattern for `addTask`
- [x] Implement optimistic update pattern for `updateTask`
- [x] Implement optimistic update pattern for `deleteTask`
- [x] Implement optimistic update pattern for `toggleTaskCompletion`
- [x] Add rollback mechanism on API failure
- [ ] Show loading/pending state during sync (optional)

### 6. Enhanced Offline Support ✅ COMPLETED
- [x] Create pending operations queue in localStorage *(offlineQueue.ts)*
- [x] Implement sync manager for offline changes
- [ ] Add conflict resolution strategy (last-write-wins or merge)
- [x] Show offline indicator in UI *(OfflineIndicator.tsx)*
- [x] Auto-sync when connection restored

---

## 🟢 Low Priority (Performance & Monitoring)

### 7. Server-Side Caching
- [ ] Evaluate Vercel KV vs Redis vs Upstash
- [ ] Cache leaderboard rankings (TTL: 5 minutes)
- [ ] Cache marketplace templates (TTL: 1 hour)
- [ ] Cache user statistics (TTL: 1 minute)
- [ ] Implement cache invalidation on data updates

### 8. Database Indexing & Optimization
- [ ] Add Firestore composite index for tasks by `timeBlock` + `days`
- [ ] Add Firestore index for users by `score` (descending)
- [ ] Add index for completion history queries
- [ ] Analyze query patterns and optimize accordingly

### 9. Logging & Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Add structured logging to API routes
- [ ] Implement performance monitoring
- [ ] Create dashboard for key metrics
- [ ] Set up alerts for critical errors

### 10. API Documentation
- [ ] Document all API endpoints
- [ ] Add TypeScript types for API request/response
- [ ] Create API testing collection (Postman/Insomnia)
- [ ] Add JSDoc comments to all service functions

---

## 📝 Notes

**Current Architecture:**
- Firebase Auth + Firestore
- Next.js API Routes for AI services
- Client-side business logic in Context providers

**Key Files to Modify:**
- `src/context/TaskContext.tsx` - Core business logic
- `src/context/AuthContext.tsx` - Authentication
- `src/lib/firebase.ts` - Firebase config
- `src/app/api/` - API routes directory

---

## 🎯 Suggested Implementation Order

1. Error handling & toast notifications (quick win)
2. Server-side validation (security)
3. Background jobs for automation
4. API route refactoring (major refactor)
5. Offline queue & sync
6. Caching & performance
7. Monitoring & logging
