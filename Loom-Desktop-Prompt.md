# Comprehensive Prompt for Building Loom-Like Screen Recording Software

## Executive Summary
This document contains a detailed, production-ready prompt for generating a Loom clone focused on **desktop screen recording and playback** without video editing, DRM, or analytics. Optimized for laptop deployment with core collaboration features. Use this with Claude API or Anthropic directly.

---

## PRIMARY PROMPT (Copy & Paste to Claude)

```
You are an expert full-stack software architect and developer specializing in video 
communication platforms. Your task is to generate a comprehensive technical specification 
and implementation guide for building a Loom-like screen recording platform optimized 
for laptop/desktop deployment.

PROJECT CONTEXT:
- Platform: Desktop-focused screen recording and video playback software
- Target Users: Content creators, educators, sales professionals (laptop users only)
- Key Differentiator: Simple, fast screen recording with real-time sharing
- Tech Stack: Node.js/Express backend, React frontend, PostgreSQL database, AWS S3/CloudFront
- Deployment: Cloud-based SaaS with browser extensions (desktop browsers only)
- Scope: Recording, Storage, Playback, Collaboration (NO video editing, NO DRM, NO analytics)

REQUIREMENTS:

## 1. CORE FEATURES TO IMPLEMENT

### 1.1 Screen Recording Module
- Screen capture (full screen, window selection, region selection)
- Camera/webcam capture with picture-in-picture (PiP) support
- Audio recording (system audio + microphone with mixing)
- Recording pause/resume functionality
- Custom recording dimensions (720p, 1080p, 4K)
- Do-Not-Disturb mode (hides notifications, popups)
- Real-time timer and duration limit warnings
- Performance monitoring (CPU, memory, bandwidth impact)
- Keyboard shortcut support for quick start/stop
- Recording status indicator in browser

### 1.2 Collaboration Features
- Real-time comments (time-stamped)
- Emoji reactions (👍 ❤️ 😂 etc.)
- Mention system (@username)
- Comment threads and replies
- Resolution status for comments
- Activity feed and notifications
- Team workspaces with role-based access control
- Shared libraries (personal, team, enterprise)
- Permission levels: Viewer, Commenter, Editor, Admin

### 1.3 Video Hosting & Playback
- Cloud-based video storage with CDN delivery
- Progressive download and streaming
- Adaptive bitrate streaming (multiple quality options)
- HTML5 video player with custom controls
- Playlist functionality
- Keyboard shortcuts
- Picture-in-picture mode
- Fullscreen support
- Closed captioning support (optional, human-added)
- Custom player branding

### 1.4 Workspace Management
- User authentication (OAuth2, email/password)
- Workspace creation and management
- Team member invitation and management
- Role-based access control (RBAC)
- Workspace settings and customization
- Billing and subscription management
- API key management for integrations

### 1.5 Integrations (Selective)
- Google Meet, Zoom, Teams embed
- Zapier/Make.com webhooks
- Custom webhook support
- S3 and cloud storage options

### 1.6 Browser Extension (Desktop Only)
- One-click recording from any website
- Easy access to recording controls
- Quick video sharing
- Sidebar with workspace access
- Recording settings management
- Auto-start on page load (optional)

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Frontend Stack
```
React 18+ with TypeScript
- State Management: Redux Toolkit or Zustand
- UI Components: Shadcn/ui or Material-UI
- Video Player: video.js with HLS support
- Real-time Updates: Socket.io client
- Forms: React Hook Form + Zod validation
- Styling: Tailwind CSS with custom theme
- Build Tool: Vite
- Browser Support: Chrome, Firefox, Safari, Edge (Desktop only)
```

### 2.2 Backend Stack
```
Node.js with Express.js or Fastify
- API Framework: Express.js (REST) or Fastify (high performance)
- Async Queue: Bull with Redis backend
- Database: PostgreSQL with Prisma ORM
- Caching: Redis
- Video Storage: AWS S3 with signed URLs
- CDN: CloudFront for video delivery
- WebSocket: Socket.io for real-time features
- Authentication: JWT + OAuth2 (Passport.js)
- Logging: Winston or Pino
```

### 2.3 Database Schema (PostgreSQL)
```sql
-- Core entities:
- users (id, email, auth_provider, workspace_id, role, created_at)
- workspaces (id, name, owner_id, tier, subscription_status)
- videos (id, title, workspace_id, owner_id, duration, storage_path, created_at, updated_at)
- video_files (id, video_id, format, quality, storage_path, size, bitrate)
- viewers (id, video_id, user_id, watched_at, watch_duration)
- comments (id, video_id, user_id, text, timestamp, is_resolved, created_at)
- sharing_links (id, video_id, created_by, token, password_hash, expires_at)
- workspace_members (id, workspace_id, user_id, role, invited_at)
- integrations (id, workspace_id, provider, credentials_encrypted)

-- Indexes on frequently queried columns (video_id, workspace_id, user_id)
```

### 2.4 API Endpoints (RESTful)

**Authentication:**
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

**Videos:**
- POST /videos (create metadata)
- GET /videos (list with pagination)
- GET /videos/:id (fetch details)
- PATCH /videos/:id (update metadata: title, description)
- DELETE /videos/:id
- GET /videos/:id/download
- POST /videos/:id/duplicate

**Video Upload & Processing:**
- POST /upload/initiate (get presigned S3 URL)
- POST /upload/complete
- GET /videos/:id/processing-status

**Sharing & Access:**
- POST /videos/:id/sharing-links (create share link with optional password)
- GET /sharing-links/:token (validate and return video metadata)
- DELETE /sharing-links/:id
- PATCH /sharing-links/:id (update expiration, password)

**Comments & Collaboration:**
- POST /videos/:id/comments
- GET /videos/:id/comments (paginated)
- PATCH /comments/:id (edit comment)
- DELETE /comments/:id
- POST /comments/:id/resolve
- POST /comments/:id/reactions (add emoji reaction)

**Workspace:**
- POST /workspaces (create)
- GET /workspaces (list user's workspaces)
- PATCH /workspaces/:id (update settings)
- POST /workspaces/:id/members (invite)
- GET /workspaces/:id/members
- DELETE /workspaces/:id/members/:userId (remove member)

**Integrations:**
- POST /integrations/:provider/connect
- GET /integrations
- DELETE /integrations/:id

### 2.5 Video Processing Pipeline
```
1. Upload → S3 (raw video file via presigned URL)
2. Webhook triggers Lambda function
3. FFmpeg processing:
   - Transcode to multiple bitrates (HLS format: 360p, 720p, 1080p, 4K)
   - Generate thumbnail (1 frame at 3 seconds)
   - Extract audio metadata
4. Store processed files in S3 with versioning
5. Update database with processing status (completed/failed)
6. CloudFront cache invalidation
7. Notify user via WebSocket when complete (real-time)
8. Video ready for playback
```

### 2.6 Streaming Architecture
```
HLS Streaming:
- Adaptive bitrate selection based on connection speed
- 10-second segment duration for faster seeking
- M3U8 manifest with variant streams (360p, 720p, 1080p, 4K)
- CloudFront caching with 1-hour TTL
- HTTPS enforcement for all streams

Playback Options:
- Direct streaming (recommended)
- Progressive download (for offline viewing)
- Encrypted segments (optional, no DRM needed)
```

---

## 3. FEATURE SPECIFICATIONS

### 3.1 Screen Recording Flow
1. User opens browser or extension, clicks "Record"
2. Browser requests permissions (screen, audio, camera)
3. User selects recording source (full screen, app window, region)
4. Recording overlay appears (pause, stop, timer, quality indicator)
5. MediaRecorder API captures video stream
6. Audio context mixes system + microphone audio (volume control)
7. On stop:
   - Video saved as WebM/MP4 locally first
   - Auto-upload to S3 begins in background
   - Processing pipeline triggered
   - User gets a shareable link immediately

### 3.2 Video Playback Flow
1. User opens shared link or workspace video list
2. System validates access (workspace member or shared link valid)
3. HLS stream fetched from CloudFront
4. Player loads with adaptive bitrate (starts at 720p)
5. Comments and reactions loaded alongside video
6. Real-time comment updates via WebSocket
7. View logged in database (for workspace analytics, not displayed)

### 3.3 Collaboration Features
1. Video owner can enable commenting
2. Commenters can:
   - Add time-stamped comments
   - Reply to existing comments
   - Add emoji reactions
   - Mention team members (@name)
   - Mark comments as resolved
3. Notifications sent to mentioned users (email + in-app)
4. Comment activity shown in real-time

### 3.4 Sharing & Access Control
1. Owner creates sharing link
2. Optional: set password protection
3. Optional: set expiration date
4. Link shared (public or private)
5. Recipient visits link, views without account required (or creates account)
6. Video playback with comments enabled/disabled per owner preference

---

## 4. IMPLEMENTATION ROADMAP

### Phase 1 (MVP - 8 weeks)
- [ ] User authentication and workspace setup
- [ ] Basic screen recording (full screen + region)
- [ ] Video upload to S3 (presigned URLs)
- [ ] Simple video player with basic controls
- [ ] View count and basic video metrics (internal only)
- [ ] Password-protected sharing links
- [ ] Basic comments system (add/view/delete)

### Phase 2 (8 weeks)
- [ ] Video processing pipeline (FFmpeg, multiple bitrates)
- [ ] HLS streaming and adaptive bitrate
- [ ] Advanced collaboration (mention, reactions, threads)
- [ ] Browser extension (Chrome, Firefox)
- [ ] Team workspace management
- [ ] Export video as MP4 download

### Phase 3 (8 weeks)
- [ ] Advanced access controls (expiration, password, viewer list)
- [ ] Integrations (Zoom embed, Google Meet embed)
- [ ] Keyboard shortcuts and hotkeys
- [ ] Email notifications for comments/mentions
- [ ] Playlist functionality
- [ ] Custom workspace branding

### Phase 4 (Ongoing)
- [ ] Performance optimization (streaming improvements)
- [ ] Additional browser support
- [ ] Webhook integrations (Zapier, Make)
- [ ] Bulk upload and management
- [ ] Advanced user roles (view-only, comment-only)
- [ ] Enterprise features (SSO via OAuth, audit logs)

---

## 5. DEPLOYMENT & INFRASTRUCTURE

### 5.1 AWS Services Stack
```
- EC2 or ECS (backend application - single AZ for MVP, multi-AZ for scale)
- RDS PostgreSQL (database with read replicas for high traffic)
- S3 (video storage with lifecycle policies)
- CloudFront (CDN for video delivery)
- Lambda (video processing with SQS trigger)
- SQS (job queue for video encoding)
- SNS (notifications for processing events)
- CloudWatch (monitoring/logging)
- Secrets Manager (API keys, credentials)
- ElastiCache Redis (session cache, real-time messaging)
```

### 5.2 Desktop Deployment Considerations
- Chrome extension via Chrome Web Store
- Firefox addon via Mozilla Add-ons
- Safari extension (via App Store)
- Progressive Web App (PWA) as fallback
- Electron app (optional, future)

### 5.3 Scaling Considerations
- Horizontal scaling with load balancer (nginx)
- Database read replicas for reporting queries
- Redis cluster for session management
- Separate video processing worker fleet (auto-scaling)
- CDN cache invalidation strategy
- Rate limiting on API endpoints (100 req/min per user)

### 5.4 Security Checklist
- [ ] HTTPS everywhere (TLS 1.2+)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (input sanitization, CSP headers)
- [ ] CSRF tokens on state-changing requests
- [ ] Rate limiting and DDoS protection (AWS WAF)
- [ ] Regular security audits and penetration testing
- [ ] Encrypted database backups (daily)
- [ ] Environment variable management (AWS Secrets Manager)
- [ ] Principle of least privilege for IAM roles
- [ ] GDPR/CCPA data retention compliance
- [ ] HIPAA compliance (for healthcare verticals, optional)
- [ ] Secure password hashing (bcrypt, argon2)

---

## 6. QUALITY ASSURANCE & TESTING

### 6.1 Testing Strategy
- Unit tests (Jest) for business logic (70%+ coverage)
- Integration tests (Supertest) for API endpoints
- E2E tests (Cypress) for critical user workflows
  - Recording → Upload → Playback
  - Comment addition and notifications
  - Sharing link creation and access
- Performance tests (k6) for concurrent playback (100+ streams)
- Video codec tests for different formats (H.264, VP8, VP9)
- Browser compatibility testing (Chrome, Firefox, Safari, Edge)
- Network throttling tests (3G, 4G, 5G speeds)

### 6.2 Monitoring & Observability
- Application performance monitoring (DataDog or NewRelic)
- Error tracking (Sentry) with alerts
- Uptime monitoring (Pingdom or UptimeRobot)
- Video processing success/failure rates
- API response time metrics
- Stream quality degradation tracking
- User engagement tracking (views, comments, watch time)
- WebSocket connection health

---

## 7. PERFORMANCE TARGETS

### Recording Performance
- Support 4K recording without frame drops
- CPU usage < 30% during recording
- Memory footprint < 500MB
- Microphone + system audio mixing < 50ms latency

### Upload & Processing
- Upload speed: Stream to S3 at available bandwidth
- Processing time: < 2x video duration for transcoding
- Concurrent processing: 10+ videos simultaneously
- Segment generation: < 100ms per segment

### Playback Performance
- Playback startup: < 3 seconds (with CloudFront)
- Adaptive bitrate switch: < 2 seconds without buffering
- Seeking accuracy: ±500ms
- Concurrent viewers per video: 500+
- CDN edge locations: 200+

### Collaboration Real-Time
- Comment add/update latency: < 500ms (WebSocket)
- Comment delivery to all viewers: < 1 second
- Reaction propagation: < 300ms
- Mention notification: < 2 seconds

---

## 8. QUESTIONS FOR CLARIFICATION

When using this prompt with Claude, you may want to ask for:

1. "Generate the complete Prisma schema with validations and relationships"
2. "Write the core video upload and S3 integration service"
3. "Create the HLS streaming pipeline with FFmpeg"
4. "Implement JWT + OAuth2 authentication (Google, GitHub, Microsoft)"
5. "Design the real-time WebSocket system for comments"
6. "Write the React video player component with adaptive bitrate"
7. "Generate Docker Compose setup for local development"
8. "Write deployment scripts (GitHub Actions, ECS, CloudFormation)"
9. "Create comprehensive API documentation (OpenAPI/Swagger)"
10. "Implement browser extension manifest and background service"

---

## USAGE INSTRUCTIONS

1. **For Code Generation:**
   Copy the PRIMARY PROMPT above into Claude API or web interface
   
2. **For Specific Components:**
   Add context like: "Based on this architecture, generate the video upload service with presigned S3 URLs and progress tracking"

3. **For Desktop Optimization:**
   Specify: "Optimize the recording module for desktop-only deployment with high-resolution support (4K) and stable performance"

4. **For Refinement:**
   Use follow-up prompts: "Refactor the video processing service for horizontal scaling with 10+ concurrent processing workers"

---

## ADDITIONAL RESOURCES

### Documentation to Reference
- FFmpeg documentation: https://ffmpeg.org/documentation.html
- HLS streaming spec: https://datatracker.ietf.org/doc/html/rfc8216
- WebRTC APIs: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- OpenAPI 3.0: https://swagger.io/specification/
- AWS SDK documentation: https://docs.aws.amazon.com/sdk-for-javascript/

### Open Source Projects to Study
- Open Screen Recorder: https://github.com/siddharthvaddem/openscreen
- OBS Studio: https://github.com/obsproject/obs-studio
- ffmpeg.wasm: https://github.com/ffmpegwasm/ffmpeg.wasm
- video.js: https://videojs.com/

---

## SUCCESS METRICS

After implementing:
- [ ] MVP launches in 8 weeks
- [ ] Can record 4K video smoothly on laptops
- [ ] Video processing < 2x playback duration
- [ ] Playback startup < 3 seconds (with CDN)
- [ ] Support 500 concurrent viewers per video
- [ ] Complete audit trail for sharing and access
- [ ] Real-time comments with < 500ms latency
- [ ] Supports OAuth2 integrations (Google, GitHub)
- [ ] 99.9% uptime SLA

---

**Document Version:** 2.0  
**Last Updated:** February 2026  
**For:** Building production-ready Loom clone - Desktop/Laptop optimized, no video editor, no DRM, no analytics dashboard
