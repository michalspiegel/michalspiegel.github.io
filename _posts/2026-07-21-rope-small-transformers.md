---
layout: post
title: "RoPE expressivity in small transformers"
description: "I want to know which positional lookups one- and two-layer Transformers can learn — and, more importantly, what mechanism they use to get there."
status: Work in progress
topic: Interpretability, positional encodings
---

This is my personal adventure after understanding how RoPE works in Transformers. I plan to investigate this by a series of experiments on small transformers and synthetic data.

## Hypothesis 1: One-layer with one attention head is only able to model one static positional lookup.

#### Experiment 1.1
Train 1-layer,1-head transformer with no MLP on sequences such as:
```
[BOS][RAND_1][RAND_2]...[RAND_n][EOS_i][RAND_i]
```
where we present the transformer with a sequence of random tokens (randomly sampled representations not even present in the vocabulary), and as specific EOS token indicating the specific static lookup i tokens back. The task is to output the exact representation with positional index i given token EOS_i, e.g. for EOS_5 we would have positional index 5 which would signify to retrieve token RAND_5 on the output.

We generate a synthetic dataset composed of samples like this. We control how many distinct lookups we want the model to learn through the EOS_i tokens. 

**Finding**: A transformer with only 1 layer, 1 attention head, no MLP layer is able to learn arbitrary number of distinct positional lookups.
**Why?**: I hypothesize this is because each EOS_i is a trainable vocabulary token and it learns a pre-rotated version of its specific positional lookup. So that even though the rotation in the Key/Query projection matrice is the same for each of these tokens, after Key/Query projection rotation they land at their respective positional lookup tokens. We could verify this by measuring whether the raw embeddings of these tokens have some rotational relationship between each other.



