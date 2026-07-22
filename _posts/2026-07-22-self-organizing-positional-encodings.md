---
layout: post
title: "Self-organizing positional encodings"
description: "Training models that learn to reorganize their own input in terms of position information."
status: Work in progress
topic: Positional encodings
---

I recently stumbled upon multidimensional RoPE that is used in Qwen3-VL models to add 2D positional information to image patches. Fascinated by this idea, I wondered whether this could not be applied to text as well. Specifically algorithms like addition and multiplication.

## **Hypothesis:** Applying MRoPE to long addition helps generalization
Humans compute long addition naturally by aligning the two addition operands below each under and then adding digits of the same significance individually. We could express this positional adjustment using MRoPE. 

Applying this together with a little trick to teach the model OOD RoPE rotations without actually training on longer sequences. I artificially introduce "positional holes" in the sequences:
```
[3][5][8][+]
[9][1][7]
[=]
[1][8][1][5]
```
**Finding:** True

