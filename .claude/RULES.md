# RULES.md - SuperClaude Framework Actionable Rules

Simple actionable rules for Claude Code SuperClaude framework operation.

## Core Operational Rules

### Task Management Rules

- TodoRead() → TodoWrite(3+ tasks) → Execute → Track progress
- Use batch tool calls when possible, sequential only when dependencies exist
- Always validate before execution, verify after completion
- Run lint/typecheck before marking tasks complete
- Use /spawn and /task for complex multi-session workflows
- Maintain ≥90% context retention across operations

### File Operation Security

- Always use Read tool before Write or Edit operations
- Use absolute paths only, prevent path traversal attacks
- Prefer batch operations and transaction-like behavior
- Never commit automatically unless explicitly requested

### Framework Compliance

- Check package.json/pyproject.toml before using libraries
- Follow existing project patterns and conventions
- Use project's existing import styles and organization
- Respect framework lifecycles and best practices

### Component Architecture Rules

- **Feature-Based Organization**: Organize by business domain, not technical type
  - ✅ `/components/customers/CustomerCard.tsx`
  - ❌ `/components/cards/CustomerCard.tsx`
- **Single Responsibility**: Each component has one clear purpose
- **Composition Patterns**: Use compound components for complex UI (Accordion, Tabs, Dialog)
  - Pattern: `<Table>`, `<Table.Header>`, `<Table.Row>`, `<Table.Cell>`
  - Avoid prop drilling through compound component context
- **No Prop Drilling**: Use React Context or state management for deeply nested props (>3 levels)
- **Component Naming**: Use PascalCase for components, descriptive names reflecting purpose
- **File Collocation**: Keep component, styles, tests, and types in same directory
- **Error Boundaries**: Wrap feature components with ErrorBoundary
  - Catch and log component errors
  - Show user-friendly fallback UI
- **Performance Optimization**: Apply React.memo, useMemo, useCallback for expensive components
  - Profile with React DevTools Profiler before optimizing
  - Virtual scrolling for lists >100 items
- **Accessibility**: Follow WCAG 2.1 AA standards
  - Semantic HTML, ARIA attributes, keyboard navigation
  - Test with screen readers

### Design & Styling Rules

- **TailwindCSS Only**: Use Tailwind utility classes exclusively (NO custom CSS files)
  - Exception: Global styles in `app/globals.css` for @layer base, components, utilities
- **shadcn/ui Components**: Use as base, customize via className prop
  - Import from `@/components/ui/*`
  - Do NOT modify shadcn component files directly
- **Color Usage**:
  - Primary actions → `bg-[#0052CC] text-white` (Primary Blue)
  - Text → `text-gray-900` (Primary Dark), `text-gray-600` (secondary text)
  - Backgrounds → `bg-white`, `bg-gray-50` (subtle backgrounds)
  - Status: `text-green-600` (success), `text-yellow-600` (warning), `text-red-600` (error)
- **Typography**:
  - Headings: `font-semibold` or `font-bold`
  - Body: `font-normal` or `font-medium`
  - Use Pretendard font via next/font
- **Icons**: Lucide React ONLY (NO emojis, NO other icon libraries)
  - Example: `<User className="w-5 h-5" />`
- **Spacing Consistency**: Use Tailwind spacing scale (p-4, gap-6, etc.)
- **Responsive Design**: Mobile-first with Tailwind breakpoints
  - `sm:`, `md:`, `lg:`, `xl:` prefixes
- **Animation**: Framer Motion for complex, CSS transitions for simple
  - Hover states: `transition-all duration-200 hover:bg-gray-100`

### State Management Patterns

- **Server State**: Use React Query/SWR for all API data
  - Automatic caching, revalidation, background refetching
  - Example: `useQuery(['users'], fetchUsers, { staleTime: 5 * 60 * 1000 })`
  - Configure staleTime (5min) and cacheTime (10min)
- **Client State**: Use Zustand/Redux for UI state and user preferences
  - UI toggles (sidebar open/closed, theme, language)
  - Temporary form data, wizard state
- **No Mixed State**: Never use React Query for client-only state
- **No Redundant State**: Don't duplicate server state in client state
- **Optimistic Updates**: Implement for better UX, with rollback on error
  - Example: `useMutation({ onMutate: async () => { /* optimistic update */ } })`
- **Cache Keys**: Use consistent naming convention for query keys
  - Pattern: `[entity, id?, filter?]` - Example: `['customers', '123']`, `['programs', { status: 'active' }]`
- **Infinite Scroll/Pagination**: Use for large datasets
  - React Query `useInfiniteQuery` for infinite scroll
  - Cursor-based pagination for better performance

### API Development Standards

- **Standard Response Format**: All API routes must use consistent format
  - Success: `{ success: true, data: T, metadata?: { total, page, limit } }`
  - Error: `{ success: false, error: { code, message, details? } }`
- **HTTP Status Codes**: Use appropriate status codes (200, 201, 400, 401, 403, 404, 500)
- **Error Codes**: Use consistent error code strings (USER_NOT_FOUND, INVALID_INPUT, DB_ERROR)
- **Request Validation**: MANDATORY - Validate all inputs using Zod before processing
  - Example: `const body = requestSchema.parse(await req.json())`
  - Return 400 with validation errors on failure
- **Response Typing**: Define TypeScript types for all API responses
- **Rate Limiting**: Implement rate limiting for all API endpoints
  - External API calls: Respect provider limits (공공데이터포털: 1000/day)
  - Internal API: Prevent abuse (100 requests/min per user)
  - Use Redis for distributed rate limiting
- **API Documentation**: Document all endpoints with OpenAPI/Swagger
  - Include request/response schemas, error codes, examples
  - Auto-generate from TypeScript types when possible
- **Authentication/Authorization**: Apply middleware to all protected endpoints
  - Use NextAuth.js session validation
  - Check user permissions before data access

### Systematic Codebase Changes

- **MANDATORY**: Complete project-wide discovery before any changes
- Search ALL file types for ALL variations of target terms
- Document all references with context and impact assessment
- Plan update sequence based on dependencies and relationships
- Execute changes in coordinated manner following plan
- Verify completion with comprehensive post-change search
- Validate related functionality remains working
- Use Task tool for comprehensive searches when scope uncertain

### External API Integration Rules

- **Adapter Pattern**: Use unified interface for multiple external API providers
  - Define common interface (e.g., IProgramAPIClient)
  - Implement provider-specific adapters (e.g., MSMEAPIClient, KStartupAPIClient)
  - Use orchestrator for multi-provider coordination (ProgramSyncOrchestrator)
- **Parallel Processing**: Use Promise.allSettled for concurrent external API calls
  - Independent API failures should not block other providers
  - Collect all results (fulfilled + rejected) for comprehensive error handling
- **Rate Limiting**: Implement per-provider rate limiting
  - 공공데이터포털: Respect 1000 requests/day limit
  - Use exponential backoff retry strategy (2^n seconds delay)
  - Log rate limit headers and remaining quota
- **Error Resilience**: Handle partial failures gracefully
  - Log provider-specific errors with full context
  - Continue processing other providers on single provider failure
  - Store rawData JSON field to preserve original API responses
- **Timeout Management**: Set appropriate timeouts for external API calls
  - Default: 10 seconds for single API call
  - Sync operations: 5 minutes for batch operations
- **Response Normalization**: Transform provider-specific responses to common format
  - Extract keywords, location, target audience consistently
  - Use @@unique([dataSource, sourceApiId]) to prevent duplicates
- **Sync Strategy**: Implement incremental sync with lastSyncedAt tracking
  - Full sync: Initial data collection
  - Incremental sync: Only fetch changes since lastSyncedAt
  - Mark outdated/deleted programs with syncStatus field

## Quick Reference

### Do

✅ Read before Write/Edit/Update
✅ Use absolute paths
✅ Batch tool calls
✅ Validate before execution
✅ Check framework compatibility
✅ Auto-activate personas
✅ Preserve context across operations
✅ Use quality gates (see ORCHESTRATOR.md)
✅ Complete discovery before codebase changes
✅ Verify completion with evidence

### Don't

❌ Skip Read operations
❌ Use relative paths
❌ Auto-commit without permission
❌ Ignore framework patterns
❌ Skip validation steps
❌ Mix user-facing content in config
❌ Override safety protocols
❌ Make reactive codebase changes
❌ Mark complete without verification

### Auto-Triggers

- Wave mode: complexity ≥0.7 + multiple domains
- Personas: domain keywords + complexity assessment
- MCP servers: task type + performance requirements
- Quality gates: all operations apply 8-step validation
