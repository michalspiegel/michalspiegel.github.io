---
layout: post
title: "Self-organizing positional encodings"
description: "Training models that learn to reorganize their own input in terms of position information."
status: Work in progress
topic: Positional encodings
---

I recently stumbled upon multimodal RoPE that is used in Qwen3-VL models to add 2D positional information to image patches. Fascinated by this idea, I wondered whether this could not be applied to text as well. Specifically algorithms like addition and multiplication.

## 1.1 What is MRoPE?
MRoPE was originally used for adding positional information to image patches. Qwen3-VL models have 3 positional dimensions: temporal, height and width. Text tokens are ordered along the temporal axis, image patches are processed using a vison encoder, flattened into the same temporal point and each patch is assigned a height and width coordinates. This way Qwen3-VL can naturally read text, recognize the temporal order of how information came to the context but it can also be able to work with 2D positional information on images. Pretty cool right? 

### 1.2 How is this done on the architectural level?
The whole `d_model` hidden state is split into 3 consecutive parts and each one is rotated differently based on the current position in the 3 specified dimensions of the current token. 

## 1.3 Could MRoPE help some other tasks? Like multiplication or addition?
I was thinking whether generalizing the concept of MRoPE into a general multidimensional RoPE could help some tasks like addition or multiplication. I have been thinking about these tasks for some time now and I struggled to teach it to models.
How could this help? After all, we humans also compute long multiplication and long addition with the operands aligned below each other, it is a natural way to express the two operands to be able to effectively compute the algorithm. It makes working with position (digits) much easier.

## 2.1 **Hypothesis:** Applying MRoPE to long addition helps generalization
Humans compute long addition naturally by aligning the two addition operands below each under and then adding digits of the same significance individually. We could express this positional adjustment using MRoPE:
```
[3][5][8][+]
[9][1][7]
[=]
[1][8][1][5]
```
Each token that is here enclosed by the square brackets has exactly 1 row and 1 column coordinate. I train a general decoder transformer with RoPE on this type of sequences and it learns to model the in-distribution samples very well and performs very well even on unseen in-distribution samples.

I was curious whether we could make it extrapolate. Inspired by the Abacus paper[^1], where they learn absolute per-digit position positional embeddings and than train the model by assigning the samples consecutive ascending indices with a random starting position to allow for length generalization. I do the same. And it works the same as Abacus. In fact, thinking about this, MRoPE applied to addition like this is Abacus reinvented. It seems it is very natural for the model to learn associate the corresponding digits together. In the case of Abacus, the absolute positional encodings help him do this association. In the case of MRoPE, all the corresponding digits have the same column position. 

**Finding:** 2.2 Using MRoPE helps long addition to generalize to unseen lengths and achieves the same results as Abacus[^1]

## 3.1 **Hypothesis:** Models can learn to predict positional information for their own tokens and in this way self-organize their context in terms of positions of tokens

I show this on the task of multiplication, I managed to train a very small transformer using rope2D+sin2D positional embeddings, d_model=248, 2 heads and 4 layers, I represent task in this fashion:
```
        col 3    col 2    col 1    col 0
row 0:     .        .        1        2          <-- A = 12
row 1:     .        .        1        2   *      <-- B = 12, then '=' ends prompt
row 2:     .        .        2        4   +      <-- partial 0 = 12 * 2 = 24
row 3:     .        1        2            =      <-- partial 1 = 12 * 1, shifted <<1 = 12
row 4:  <eos>       1        4        4          <-- final = 144
```

where the task and the numbers are represented in the most significant digit order, that is natural to humans, but computation happens in least-significant digit order first, that is the model first predicts digit 4 as token 1, digit 2 as token 2, then * as token 3, and then 2 as token 4, etc.

The model learns this astonishingly, achieves ~80% in free-running accuracy (where we let it predict position in free-running fashion, we do not correct it). model makes mistakes in arithmetics but position is predicted perfectly. This proves models can learn to model dynamic positional processes and predict the positions of their own tokens. In this way, restructure their own input so that the computation is easier.ß


[^1]: Transformers Can Do Arithmetic with the Right Embeddings, McLeish et al, [Link](https://arxiv.org/html/2405.17399v1)

