# Internal RAG Chatbot for the SFR Lab

**Context:** last week of my internship at SFR, Vélizy Lab (August 2025)
**Role:** built on my own in a few days

## Goal

Give the team an assistant that could:

1. read and understand a PCAP file;
2. know the Vélizy Lab's processes;
3. explain simple domain definitions;
4. answer practical questions (for example, how to get to the coffee machine).

## How it works

The chatbot uses **RAG (Retrieval-Augmented Generation)**:

- it retrieves relevant passages from a **local database**;
- it enriches the context with **web scraping**;
- it splits large documents into *chunks* and injects the most relevant context into the prompt;
- an LLM integrated through **LangChain** and **Hugging Face** generates the answer, fully **locally**.

## Outcome

The delivered chatbot covered needs 2 to 4. Reading PCAP files (need 1) was left for later due to lack of time.

## Technologies

Python, LangChain, Hugging Face, RAG, web scraping
