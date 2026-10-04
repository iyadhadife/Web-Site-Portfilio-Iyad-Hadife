# 3D Part Detection with GNNs in CATIA

**Context:** final-year internship at Dassault Systèmes, Customer Strategic Partnership, Transportation & Mobility Innovation Lab (Feb – Aug 2026)
**Role:** improving and extending an existing pipeline, as part of a team

## The problem

In a vehicle's digital mock-up, engineers take control measurements between parts by hand, for example the space between a rear passenger's knees and the front seat back (*Knee Clearance*). The goal was to let a Machine Learning model recognize the relevant parts automatically, then generate the measurement without manual work.

<div class="confidential-note">

🔒 **Confidential details.** The rest (method, detailed contribution, results) covers an internal Dassault Systèmes and customer project, so it is intentionally blurred. [Contact me](/contact) and I will gladly walk you through it in person.

</div>

<div class="confidential" aria-hidden="true">

## Who did what

This was a team project:

- **Project management:** a member of the CSP T&M Innovation Lab team.
- **Original GNN model and extraction scripts:** an expert from the CATIA Generative Experience team, with whom I then co-developed.
- **My contribution:** when I joined, the pipeline had only been applied to a single vehicle. I:
  - extended extraction and training to **new vehicle models** (labeling, formatting, extraction, graph structuring);
  - built a **training dataset** from internal data and data supplied by the customer;
  - fixed the extraction scripts for **edge cases** that broke on some vehicles;
  - **reworked curve extraction** and added surface grouping;
  - re-ran and tuned **GNN training** (hyperparameters);
  - optimized end-to-end **inference time**.

## The pipeline

1. **Feature extraction in CATIA Visual Scripting:** points (coordinates), curves (length, closed, planar, end points, Douglas-Peucker complexity), surfaces (bounding box, mean-plane normal, projected sections), solids (bounding box, number of domains, projected areas) and type flags, exported to CSV.
2. **Graph conversion:** each geometric entity becomes a node. An edge links two nearby entities (distance threshold) and carries the interaction type (e.g. point–surface).
3. **Data augmentation:** random rotations and translations during training, so the model learns topology rather than absolute coordinates.
4. **Automatic measurement:** a CATIA script reads the predicted points and creates the 3D dimension.

## My technical improvements

- **Curves:** each curve used to be sampled as 5 points, which was redundant and ignored its real length. I replaced this with a global description: length, closed, planar, start and end points, bounding box and Douglas-Peucker complexity.
- **Grouping surfaces by continuity:** a first Python version wrongly merged unconnected surfaces. I used a native Visual Scripting function based on surface borders, plus specific handling for overlapping surfaces.
- **Robustness:** error handlers with default values, and filtering of invalid entities returned by some nodes (e.g. *Extremum*).

## Results

- End-to-end inference time: **from 5–10 min down to 3–7 min** depending on the model.
- Graphs **2× lighter**, loss **10× lower**, with precision and F1-score staying close.
- On a new vehicle, the model went from recognizing no parts to recognizing them **approximately**: most labels were correct or close (inner and outer roof correctly identified, but the outer door panel picked instead of the inner one).
- Training metrics dropped compared with the single-vehicle version, but the model generalizes much better.
- The project was later **put on hold** in favor of another, non-Machine-Learning method.

## Technologies

PyTorch, PyTorch Geometric, Python, CATIA Visual Scripting, CATIA Part Design, Generative Assembly, 3DEXPERIENCE, Git, Jira

> Code and data are confidential (Dassault Systèmes and its customer) and are not published.

</div>
