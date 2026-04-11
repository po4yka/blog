-- Auto-generated from source files. Do not edit manually.
-- Run "npm run generate:all" to regenerate.


-- Categories
INSERT INTO categories (name) VALUES
('All');

-- Projects
INSERT INTO projects (id, name, description, platforms, tags, links, featured, sort_order) VALUES
('copilot', 'Copilot AI Platform',
 'Multi-agent assistant for a regulated investment platform. Layered architecture with durable orchestration, supervisory agent graphs, and self-hosted LLM inference.',
 '["Backend","AI"]', '["LangGraph","PydanticAI","Temporal","vLLM","Bifrost","Langfuse","FastAPI","Go"]',
 '[]', 1, 0),
('slack-gateway', 'CI/CD Slack Bot',
 'Internal CI/CD operations bot connecting Slack to GitLab pipelines. Build triggers, release management, Play Store publishing, and crash reporting.',
 '["Backend"]', '["Python","Flask","Slack Bolt","GitLab CI","Google Play API","OpenTelemetry","Kubernetes"]',
 '[]', 0, 1),
('agents-framework', 'AGENTS.md Framework',
 'Tool-neutral AI agent policy framework consumed by Claude Code, Gemini CLI, and OpenAI Codex across multiple repositories.',
 '["Tooling"]', '["Claude Code","Gemini CLI","Codex","YAML","MCP","AI Agents"]',
 '[]', 1, 2),
('kotlin-ci-toolchain', 'Kotlin CI Toolchain',
 'Kotlin-native CLI tools that replaced the entire Fastlane/Ruby release pipeline for Android CI/CD.',
 '["Android"]', '["Kotlin","picocli","GitLab CI","Gradle","CLI"]',
 '[]', 0, 3),
('anr-watchdog', 'ANR Watchdog',
 'Android library with Java-level ANR monitor and C++ native signal handler for catching events the JVM monitor misses.',
 '["Android"]', '["Kotlin","C++","NDK","CMake","Firebase Crashlytics"]',
 '[]', 0, 4),
('blog', 'po4yka.dev',
 'Personal portfolio and technical blog. Astro 6 + React 19 islands, Cloudflare Workers + D1, WebAuthn admin panel.',
 '["Web"]', '["Astro","React","TypeScript","Cloudflare Workers","D1","WebAuthn"]',
 '[{"type":"GitHub","href":"https://github.com/po4yka/blog"}]', 0, 5),
('ripdpi', 'RIPDPI',
 'Android app for network connectivity optimization with local SOCKS5 proxy, adaptive DPI evasion, and encrypted DNS support.',
 '["Android"]', '["Kotlin","Rust","JNI","SOCKS5","DNS","VPN","NDK"]',
 '[{"type":"GitHub","href":"https://github.com/po4yka/RIPDPI"}]', 0, 6),
('bite-size-reader', 'Bite-Size Reader',
 'Telegram bot + KMP mobile client for AI-powered article and YouTube video summarization with offline reading.',
 '["Android","iOS","Backend"]', '["KMP","Compose Multiplatform","Python","FastAPI","Telegram Bot","Ktor","SQLDelight"]',
 '[{"type":"GitHub","href":"https://github.com/po4yka/bite-size-reader"},{"type":"GitHub","href":"https://github.com/po4yka/bite-size-reader-client"}]', 1, 7);

-- Roles
INSERT INTO roles (id, period, company, title, description, tags, sort_order) VALUES
('garage-ai', 'Apr 2026 — Present', 'Garage IT', 'AI Engineer',
 'Building Copilot, a multi-agent assistant for a regulated multi-asset investment platform. Own the agent architecture, self-hosted LLM infrastructure, and AI platform decisions.',
 '["LangGraph","PydanticAI","Temporal","vLLM","Python"]', 0),
('garage-senior', 'Dec 2024 — Present', 'Garage IT', 'Senior Android Developer',
 'Decomposed a 1,500-LOC Activity monolith into a plugin architecture, replaced the Ruby CI pipeline with Kotlin tooling, and introduced AI coding agent workflows.',
 '["Kotlin","Compose","CI/CD","MobileOps","Claude Code"]', 1),
('garage-android', 'Nov 2022 — Dec 2024', 'Garage IT', 'Android Developer',
 'Android and MobileOps engineer on a multi-asset retail investment platform across 3 regulated markets. Owned the CI/CD infrastructure, release pipeline, and internal developer tooling.',
 '["Kotlin","Compose","Coroutines","Gradle","Python"]', 2),
('vk-mid', 'Feb 2022 — Nov 2022', 'VK', 'Android Developer',
 'Middle Android Developer on VK Clips, a short-form video product inside the VK super-app.',
 '["Kotlin","Dagger 2","Material Design","Modularization"]', 3),
('vk-junior', 'Mar 2021 — Feb 2022', 'VK', 'Junior Android Developer',
 'Junior Android Developer on VK Clips, a short-form video service at VK.',
 '["Kotlin","Android SDK","UI Performance"]', 4),
('epam', 'Feb 2021 — Jun 2021', 'EPAM Systems', 'Industrial Practice (Internship)',
 'Android development internship focused on Agile practices, automated testing, and cross-platform development.',
 '["Kotlin","Android",".NET","Agile"]', 5),
('leti', 'Sep 2020 — Mar 2021', 'LETI', 'Junior Android Developer (Part-time)',
 'Built a Kotlin-based Android app with MVVM architecture as a university course hub.',
 '["Kotlin","Jetpack Compose","MVVM","Docker"]', 6);

-- Site settings
INSERT INTO site_settings (id, name, handle, role, bio, github, email, telegram, linkedin) VALUES
(1, 'Nikita Pochaev', '@po4yka',
 'Mobile Developer — Android, iOS, Kotlin Multiplatform, MobileOps',
 'Mobile engineer focused on Android, iOS, and Kotlin Multiplatform. I care about clean architecture, reliable release pipelines, and tools that help teams ship better software.',
 'https://github.com/po4yka', 'hello@po4yka.dev', 'https://t.me/po4yka', 'https://linkedin.com/in/po4yka');
