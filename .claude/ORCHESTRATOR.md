# ORCHESTRATOR.md - SuperClaude Intelligent Routing System

Intelligent routing system for Claude Code SuperClaude framework.

## 🧠 Detection Engine

Analyzes requests to understand intent, complexity, and requirements.

### Pre-Operation Validation Checks

**Resource Validation**:

- Token usage prediction based on operation complexity and scope
- Memory and processing requirements estimation
- File system permissions and available space verification
- MCP server availability and response time checks

**Compatibility Validation**:

- Flag combination conflict detection (e.g., `--no-mcp` with `--seq`)
- Persona + command compatibility verification
- Tool availability for requested operations
- Project structure requirements validation

**Risk Assessment**:

- Operation complexity scoring (0.0-1.0 scale)
- Failure probability based on historical patterns
- Resource exhaustion likelihood prediction
- Cascading failure potential analysis

**Validation Logic**: Resource availability, flag compatibility, risk assessment, outcome prediction, and safety recommendations. Operations with risk scores >0.8 trigger safe mode suggestions.

**Resource Management Thresholds**:

- **Green Zone** (0-60%): Full operations, predictive monitoring active
- **Yellow Zone** (60-75%): Resource optimization, caching, suggest --uc mode
- **Orange Zone** (75-85%): Warning alerts, defer non-critical operations
- **Red Zone** (85-95%): Force efficiency modes, block resource-intensive operations
- **Critical Zone** (95%+): Emergency protocols, essential operations only

## ⚡ Performance Optimization

Resource management, operation batching, and intelligent optimization for sub-100ms performance targets.

**Token Management**: Intelligent resource allocation based on unified Resource Management Thresholds (see Detection Engine section)

**Operation Batching**:

- **Tool Coordination**: Parallel operations when no dependencies
- **Context Sharing**: Reuse analysis results across related routing decisions
- **Cache Strategy**: Store successful routing patterns for session reuse
- **Task Delegation**: Intelligent sub-agent spawning for parallel processing
- **Resource Distribution**: Dynamic token allocation across sub-agents

**Resource Allocation**:

- **Detection Engine**: 1-2K tokens for pattern analysis
- **Decision Trees**: 500-1K tokens for routing logic
- **MCP Coordination**: Variable based on servers activated

**Production Performance Optimization Strategies**:

**Database Query Optimization**:

- Create indexes on frequently queried fields (user_id, created_at, status, foreign_keys)
- Use SELECT specific columns instead of SELECT \*
- Implement cursor-based pagination for large datasets (avoid OFFSET for >1000 records)
- Use database connection pooling (PgBouncer, Prisma connection pool)
- Avoid N+1 queries through eager loading or DataLoader pattern
- Monitor slow queries (>100ms) and optimize with EXPLAIN ANALYZE

**Caching Strategy**:

- **Redis Caching**: Session data, frequently accessed queries, rate limiting counters
  - TTL strategy: Session (30min), Query cache (5min), Static data (1hr)
- **React Query/SWR**: Client-side API response caching with stale-while-revalidate
  - `staleTime: 5 * 60 * 1000` (5 minutes)
  - `cacheTime: 10 * 60 * 1000` (10 minutes)
- **CDN Caching**: Static assets (images, fonts, CSS, JS) with long-term cache headers
  - `Cache-Control: public, max-age=31536000, immutable` for versioned assets
- **Service Worker**: Offline capability and network-first/cache-first strategies
- **Cache Invalidation**: Tag-based invalidation, time-based expiry, event-driven purging

**Code Splitting & Bundle Optimization**:

- **Route-Based Splitting**: Automatic with Next.js App Router or dynamic imports
  - `const Module = dynamic(() => import('./Module'), { loading: () => <Spinner /> })`
- **Component Lazy Loading**: Heavy components (charts, editors, video players)
- **Tree Shaking**: Ensure proper ES modules usage, avoid default exports for utilities
- **Bundle Analysis**: Regular analysis with `@next/bundle-analyzer` or `webpack-bundle-analyzer`
  - Target: Initial bundle <500KB, total <2MB
- **Vendor Splitting**: Separate vendor code from application code for better caching

**Asset Optimization**:

- **Image Optimization**: Next.js Image component with automatic format selection
  - Use WebP/AVIF formats with JPEG fallback
  - Implement responsive images with `sizes` attribute
  - Lazy load images below the fold
- **Font Optimization**: Use `next/font` with font subsetting
  - Preload critical fonts: `<link rel="preload" as="font" />`
  - Use `font-display: swap` to prevent FOIT (Flash of Invisible Text)
- **CSS Optimization**: Extract critical CSS, minify, remove unused styles
  - Use CSS modules or Tailwind with JIT compilation
- **JavaScript Optimization**: Minification, compression (Brotli preferred over gzip)
  - Enable `swcMinify` in Next.js for faster builds

**Network Optimization**:

- **HTTP/2 or HTTP/3**: Enable on server for multiplexing and push capabilities
- **Compression**: Brotli compression for text assets (HTML, CSS, JS, JSON)
- **Resource Hints**: Use preconnect, prefetch, preload strategically
  - `<link rel="preconnect" href="https://api.example.com" />`
- **API Response Compression**: Enable gzip/brotli for API responses
- **Request Batching**: Batch multiple API calls into single request when possible

**Runtime Performance**:

- **React Optimization**: useMemo, useCallback, React.memo for expensive components
  - Profile with React DevTools Profiler to identify render bottlenecks
- **Virtual Scrolling**: Implement for long lists (react-window, react-virtual)
- **Debouncing/Throttling**: Debounce search inputs, throttle scroll handlers
- **Web Workers**: Offload heavy computations (data processing, parsing)
- **Streaming SSR**: Use React 18 Suspense and streaming for faster TTFB

**Performance Monitoring**:

- **Core Web Vitals**: Monitor LCP (<2.5s), FID (<100ms), CLS (<0.1)
- **Real User Monitoring**: Track actual user experience with analytics
- **Server Monitoring**: Response times, error rates, resource usage
- **Performance Budgets**: Set and enforce budgets for bundle size, load time
  - Fail CI builds if budgets exceeded
