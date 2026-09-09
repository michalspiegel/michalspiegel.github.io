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


---

## AI note — machine-generated, unrevised

> **This section was written by an AI assistant (Claude) on 2026-08-24, extended 2026-09-09, not by
> me.** It is a working
> record of results and open decisions, dumped here so nothing is lost. The prose is not mine, the
> framing is provisional, and I intend to rewrite it. Read it as lab notes, not as claims I am
> standing behind yet. Numbered `#N` references are issues on a **private** tracker; they are here
> for my own continuity and will not mean much to a reader.

### Two demonstrations that a model can predict its own token positions

The hypothesis in §3.1 above now has evidence from two quite different tasks, and I think it is
the most interesting thing here — more interesting than whether the trick transfers to bigger
models, which it currently does not.

The setup in both cases: the model emits a token **and** a coordinate for that token, both from its
own forward pass. Nothing hands it the position. A per-layer head predicts `(row, col)` for the
*next* token, that prediction is fed back in as the M-RoPE position, and generation continues. The
model is laying out its own workspace as it writes into it.

**Demonstration one: long multiplication.** A 3.06M-parameter transformer — `d_model=248`, 2 heads,
4 layers — trained to write partial products onto a 2-D grid. It places its own digits with
teacher-forced coordinate accuracy around **0.99** and free-running coordinate accuracy around
**0.95**, on a task where it still makes arithmetic mistakes. Positions are the part it finds easy.

The causal intervention makes that concrete. On the failing cases, forcing the model's **tokens** to
the truth and letting it continue rescued **0 of 8**; forcing its **positions** rescued **7 of 8**.
The failures were positional, not arithmetic — and once the emission order was changed so that
coordinates become a monotone counter rather than something requiring carry-prediction, they largely
went away. The model was not bad at placing digits; it had been asked to know how wide a number was
before it had computed it.

**Demonstration two: maze solving by depth-first search.** This one I find more convincing, because
the coordinates are not a static labelling — they are a plan.

The model reads a maze and then writes onto it: entering a cell marks it, backtracking out of a dead
end erases it. Every write is a `(row, col)` the model chose. So the coordinate sequence *is* the
search: it has to decide where to go next as a function of where it has been, and when a branch
fails it has to navigate **back** to cells it wrote earlier in order to unmark them.

It learns this. Free-running on held-out mazes, it reproduces the reference depth-first traversal
step for step — token and coordinate — on **97%** of them, and emits **100%** of the backtracking
erasures. That last number is the one that matters: a model that had merely memorised "draw the
solution path" would score zero on it. This model explores, hits dead ends, and walks itself back
out.

Watching the workspace evolve is the clearest way to see it. Left, fourteen cells into a wrong
branch; right, after six erasures have removed it:

```
#########        #########
#S#ooooo#        #S#.....#
#o#####o#        #o#####.#
#ooooooo#        #ooooooo#
#######.#        #######.#
#.....#.#        #.....#.#
#.#####.#        #.#####.#
#......G#        #......G#
#########        #########
```

Between those two states the model wrote six coordinates it had visited before, in reverse order,
to undo its own work. Nothing in the architecture makes that easy — there is no stack, no pointer,
no explicit memory. It is attention over a sequence, with the model choosing the addresses.

So: **a transformer can predict positions for its own tokens, in more than one dimension, and can
use that coordinate space to plan rather than merely to label.** That holds for models trained from
scratch with the mechanism in place. The separate question — whether a pretrained language model can
have the same ability grafted on afterwards — is where the results below turn negative, and I think
those are two genuinely different claims that deserve not to be collapsed into one.

### Where the multiplication result actually stands

The ~80% free-running figure in §3.1 above comes from the `rope2d + sin2d` model. Running the same
recipe with only one of the two positional channels turns out to matter a great deal, and the
interesting number is not token accuracy but whether the coordinate head can read positions out of
the **prompt**:

| config | prompt coord acc | free-run exact (mean last-5) | free-run exact (best) |
|---|---|---|---|
| `rope2d + sin2d` | 0.950 | 0.290 | 0.450 |
| `rope2d` only | 0.362 | 0.100 | 0.175 |
| `sin2d` only | **0.968** | **0.350** | **0.475** |

(Prompt-coord accuracy at a matched step 1000; free-run exact match at length 40, over the full
20 000-step run. No configuration reached *any* out-of-distribution accuracy at length 60 — best OOD
is 0.000 for all three.)

Reading: RoPE hides position *inside attention scores*, where a per-token linear head cannot get at
it. `sin2d` writes an absolute `(row, col)` code additively into the residual stream, making it
linearly identifiable. That single change moves prompt-coordinate accuracy from 0.55 to 0.98, and
that cascades into 2–3x better free-running accuracy and 6–12x better mid-range length
generalisation. **Neither variant extrapolates past its training length at all** — OOD exact match
is 0.000 for both, which is the honest limitation of the whole result so far.

The third row is a new ablation with the rotary removed entirely, leaving the additive channel as
the sole source of position. **It finished, and it did not lose.** `sin2d` alone is nominally best on
every statistic — though 0.350 against 0.290 on mean-last-5, with standard deviations of 0.089 and
0.106, is parity rather than superiority. What is robust is that both `sin2d` cells beat `rope2d`
alone by roughly 3x. On this task the 2-D rotary looks close to redundant once the additive 2-D
channel is present, which is an uncomfortable thing to find in a project built around M-RoPE.

One caveat large enough to state up front: `val_samples=40`, and the headline "best" figures are a
max over 19 evaluations, which rewards whichever run drew luckiest. Consecutive late evals of the
`sin2d`-only run read 0.225, 0.125, 0.350, 0.075, 0.300 — from a model that was improving
monotonically. None of these numbers should be quoted as point estimates without more seeds. It required adding a `--supervised_rope nope` switch, since the
supervised-2D model had M-RoPE hardcoded. Verified clean: with both channels off the model becomes
exactly position-blind (output unchanged under permuted coordinates), so the ablation is not leaking
position through some other path.

A second finding worth recording: **the digit emission order was doing more damage than arithmetic
was.** On the original most-significant-digit-first checkpoint, forcing the model's *tokens* to
truth rescued 0 of 8 failing pairs, while forcing its *positions* rescued 7 of 8. Under MSD emission
the model must predict how wide a partial product is before emitting its first digit — implicitly
predicting carry propagation. Switching to least-significant-digit emission (column labels
unchanged, only the order flips) makes each digit depend only on columns already emitted, and the
failures largely disappear.

### The direction this is turning into

If a model can predict the position of its own tokens, the next question is whether it can *reuse*
one. **Rewrite-in-place attention**: when the model emits a token at a coordinate that is already
occupied, the new token supersedes the old one for all subsequent attention — mask and KV cache —
so the model edits its context instead of only appending to it. Expressible as a latest-writer-wins
attention mask rather than new machinery.

The natural test is not arithmetic but search: a maze solved depth-first, where the model writes
progress onto map cells and rewrites them when it backtracks out of a dead end.

The scope decision taken here is that this is **one arc, not two projects**: the mechanism is the
claim, toy tasks establish it, and adapting real LLMs to realistic rewrite-shaped tasks (code
patching, text editing, spreadsheet edits) is a separate later effort. The open decisions were
written up as a planning map with eight tickets:

- **#2 Rewrite semantics — what counts as the same position?** The foundational one. Exact
  coordinate equality or something looser; whether writing onto an input-map cell (overwriting a
  *prompt* token) is the same mechanism; whether deletion exists as its own operation or only as
  overwriting; and whether supersession is global or per-layer, given that layers can disagree about
  which position a token holds.
- **#3 Masking formulation and its cost.** Correctness looks easy — precompute
  `superseded_at[j] = min{k > j : pos[k] == pos[j]}`, admit key `kv` for query `q` iff
  `kv <= q and superseded_at[kv] > q`. Speed does not: FlexAttention earns its keep through 128x128
  block sparsity, and superseded tokens are *scattered*, so few blocks go fully empty. A dense mask
  may be no slower at toy scale.
- **#4 Lead toy task and trace schema.** Maze/DFS is the candidate. How the grid becomes coordinate
  tokens, what the model emits per step, what a rewrite means concretely (mark visited, erase a
  wrong path, or both), and how oracle DFS traces are generated deterministically enough to be
  learnable.
- **#5 Baseline set.** Chiefly append-only with identical coordinates and no supersession mask —
  making the model ignore stale cells itself. Without that ablation there is no mechanism claim.
- **#6 Success metrics.** Free-run exact match, coordinate accuracy, generalisation to bigger grids,
  and sequence-length saved versus append-only, which is where in-place editing should structurally
  win. Also what counts as *failure*, so the experiment can be falsified rather than tuned forever.
- **#7 Prior art.** Where this sits against memory-augmented architectures (NTM, DNC), edit and
  insertion transformers, discrete diffusion for text, and KV-cache eviction work — the last of
  which drops tokens for efficiency where this drops them for semantics.
- **#8 FlexAttention limits.** Whether a `mask_mod` can index a per-batch tensor, what rebuilding a
  `BlockMask` costs every decode step, and whether block sparsity means anything at all when
  `q_len=1` against a long cache.
- **#9 Positional backbone.** Which of the three configurations above the rewrite experiments build
  on. Blocked on the `sin2d`-only run finishing.

Two things are explicitly **out of scope** so the map can close: sequence/KV **compaction** to
actually reclaim the memory and compute that masking only hides — the sequence still grows with
every rewrite even though the logical state is bounded — and **adaptation to real LLMs**.

### A negative result I should not bury

An earlier attempt at the LLM direction — a `<pos>` token driving Qwen3-VL's idle M-RoPE height and
width axes, trained with GRPO plus LoRA — did not work, and its logs say something sharper than
"did not work". Supervised warm-start was fine: the model learned to emit `<pos>` reliably
(`<pos>_emit = 1.00`, retrieval accuracy 1.00 on the training distribution). But the ablation ran
the wrong way:

| context size | 2-D mechanism | `<pos>` emitted | retrieval acc |
|---|---|---|---|
| k=60 | on | 1.00 | 0.812 |
| k=60 | off | 0.56 | **0.875** |
| k=120 | on | 1.00 | 0.625 |
| k=120 | off | 0.44 | **1.000** |

Turning the mechanism **off** made retrieval better, and the gap widened with context length. On a
separate sweep the model dropped `<pos>` entirely (`<pos>_emit = 0.00` at every k) and scored
0.938 / 0.812 / 0.625 — fine without it. The RL run never got usable signal: reward was 0.000 on 11
of 18 logged iterations before it was killed, and `<pos>` usage sat pinned at the forced 50/50
sampling rate the whole time rather than moving.

Caveat that matters: the value granularity implies roughly **16 samples per cell, single seed**. The
k=120 gap is large enough to take seriously; the k=60 gap is noise. The honest reading is that
forcing a positional mechanism onto a frozen pretrained model may override a retrieval strategy it
already had with a worse one — but this needs a clean rerun before anyone believes it, and that
rerun belongs to the adaptation effort, not the mechanism one.
