---
layout: post
title: How does a small Transformer learn to reverse a string?
description: I train a Transfomer from scratch to predict the string reversal task. The model learns to leak positional information into the residual stream and performs the positional lookup in the MLP layer.
status: Finished
topic: Interpretability, positional encodings
---
## What is string reversal?
For some time I have been playing around with this string reversal task where the inputs look like this:
```
abcd=dcba
```
The task is to predict the reversed string `dcba` given the the input string `abcd`. The network learns to predict this for arbitrary input strings.

It seems trivial but to be able to generalise this task, the network needs to learn the following attention pattern in one of his attention heads: 

![[reversal_diagonal.png]]

In particular, the output token `=` has to attend to the input token `d`, output token `d` has to attend to input token `c` and so on. This forms an anti-diagonal shape in the attention head scores matrix.

### Is this anti-diagonal necessary for arbitrary Transformer model?