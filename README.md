# michalspiegel.github.io

Personal academic website and Markdown blog, built with Jekyll and hosted on
GitHub Pages.

## Write a post

Create a Markdown file in `_posts` named:

```text
YYYY-MM-DD-short-title.md
```

Start it with:

```yaml
---
layout: post
title: "My post title"
description: "The short summary shown on the blog page."
status: Work in progress
topic: Interpretability
read_time: ~6 min read
---
```

Then write the post below the second `---` using normal Markdown. It will be
rendered with the shared post layout and automatically appear on `/blog/`.

## Preview locally

Install Ruby 3.2+ and Bundler (the Ruby bundled with macOS is too old), then run:

```bash
bundle install
bundle exec jekyll serve
```

Open [http://localhost:4000](http://localhost:4000). GitHub Pages performs the
same Jekyll build automatically after a push.

## Structure

- `index.html` — about, news, publications, and CV
- `_posts/` — Markdown blog posts
- `_layouts/post.html` — shared post page template
- `blog/index.html` — automatically generated blog index
- `assets/` — shared styles and JavaScript
- `profile.jpg` — profile photo
