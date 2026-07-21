---
layout: post
title: "RoPE expressivity in small transformers"
description: "I want to know which positional lookups one- and two-layer Transformers can learn — and, more importantly, what mechanism they use to get there."
status: Work in progress
topic: Interpretability, positional encodings
---

This is my personal adventure after understanding how RoPE works in Transformers. This blogs plans to documents some experiments and hypotheses I tested in this space.

## Hypothesis 1: One-layer with one attention head is only able to model one static positional lookup.
