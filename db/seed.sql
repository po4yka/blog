-- Auto-generated from source files. Do not edit manually.
-- Run "npm run generate:all" to regenerate.


-- Categories
INSERT INTO categories (name) VALUES
('All');

-- Projects
INSERT INTO projects (id, name, description, platforms, tags, links, featured, sort_order) VALUES
('meridian', 'Meridian',
 'Cross-platform habit tracker built with Kotlin Multiplatform. Shared business logic, native UI on both platforms.',
 '["Android","iOS"]', '["KMP","Compose","SwiftUI","SQLDelight","Ktor"]',
 '[{"type":"GitHub","href":"#"},{"type":"Google Play","href":"#"},{"type":"App Store","href":"#"}]', 1, 0),
('deploybot', 'Deploybot',
 'Internal release automation tool for mobile teams. Manages build variants, signing configs, and distribution channels.',
 '["Android"]', '["MobileOps","Gradle Plugin","Internal Tooling","CLI","Fastlane"]',
 '[{"type":"GitHub","href":"#"}]', 0, 1),
('compose-metrics', 'Compose Metrics Dashboard',
 'Visualization tool for Jetpack Compose compiler metrics. Tracks recomposition counts, stability, and performance regressions.',
 '["Android"]', '["Compose","Performance","Tooling","Compiler Metrics"]',
 '[{"type":"GitHub","href":"#"},{"type":"Google Play","href":"#"}]', 0, 2),
('castaway', 'Castaway',
 'Podcast player with offline-first architecture. Background downloads, queue management, and playback speed control.',
 '["iOS"]', '["Swift","AVFoundation","CoreData","Offline-first"]',
 '[{"type":"GitHub","href":"#"},{"type":"App Store","href":"#"}]', 0, 3),
('kmp-starter', 'KMP Starter',
 'Opinionated project template for Kotlin Multiplatform apps. Pre-configured CI, dependency injection, and modular architecture.',
 '["Android","iOS"]', '["KMP","Template","Architecture","CI/CD"]',
 '[{"type":"GitHub","href":"#"}]', 0, 4),
('logline', 'Logline',
 'Structured logging library for Android with Timber-compatible API. Ships logs to remote collectors with batching and retry.',
 '["Android"]', '["Kotlin","Logging","Library","Timber"]',
 '[{"type":"GitHub","href":"#"}]', 0, 5);

-- Roles
INSERT INTO roles (id, period, company, title, description, tags, sort_order) VALUES
('freelance', '2023 — Present', 'Freelance / Independent', 'Mobile Engineer & Consultant',
 'Building apps and tooling for clients. Focus on KMP architecture, release automation, and CI/CD pipelines for mobile teams.',
 '["KMP","MobileOps","Architecture"]', 0),
('tech-company', '2021 — 2023', 'Tech Company', 'Senior Android Developer',
 'Led the Android platform team. Migrated from XML to Compose, built modularization strategy, reduced build times by 40%.',
 '["Android","Compose","Gradle"]', 1),
('startup', '2019 — 2021', 'Startup', 'Mobile Developer',
 'Full-cycle mobile development for a product-stage startup. Built features across Android and iOS, set up CI/CD from scratch.',
 '["Android","iOS","CI/CD"]', 2),
('university', '2018 — 2019', 'University / Open Source', 'Junior Developer',
 'Started contributing to open source Android libraries. Built first production app. Learned Kotlin, RxJava, and clean architecture.',
 '["Kotlin","Open Source"]', 3);

-- Site settings
INSERT INTO site_settings (id, name, handle, role, bio, github, email, telegram, linkedin) VALUES
(1, 'Nikita Pochaev', '@po4yka',
 'Mobile Developer — Android, iOS, Kotlin Multiplatform, MobileOps',
 'Mobile engineer focused on Android, iOS, and Kotlin Multiplatform. I care about clean architecture, reliable release pipelines, and tools that help teams ship better software.',
 'https://github.com/po4yka', 'hello@po4yka.dev', 'https://t.me/po4yka', 'https://linkedin.com/in/po4yka');
