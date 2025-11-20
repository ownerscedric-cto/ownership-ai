# PRINCIPLES.md - SuperClaude Framework Core Principles

**Primary Directive**: "Evidence > assumptions | Code > documentation | Efficiency > verbosity"

## Core Philosophy

- **Structured Responses**: Use unified symbol system for clarity and token efficiency
- **Minimal Output**: Answer directly, avoid unnecessary preambles/postambles
- **Evidence-Based Reasoning**: All claims must be verifiable through testing, metrics, or documentation
- **Context Awareness**: Maintain project understanding across sessions and commands
- **Task-First Approach**: Structure before execution - understand, plan, execute, validate
- **Parallel Thinking**: Maximize efficiency through intelligent batching and parallel operations

## Development Principles

### SOLID Principles

- **Single Responsibility**: Each class, function, or module has one reason to change
- **Open/Closed**: Software entities should be open for extension but closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for their base classes
- **Interface Segregation**: Clients should not be forced to depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

### Core Design Principles

- **DRY**: Abstract common functionality, eliminate duplication
- **KISS**: Prefer simplicity over complexity in all design decisions
- **YAGNI**: Implement only current requirements, avoid speculative features
- **Composition Over Inheritance**: Favor object composition over class inheritance
- **Separation of Concerns**: Divide program functionality into distinct sections
- **Loose Coupling**: Minimize dependencies between components
- **High Cohesion**: Related functionality should be grouped together logically

## Senior Developer Mindset

### Decision-Making

- **Systems Thinking**: Consider ripple effects across entire system architecture
- **Long-term Perspective**: Evaluate decisions against multiple time horizons
- **Stakeholder Awareness**: Balance technical perfection with business constraints
- **Risk Calibration**: Distinguish between acceptable risks and unacceptable compromises
- **Architectural Vision**: Maintain coherent technical direction across projects
- **Debt Management**: Balance technical debt accumulation with delivery pressure

### Error Handling

- **Fail Fast, Fail Explicitly**: Detect and report errors immediately with meaningful context
- **Never Suppress Silently**: All errors must be logged, handled, or escalated appropriately
- **Context Preservation**: Maintain full error context for debugging and analysis
- **Recovery Strategies**: Design systems with graceful degradation

### Testing Philosophy

- **Test-Driven Development**: Write tests before implementation to clarify requirements
- **Testing Pyramid**: Emphasize unit tests, support with integration tests, supplement with E2E tests
- **Tests as Documentation**: Tests should serve as executable examples of system behavior
- **Comprehensive Coverage**: Test all critical paths and edge cases thoroughly

### Dependency Management

- **Minimalism**: Prefer standard library solutions over external dependencies
- **Security First**: All dependencies must be continuously monitored for vulnerabilities
- **Transparency**: Every dependency must be justified and documented
- **Version Stability**: Use semantic versioning and predictable update strategies

### Performance Philosophy

- **Measure First**: Base optimization decisions on actual measurements, not assumptions
- **Performance as Feature**: Treat performance as a user-facing feature, not an afterthought
- **Continuous Monitoring**: Implement monitoring and alerting for performance regression
- **Resource Awareness**: Consider memory, CPU, I/O, and network implications of design choices

### Observability

- **Purposeful Logging**: Every log entry must provide actionable value for operations or debugging
- **Structured Data**: Use consistent, machine-readable formats for automated analysis
- **Context Richness**: Include relevant metadata that aids in troubleshooting and analysis
- **Security Consciousness**: Never log sensitive information or expose internal system details

## Decision-Making Frameworks

### Evidence-Based Decision Making

- **Data-Driven Choices**: Base decisions on measurable data and empirical evidence
- **Hypothesis Testing**: Formulate hypotheses and test them systematically
- **Source Credibility**: Validate information sources and their reliability
- **Bias Recognition**: Acknowledge and compensate for cognitive biases in decision-making
- **Documentation**: Record decision rationale for future reference and learning

### Trade-off Analysis

- **Multi-Criteria Decision Matrix**: Score options against weighted criteria systematically
- **Temporal Analysis**: Consider immediate vs. long-term trade-offs explicitly
- **Reversibility Classification**: Categorize decisions as reversible, costly-to-reverse, or irreversible
- **Option Value**: Preserve future options when uncertainty is high

### Risk Assessment

- **Proactive Identification**: Anticipate potential issues before they become problems
- **Impact Evaluation**: Assess both probability and severity of potential risks
- **Mitigation Strategies**: Develop plans to reduce risk likelihood and impact
- **Contingency Planning**: Prepare responses for when risks materialize

## Quality Philosophy

### Quality Standards

- **Non-Negotiable Standards**: Establish minimum quality thresholds that cannot be compromised
- **Continuous Improvement**: Regularly raise quality standards and practices
- **Measurement-Driven**: Use metrics to track and improve quality over time
- **Preventive Measures**: Catch issues early when they're cheaper and easier to fix
- **Automated Enforcement**: Use tooling to enforce quality standards consistently

### Quality Framework

- **Functional Quality**: Correctness, reliability, and feature completeness
- **Structural Quality**: Code organization, maintainability, and technical debt
- **Performance Quality**: Speed, scalability, and resource efficiency
- **Security Quality**: Vulnerability management, access control, and data protection

## Ethical Guidelines

### Core Ethics

- **Human-Centered Design**: Always prioritize human welfare and autonomy in decisions
- **Transparency**: Be clear about capabilities, limitations, and decision-making processes
- **Accountability**: Take responsibility for the consequences of generated code and recommendations
- **Privacy Protection**: Respect user privacy and data protection requirements
- **Security First**: Never compromise security for convenience or speed

### Human-AI Collaboration

- **Augmentation Over Replacement**: Enhance human capabilities rather than replace them
- **Skill Development**: Help users learn and grow their technical capabilities
- **Error Recovery**: Provide clear paths for humans to correct or override AI decisions
- **Trust Building**: Be consistent, reliable, and honest about limitations
- **Knowledge Transfer**: Explain reasoning to help users learn

## AI-Driven Development Principles

### Code Generation Philosophy

- **Context-Aware Generation**: Every code generation must consider existing patterns, conventions, and architecture
- **Incremental Enhancement**: Prefer enhancing existing code over creating new implementations
- **Pattern Recognition**: Identify and leverage established patterns within the codebase
- **Framework Alignment**: Generated code must align with existing framework conventions and best practices

### Tool Selection and Coordination

- **Capability Mapping**: Match tools to specific capabilities and use cases rather than generic application
- **Parallel Optimization**: Execute independent operations in parallel to maximize efficiency
- **Fallback Strategies**: Implement robust fallback mechanisms for tool failures or limitations
- **Evidence-Based Selection**: Choose tools based on demonstrated effectiveness for specific contexts

### Error Handling and Recovery Philosophy

- **Proactive Detection**: Identify potential issues before they manifest as failures
- **Graceful Degradation**: Maintain functionality when components fail or are unavailable
- **Context Preservation**: Retain sufficient context for error analysis and recovery
- **Automatic Recovery**: Implement automated recovery mechanisms where possible

### Testing and Validation Principles

- **Comprehensive Coverage**: Test all critical paths and edge cases systematically
- **Risk-Based Priority**: Focus testing efforts on highest-risk and highest-impact areas
- **Automated Validation**: Implement automated testing for consistency and reliability
- **User-Centric Testing**: Validate from the user's perspective and experience

### Framework Integration Principles

- **Native Integration**: Leverage framework-native capabilities and patterns
- **Version Compatibility**: Maintain compatibility with framework versions and dependencies
- **Convention Adherence**: Follow established framework conventions and best practices
- **Lifecycle Awareness**: Respect framework lifecycles and initialization patterns

### Continuous Improvement Principles

- **Learning from Outcomes**: Analyze results to improve future decision-making
- **Pattern Evolution**: Evolve patterns based on successful implementations
- **Feedback Integration**: Incorporate user feedback into system improvements
- **Adaptive Behavior**: Adjust behavior based on changing requirements and contexts

## Production SaaS Development Principles

### Provider Independence Strategy

- **Database Abstraction**: Use ORM layers (Prisma, TypeORM, Drizzle) to maintain database provider independence
- **Authentication Abstraction**: Implement auth providers through standardized interfaces (NextAuth.js, Supabase Auth)
- **Storage Abstraction**: Design storage interfaces that can switch between providers (S3, GCS, Supabase Storage, local)
- **Migration Readiness**: Architect with the assumption that providers will change over time
- **Configuration Separation**: Externalize provider-specific configuration from business logic
- **Interface-Driven Design**: Define provider contracts through interfaces before implementation

### API-First Development

- **Consistent Response Format**: Standardize success/error responses across all endpoints
  - Success: `{ success: true, data: {...}, metadata?: { total?, page?, limit? } }`
  - Error: `{ success: false, error: { code: string, message: string, details?: any } }`
- **RESTful Design**: Follow REST principles with proper HTTP methods and status codes
  - GET: Retrieve resources (200, 404)
  - POST: Create resources (201, 400, 409)
  - PUT/PATCH: Update resources (200, 404, 400)
  - DELETE: Remove resources (204, 404)
- **Versioning Strategy**: Plan for API versioning from the start (URL-based: /api/v1/, /api/v2/)
- **Documentation First**: Document API contracts before implementation (OpenAPI/Swagger)
- **Contract Testing**: Validate API responses against documented contracts
- **Error Code Standards**: Use consistent error codes across the application

### External Integration Patterns

- **Adapter Pattern**: Implement unified interfaces for multiple external API providers
  - Define common interface (IProgramAPIClient)
  - Implement provider-specific adapters (MSMEAPIClient, KStartupAPIClient)
  - Use orchestrator for multi-provider coordination
- **Parallel Processing**: Use Promise.allSettled for concurrent external API calls
- **Error Resilience**: Handle partial failures gracefully in multi-provider scenarios
- **Rate Limiting**: Implement per-provider rate limiting and retry strategies
- **Timeout Management**: Set appropriate timeouts for external API calls
- **Circuit Breaker**: Implement circuit breaker pattern for failing external services
- **Response Normalization**: Transform provider-specific responses to common format

### Component Architecture Principles

- **Feature-Based Organization**: Organize components by business domain, not technical type
  - ✅ `/components/customers/`, `/components/programs/`, `/components/matching/`
  - ❌ `/components/buttons/`, `/components/forms/`, `/components/modals/`
- **Single Responsibility**: Each component has one clear purpose and reason to change
- **Composition Over Inheritance**: Use composition patterns over complex inheritance hierarchies
- **Compound Components**: Implement compound component patterns for complex UI interactions
  - Example: `<Table>`, `<Table.Header>`, `<Table.Row>`, `<Table.Cell>`
  - Example: `<Accordion>`, `<Accordion.Item>`, `<Accordion.Trigger>`, `<Accordion.Content>`
- **Prop Drilling Avoidance**: Use context or state management for deeply nested props (>3 levels)
- **Component Reusability**: Design components to be reusable across different contexts
- **Error Boundaries**: Implement error boundaries for component-level error handling
  - Wrap feature components with ErrorBoundary for graceful degradation
  - Log errors to monitoring service (Sentry, LogRocket)
- **Accessibility (A11y)**: Follow WCAG 2.1 AA standards
  - Use semantic HTML elements (nav, main, article, section)
  - Add ARIA attributes for dynamic content (aria-live, aria-label, aria-describedby)
  - Support keyboard navigation (Tab, Enter, Escape, Arrow keys)
  - Test with screen readers (VoiceOver, NVDA)

### Design System & UI Standards

- **UI Framework**: TailwindCSS + shadcn/ui for consistent, customizable components
  - Use Tailwind utility classes for styling
  - Leverage shadcn/ui components as base (Button, Input, Dialog, Table, etc.)
  - Customize theme in `tailwind.config.ts`
- **Color Palette**:
  - **Primary Blue**: `#0052CC` (브랜드 컬러, CTA 버튼, 링크)
  - **Primary Dark**: `#1F2937` (텍스트, 헤더)
  - **White**: `#FFFFFF` (배경, 카드)
  - **Gray Scale**: Tailwind gray-50 ~ gray-900
  - **Success**: `#10B981`, **Warning**: `#F59E0B`, **Error**: `#EF4444`
- **Typography**:
  - **Primary Font**: Pretendard (한글), Inter (영문) via next/font
  - **Fallback**: Noto Sans KR, system-ui
  - **Font Sizes**: H1 (36px/2.25rem), H2 (28px/1.75rem), H3 (20px/1.25rem), Body (14px/0.875rem)
  - **Line Height**: 1.5 (본문), 1.2 (제목)
  - **Font Weight**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Icons**: Lucide React icons only (NO emojis)
  - Import: `import { IconName } from 'lucide-react'`
  - Size: 16px (sm), 20px (md), 24px (lg)
- **Spacing**: Use Tailwind spacing scale (4px base unit)
  - Padding: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
  - Gap: gap-2, gap-4, gap-6
- **Layout Patterns**:
  - **Responsive Design**: Mobile-first approach (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
  - **Container**: max-w-7xl mx-auto px-4
  - **Card Layout**: bg-white rounded-lg shadow-sm p-6
  - **Grid Layout**: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Animation**:
  - Use Framer Motion for complex animations
  - CSS Transitions for simple hover/focus states (transition-all duration-200)
  - Smooth scroll: `scroll-behavior: smooth`
- **Benchmarks** (Reference for UX patterns):
  - **커넥트웍스** (works.connect24.kr): 필터 UX, 통계 표시, 카드 기반 리스트
  - **허블** (hubble.co.kr): 미니멀 디자인, 브랜드 신뢰도, 3단계 프로세스 시각화

### State Management Strategy

- **State Separation**: Clearly separate server state from client state
  - **Server State**: Use React Query/SWR for API data, caching, revalidation, synchronization
  - **Client State**: Use Zustand/Redux for UI state, user preferences, temporary data
- **No Mixed State**: Never mix server and client state management approaches in the same store
- **Optimistic Updates**: Implement optimistic UI updates with automatic rollback on failure
- **Cache Invalidation**: Implement proper cache invalidation strategies based on data mutations
- **State Normalization**: Normalize complex nested state for easier updates and queries
- **Persistence Strategy**: Clearly define which state persists (localStorage, sessionStorage, database)

### Performance Optimization Strategy

- **Database Query Optimization**:
  - Create indexes on frequently queried fields (user_id, created_at, status, foreign keys)
  - Use SELECT specific columns instead of SELECT \*
  - Implement cursor-based pagination for large datasets (avoid OFFSET for >1000 records)
  - Use database connection pooling (PgBouncer, Prisma connection pool)
  - Avoid N+1 queries through eager loading or DataLoader pattern
  - Monitor slow queries (>100ms) with EXPLAIN ANALYZE
- **Caching Strategy**:
  - Redis for session data and frequently accessed database queries (TTL: 5-30min)
  - React Query/SWR for client-side API response caching with stale-while-revalidate
    - `staleTime: 5 * 60 * 1000` (5 minutes)
    - `cacheTime: 10 * 60 * 1000` (10 minutes)
  - CDN caching for static assets (images, fonts, CSS, JS)
  - Service Worker caching for offline capability
- **Code Splitting & Lazy Loading**:
  - Route-based code splitting with dynamic imports
  - Component lazy loading for heavy UI components (charts, editors)
  - Tree shaking to eliminate dead code
  - Bundle analysis to identify optimization opportunities
- **Asset Optimization**:
  - Image optimization with Next.js Image component or modern formats (WebP, AVIF)
  - Font optimization with next/font or font subsetting
  - CSS extraction and minification
  - JavaScript minification and compression (Brotli, gzip)
- **UI Performance**:
  - Use React.memo, useMemo, useCallback for expensive components
  - Implement virtual scrolling for long lists (react-window, react-virtual)
  - Use infinite scroll or pagination for large datasets
  - Debounce search inputs, throttle scroll handlers

### Migration & Deployment Readiness

- **Environment Separation**: Clear separation between development, staging, production
- **Configuration Management**: Use environment variables for all environment-specific settings
- **Database Migrations**: Use migration tools (Prisma Migrate, Drizzle Kit) with version control
- **Zero-Downtime Deployment**: Design for rolling deployments without service interruption
- **Rollback Strategy**: Maintain ability to rollback both code and database changes
- **Feature Flags**: Implement feature flags for gradual feature rollout
- **Health Checks**: Implement health check endpoints for monitoring and load balancers

### Observability & Monitoring Strategy

- **Structured Logging**: Use consistent log format with contextual metadata
  - Include: timestamp, user_id, request_id, operation, duration, status
  - Log levels: ERROR (critical failures), WARN (recoverable issues), INFO (key operations), DEBUG (development)
  - Never log sensitive data (passwords, tokens, PII)
- **Error Tracking**: Integrate error monitoring service (Sentry, LogRocket)
  - Capture stack traces, user context, breadcrumbs
  - Set up alerts for critical errors (500 errors, auth failures)
- **Performance Monitoring**: Track key metrics
  - API response times (<200ms target)
  - Database query performance (<100ms target)
  - Frontend Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
- **API Logging**: Log all API calls with metrics
  - Request: method, path, user_id, timestamp
  - Response: status_code, duration, error_code
  - External API calls: provider, endpoint, duration, rate_limit_remaining

### Mobile Optimization Principles

- **Target Users**: 1인 컨설턴트 (외근/영업 중 모바일 사용 빈도 높음)
- **Responsive Strategy**:
  - **Desktop-First**: 복잡한 입력/관리 화면 (고객 등록, 매칭 설정, 대시보드, 커뮤니케이션 관리)
  - **Mobile-Optimized**: 조회/확인/간단한 액션 (고객 조회, 매칭 결과 확인, 프로그램 상세, 메모/상태 업데이트)
- **Mobile-First Screens**: 고객 조회/검색, 매칭 결과 확인, 프로그램 상세 조회, 간단한 메모/상태 업데이트
- **Desktop-First Screens**: 고객 등록/수정, 매칭 실행 설정, 대시보드/통계, 커뮤니케이션 관리
- **TailwindCSS Breakpoints**:
  - Mobile: < 768px (sm 미만)
  - Tablet: 768px - 1024px (md - lg)
  - Desktop: 1024px+ (lg+)
- **Mobile UX Optimization**:
  - **터치 영역**: 최소 44x44px (버튼, 링크, 아이콘)
  - **폰트 크기**: 최소 16px (모바일 자동 줌 방지)
  - **네비게이션**: Bottom Tab Bar (홈, 고객, 프로그램, 매칭, 내정보)
  - **스와이프 제스처**: 카드 좌우 스와이프 (삭제, 수정), Pull-to-Refresh
  - **로딩 상태**: Skeleton UI (네트워크 지연 대응)
  - **오프라인 대응**: Service Worker (기본 캐싱)
- **Performance Budgets**:
  - Load Time: <3s on 3G, <1s on WiFi
  - Bundle Size: <500KB initial, <2MB total
  - Memory Usage: <100MB for mobile, <500MB for desktop
  - CPU Usage: <30% average, <80% peak for 60fps
- **Mobile Completion Criteria**:
  - Lighthouse Mobile Performance 90+ 점수
  - 모바일 주요 화면 터치 인터랙션 테스트 완료
  - Core Web Vitals 충족: LCP <2.5s, FID <100ms, CLS <0.1
  - 테스트 디바이스: iPhone SE (375px), iPhone 14 Pro (393px), iPad (768px)
