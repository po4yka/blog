-- Performance indexes for frequently queried columns

CREATE INDEX IF NOT EXISTS idx_blog_posts_date ON blog_posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured DESC, date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured DESC, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_roles_sort_order ON roles(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
