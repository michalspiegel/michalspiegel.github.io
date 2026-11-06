---
layout: post
title: How does a small Transformer learn to reverse a string?
description: I train a Transfomer from scratch to predict the string reversal task. The model learns to leak positional information into the residual stream and performs the positional lookup in the MLP layer.
status: Work in progress
topic: Interpretability, positional encodings
---
# What is string reversal?
For some time I have been playing around with this string reversal task where the inputs look like this:
```
abcd=dcba
```
The task is to predict the reversed string `dcba` given the the input string `abcd`. The network learns to predict this for arbitrary input strings.

It seems trivial but to be able to generalise this task, the network needs to learn the following attention pattern in one of his attention heads: 

![](reversal_diagonal.png)

In particular, the output token `=` has to attend to the input token `d`, output token `d` has to attend to input token `c` and so on. This forms an anti-diagonal shape in the attention head scores matrix.

#### Is this anti-diagonal necessary to solve the task for arbitrary Transformer model?
The attention module is the only Transformer component that allows information from other tokens to mix. This task heavily depends on previous tokens. The model cannot solve it without looking to the past at exactly these tokens. In reality, the transformer could split the pattern between multiple heads and layers, however, there must exist a subset of heads that together compose this exact pattern. Since the information about the next token flows strictly from the past tokens highlighted in the image above. 

In the next part we will be training a model from scratch to do this task and analyzing it's weights.
# Methodology
We train a *Qwen3* type of Transformer architecture across multiple hyperparameter settings: `d_model = {128, 256}, num_heads = {1, 2}, n_layers = {1, 2, 3}`. For the copy task, he input sequences are of the following form:
```
[BOS][rand_1][rand_2]...[rand_N][SEP][rand_1][rand_2]...[rand_N][EOS]
```
For the reversal task, the input sequences are the following:
```
[BOS][rand_1][rand_2]...[rand_N][SEP][rand_N]...[rand_2][rand_1][EOS]
```
The sequences always starts with a BOS token, followed by N randomly sampled tokens, a separator token `[SEP]`, followed by the same exact sequence of random tokens, either in the original order for the *copy task* or in the reversed order for the *reversal task*. The random tokens are always freshly sampled embeddings 

