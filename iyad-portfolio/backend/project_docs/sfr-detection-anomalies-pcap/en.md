# Network Anomaly Detection in PCAP Files

**Context:** Data Scientist / Data Engineer internship at SFR, "PFS Tests & Validation Platform" team, Vélizy Lab (April 15 – August 29, 2025)
**Role:** designed and built the project end to end, supervised by my manager and supported by a network expert who generated the data

## The problem

At the Vélizy Lab (a miniature SFR network), validators manually analyze the logs and **PCAP** files produced by equipment during a call before anything goes to production. This is slow, and not every file can be checked. The goal was to bring in AI to answer three questions: **is there an anomaly, which one, and on which equipment?** The project started from scratch, with no prior technical groundwork.

## Tool 1: classifying the anomaly type

**Data preparation:** PCAP → **Tshark** extraction → JSON → three representations:

- a **graph** (nodes = equipment, directed edges = messages) handled by a **GNN** (GAT and NNConv layers, message passing, global pooling, then linear layers);
- a **sequence** of packets handled by an **RNN** (LSTM/GRU);
- a **global vector** produced by a tokenizer (BERT, then GPT-2) and handled by a **DNN**.

I also tried unsupervised approaches (autoencoders, VAEs, graph VAE), but they plateaued at around 55%.

**Gradual scale-up:** 2, then 6, 22 and finally 40 anomaly classes, with about 100 PCAPs per class and a single call-flow type.

**Results:**
- GNN: 100% on 2 and 6 classes, and about **81%** on 40 classes, despite an incomplete dataset with some nearly empty classes.
- RNN: no more than 55%, below a plain DNN, because there was no label per packet.
- The classification tool is **working**.

## Tool 2: locating anomalies (prototype)

The dataset contained almost only end-of-call errors, which ruled out a supervised localization model. The project therefore turned to LLMs, based on the *LLMcap* paper (arXiv, 2024):

1. the PCAP is split into *chunks*;
2. a **masked language model (MLM)**, trained on **error-free** calls, reconstructs the masked parts;
3. a reconstruction error score is computed for each chunk, then a threshold separates suspicious chunks.

A small MLM (under one million parameters) was trained so it could run on a CPU server. Results are shown in a **Flask web interface** that highlights suspicious areas and lets validators leave feedback to build labeled data. This part remained **a prototype**.

## Industrialization and next steps

- Code versioned on **GitLab**, training runs launched through **Jenkins** pipelines on a dedicated server.
- READMEs written for whoever takes over.
- Two presentations to management (mid-term and end of internship). The project was judged worth further investment.

## Technologies

Python, PyTorch, PyTorch Geometric, PyTorch Geometric Temporal, Hugging Face (BERT, GPT-2), Tshark, Flask, scikit-learn, GitLab, Jenkins

> The source code is confidential (SFR) and is not published.
