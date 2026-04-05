# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Session archive and sync from local Claude Code sessions (`~/.claude/projects/`)
- Real-time conflict detection with severity classification (info / warning / critical)
- Dashboard with daily usage charts and 7-day activity stats
- PRD analysis with Claude-powered requirement tracking
- AI evaluation with multi-dimensional proficiency scoring
- Full-text search across sessions and messages (PostgreSQL tsvector)
- Team collaboration with role-based access (Owner / Member)
- Three deployment modes: Personal, Team Host, Team Member
- Structured markdown plans linked to projects
- Slack notification integration
- Supabase and self-hosted PostgreSQL remote database support
- One-command setup (`bash scripts/setup.sh`) with Node.js auto-install
- Session export (JSON, CSV)
