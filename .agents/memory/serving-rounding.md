---
name: Serving rounding
description: Why the serving helper treats floating-point values near whole numbers as exact integers.
---

The universal serving rule is mathematically `ceil(guest count × serving factor)`, but decimal factors such as `1.1` can produce a value just above an integer in JavaScript. The shared helper should treat only near-integer floating-point noise as the intended integer and preserve real fractional values for the ceiling.

**Why:** Without this tolerance, 100 guests at 1.1 servings becomes 111 instead of the intended 110.

**How to apply:** Keep the tolerance centralized in the serving helper rather than adding per-meal rounding workarounds in ingredient or plan calculations.